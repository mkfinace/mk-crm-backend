import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DealersService {
  constructor(private prisma: PrismaService) {}

  createDealer(data: { name: string; brandId?: string; address?: string; city?: string }) {
    return this.prisma.dealer.create({ data });
  }

  listDealers() {
    return this.prisma.dealer.findMany({
      where: { status: 'ACTIVE' },
      include: { branches: true },
    });
  }

  async getDealer(id: string) {
    const dealer = await this.prisma.dealer.findUnique({
      where: { id },
      include: {
        branches: true,
        managers: { include: { user: true } },
        executives: { include: { user: true, branch: true } },
      },
    });
    if (!dealer) throw new NotFoundException('Dealer not found.');
    return dealer;
  }

  async updateDealer(id: string, data: { name?: string; brandId?: string; address?: string; city?: string }) {
    const dealer = await this.prisma.dealer.findUnique({ where: { id } });
    if (!dealer) throw new NotFoundException('Dealer not found.');
    return this.prisma.dealer.update({ where: { id }, data });
  }

  async deleteDealer(id: string) {
    const dealer = await this.prisma.dealer.findUnique({ where: { id } });
    if (!dealer) throw new NotFoundException('Dealer not found.');
    try {
      return await this.prisma.dealer.delete({ where: { id } });
    } catch (e) {
      throw new BadRequestException('Cannot delete this dealer — it still has branches, executives, or leads linked to it.');
    }
  }

  async createBranch(dealerId: string, data: { name: string; address?: string; city?: string }) {
    const dealer = await this.prisma.dealer.findUnique({ where: { id: dealerId } });
    if (!dealer) throw new NotFoundException('Dealer not found.');
    return this.prisma.dealerBranch.create({ data: { ...data, dealerId } });
  }

  listBranches(dealerId: string) {
    return this.prisma.dealerBranch.findMany({ where: { dealerId } });
  }

  async assignManager(dealerId: string, userId: string) {
    const dealer = await this.prisma.dealer.findUnique({ where: { id: dealerId } });
    if (!dealer) throw new NotFoundException('Dealer not found.');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');
    return this.prisma.dealerManager.create({ data: { dealerId, userId } });
  }

  async assignExecutive(dealerId: string, userId: string, branchId?: string) {
    const dealer = await this.prisma.dealer.findUnique({ where: { id: dealerId } });
    if (!dealer) throw new NotFoundException('Dealer not found.');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');
    return this.prisma.dealerExecutive.create({ data: { dealerId, userId, branchId } });
  }
}
