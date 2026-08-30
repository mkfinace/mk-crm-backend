import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogsService } from '../auditlogs/auditlogs.service';
import { FeaturesService } from '../features/features.service';
import { ColoursService } from '../colours/colours.service';
import { WarrantyService } from '../warranty/warranty.service';
import { DynamicFieldsService } from '../dynamic-fields/dynamic-fields.service';

const CHANGE_TYPES = ['FIELD_VALUES', 'FEATURES', 'COLOURS', 'WARRANTY'];

@Injectable()
export class CarDataSubmissionsService {
  constructor(
    private prisma: PrismaService,
    private auditLogs: AuditLogsService,
    private features: FeaturesService,
    private colours: ColoursService,
    private warranty: WarrantyService,
    private dynamicFields: DynamicFieldsService,
  ) {}

  async createSubmission(data: { variantId: string; changeType: string; payload: any; summary?: string }, submittedBy: string) {
    const variant = await this.prisma.variant.findUnique({ where: { id: data.variantId }, include: { model: { include: { brand: true } } } });
    if (!variant) throw new NotFoundException('Variant not found.');
    if (!CHANGE_TYPES.includes(data.changeType)) throw new BadRequestException(`Invalid change type: ${data.changeType}`);

    const submission = await this.prisma.carDataSubmission.create({
      data: {
        variantId: data.variantId,
        changeType: data.changeType,
        payloadJson: JSON.stringify(data.payload),
        summary: data.summary || `${data.changeType.replace('_', ' ').toLowerCase()} update for ${variant.model.brand.name} ${variant.model.name} ${variant.name}`,
        submittedBy,
      },
    });
    await this.auditLogs.logAction(submittedBy, 'CarDataSubmission', submission.id, 'CAR_DATA_SUBMITTED', undefined, { changeType: data.changeType, variantId: data.variantId });
    return submission;
  }

  listSubmissions(status?: string, variantId?: string, submittedBy?: string) {
    return this.prisma.carDataSubmission.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(variantId ? { variantId } : {}),
        ...(submittedBy ? { submittedBy } : {}),
      },
      include: { variant: { include: { model: { include: { brand: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSubmission(id: string) {
    const submission = await this.prisma.carDataSubmission.findUnique({
      where: { id },
      include: { variant: { include: { model: { include: { brand: true } } } } },
    });
    if (!submission) throw new NotFoundException('Submission not found.');
    return { ...submission, payload: JSON.parse(submission.payloadJson) };
  }

  async approveSubmission(id: string, reviewedBy: string, reviewNotes?: string) {
    const submission = await this.prisma.carDataSubmission.findUnique({ where: { id } });
    if (!submission) throw new NotFoundException('Submission not found.');
    if (submission.status !== 'PENDING') throw new BadRequestException('This submission has already been reviewed.');

    const payload = JSON.parse(submission.payloadJson);

    // Actually apply the change — reuses each module's own live-write logic,
    // so approval behaves exactly like an Admin editing it directly.
    switch (submission.changeType) {
      case 'FIELD_VALUES':
        for (const item of payload.items || []) {
          await this.dynamicFields.setValue({ variantId: submission.variantId, ...item });
        }
        break;
      case 'FEATURES':
        await this.features.setVariantFeatures(submission.variantId, payload.items || []);
        break;
      case 'COLOURS':
        await this.colours.setVehicleColoursByVariant(submission.variantId, payload.items || []);
        break;
      case 'WARRANTY':
        await this.warranty.upsertByVariant(submission.variantId, payload);
        break;
      default:
        throw new BadRequestException(`Cannot apply unknown change type: ${submission.changeType}`);
    }

    const updated = await this.prisma.carDataSubmission.update({
      where: { id },
      data: { status: 'APPROVED', reviewedBy, reviewNotes, reviewedAt: new Date() },
    });
    await this.auditLogs.logAction(reviewedBy, 'CarDataSubmission', id, 'CAR_DATA_APPROVED', undefined, { changeType: submission.changeType });
    return updated;
  }

  async rejectSubmission(id: string, reviewedBy: string, reviewNotes?: string) {
    const submission = await this.prisma.carDataSubmission.findUnique({ where: { id } });
    if (!submission) throw new NotFoundException('Submission not found.');
    if (submission.status !== 'PENDING') throw new BadRequestException('This submission has already been reviewed.');

    const updated = await this.prisma.carDataSubmission.update({
      where: { id },
      data: { status: 'REJECTED', reviewedBy, reviewNotes, reviewedAt: new Date() },
    });
    await this.auditLogs.logAction(reviewedBy, 'CarDataSubmission', id, 'CAR_DATA_REJECTED', undefined, { reviewNotes });
    return updated;
  }
}
