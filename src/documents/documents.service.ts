import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const VALID_STATUSES = ['VERIFIED', 'REJECTED'];

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async createDocument(data: { leadId: string; type: string; fileUrl: string; uploadedBy: string }) {
    const lead = await this.prisma.lead.findUnique({ where: { id: data.leadId } });
    if (!lead) throw new NotFoundException('Lead not found.');
    return this.prisma.document.create({
      data: {
        leadId: data.leadId,
        type: data.type,
        fileUrl: data.fileUrl,
        uploadedBy: data.uploadedBy,
        status: 'UPLOADED',
      },
    });
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
    return this.prisma.document.update({
      where: { id },
      data: {
        status,
        verifiedBy,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
      },
    });
  }

  async reuploadDocument(id: string, fileUrl: string, uploadedBy: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found.');
    return this.prisma.document.update({
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
  }

  async deleteDocument(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found.');
    return this.prisma.document.delete({ where: { id } });
  }
}
