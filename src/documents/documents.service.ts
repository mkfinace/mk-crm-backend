import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

const VALID_STATUSES = ['VERIFIED', 'REJECTED'];

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService, private realtime: RealtimeGateway) {}

  async createDocument(data: { leadId: string; type: string; fileUrl: string; uploadedBy: string; personType?: string; personName?: string }) {
    const lead = await this.prisma.lead.findUnique({ where: { id: data.leadId } });
    if (!lead) throw new NotFoundException('Lead not found.');
    const doc = await this.prisma.document.create({
      data: {
        leadId: data.leadId,
        type: data.type,
        fileUrl: data.fileUrl,
        uploadedBy: data.uploadedBy,
        status: 'UPLOADED',
        personType: data.personType || 'APPLICANT',
        personName: data.personName,
      },
    });
    this.realtime.notifyLeadUpdated(data.leadId);
    return doc;
  }

  listDocuments(leadId?: string) {
    return this.prisma.document.findMany({
      where: leadId ? { leadId } : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  async verifyDocument(id: string, status: string, verifiedBy: string, rejectionReason?: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found.');
    if (!VALID_STATUSES.includes(status)) {
      throw new BadRequestException(`Invalid status: ${status}. Must be VERIFIED or REJECTED.`);
    }
    if (status === 'REJECTED' && !rejectionReason) {
      throw new BadRequestException('Rejection reason is mandatory when rejecting a document.');
    }
    const updated = await this.prisma.document.update({
      where: { id },
      data: {
        status,
        verifiedBy,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
      },
    });
    this.realtime.notifyLeadUpdated(doc.leadId);
    return updated;
  }

  async reuploadDocument(id: string, fileUrl: string, uploadedBy: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found.');
    const updated = await this.prisma.document.update({
      where: { id },
      data: {
        fileUrl,
        uploadedBy,
        status: 'PENDING',
        rejectionReason: null,
        verifiedBy: null,
        version: doc.version + 1,
      },
    });
    this.realtime.notifyLeadUpdated(doc.leadId);
    return updated;
  }

  async deleteDocument(id: string, _changedBy?: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found.');
    const deleted = await this.prisma.document.delete({ where: { id } });
    this.realtime.notifyLeadUpdated(doc.leadId);
    return deleted;
  }
}
