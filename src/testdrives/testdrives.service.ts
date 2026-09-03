import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

  listTestDrives(leadId?: string) {
    return this.prisma.testDrive.findMany({
      where: leadId ? { leadId } : {},
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async updateTestDrive(id: string, data: { scheduledAt?: string; status?: string; feedback?: string }, _changedBy?: string) {
    const testDrive = await this.prisma.testDrive.findUnique({ where: { id } });
    if (!testDrive) throw new NotFoundException('Test drive not found.');
    if (data.status && !TEST_DRIVE_STATUSES.includes(data.status)) {
      throw new BadRequestException(`Invalid status: ${data.status}. Must be one of ${TEST_DRIVE_STATUSES.join(', ')}.`);
    }
    const updated = await this.prisma.testDrive.update({
      where: { id },
      data: {
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        status: data.status,
        feedback: data.feedback,
      },
    });
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
