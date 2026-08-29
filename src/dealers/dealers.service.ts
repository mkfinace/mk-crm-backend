import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DealersService {
  constructor(private prisma: PrismaService) {}

  createDealer(data: { name: string; brandId?: string; address?: string; city?: string; phone?: string; email?: string }) {
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

  async updateDealer(id: string, data: { name?: string; brandId?: string; address?: string; city?: string; phone?: string; email?: string }) {
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

  // ---- Bank tie-ups — which banks a dealer's finance cases are restricted
  // to. Admin decides this; the lead's Finance Case bank dropdown then only
  // offers these banks (falls back to "all banks" if none configured yet).
  async getDealerBanks(dealerId: string) {
    const rows = await this.prisma.dealerBank.findMany({ where: { dealerId }, include: { bank: true } });
    return rows.map((r) => r.bank);
  }

  async setDealerBanks(dealerId: string, bankIds: string[]) {
    const dealer = await this.prisma.dealer.findUnique({ where: { id: dealerId } });
    if (!dealer) throw new NotFoundException('Dealer not found.');
    await this.prisma.dealerBank.deleteMany({ where: { dealerId } });
    if (bankIds.length > 0) {
      await this.prisma.dealerBank.createMany({ data: bankIds.map((bankId) => ({ dealerId, bankId })) });
    }
    return this.getDealerBanks(dealerId);
  }
}
