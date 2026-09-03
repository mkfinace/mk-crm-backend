import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

const TEST_DRIVE_STATUSES = ['SCHEDULED', 'COMPLETED', 'CANCELLED'];

@Injectable()
export class TestDrivesService {
  constructor(private prisma: PrismaService, private realtime: RealtimeGateway) {}

  async createTestDrive(data: { leadId: string; scheduledAt: string }, _changedBy?: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id: data.leadId } });
    if (!lead) throw new NotFoundException('Lead not found.');
    const testDrive = await this.prisma.testDrive.create({
      data: { leadId: data.leadId, scheduledAt: new Date(data.scheduledAt) },
    });
    this.realtime.notifyLeadUpdated(data.leadId);
    return testDrive;
  }

  async createMyTestDrive(customerId: string, data: { leadId: string; scheduledAt: string }) {
    const scheduledAt = new Date(data.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) throw new BadRequestException('Invalid test-drive date/time.');
    if (scheduledAt.getTime() <= Date.now()) throw new BadRequestException('Test-drive time must be in the future.');

    const lead = await this.prisma.lead.findUnique({ where: { id: data.leadId }, select: { id: true, customerId: true } });
    if (!lead) throw new NotFoundException('Enquiry not found.');
    if (lead.customerId !== customerId) throw new ForbiddenException('You can only book a test drive for your own enquiry.');

    const active = await this.prisma.testDrive.findFirst({ where: { leadId: data.leadId, status: 'SCHEDULED' }, orderBy: { scheduledAt: 'desc' } });
    if (active) throw new BadRequestException('A test drive is already scheduled for this enquiry.');

    const testDrive = await this.prisma.testDrive.create({
      data: { leadId: data.leadId, scheduledAt, status: 'SCHEDULED' },
    });
    this.realtime.notifyLeadUpdated(data.leadId);
    return testDrive;
  }

  listTestDrives(leadId?: string) {
    return this.prisma.testDrive.findMany({ where: leadId ? { leadId } : {}, orderBy: { scheduledAt: 'desc' } });
  }

  async updateTestDrive(id: string, data: { scheduledAt?: string; status?: string; feedback?: string }, _changedBy?: string) {
    const testDrive = await this.prisma.testDrive.findUnique({ where: { id } });
    if (!testDrive) throw new NotFoundException('Test drive not found.');
    if (data.status && !TEST_DRIVE_STATUSES.includes(data.status)) throw new BadRequestException(`Invalid status: ${data.status}. Must be one of ${TEST_DRIVE_STATUSES.join(', ')}.`);
    const updated = await this.prisma.testDrive.update({ where: { id }, data: { scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined, status: data.status, feedback: data.feedback } });
    this.realtime.notifyLeadUpdated(testDrive.leadId);
    return updated;
  }

  async deleteTestDrive(id: string, _changedBy?: string) {
    const testDrive = await this.prisma.testDrive.findUnique({ where: { id } });
    if (!testDrive) throw new NotFoundException('Test drive not found.');
    const deleted = await this.prisma.testDrive.delete({ where: { id } });
    this.realtime.notifyLeadUpdated(testDrive.leadId);
    return deleted;
  }
}
