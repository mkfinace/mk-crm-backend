import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BanksService {
  constructor(private prisma: PrismaService) {}

  createBank(data: { name: string; phone?: string; email?: string }) {
    return this.prisma.bank.create({ data });
  }

  listBanks() {
    return this.prisma.bank.findMany({ where: { status: 'ACTIVE' }, include: { branches: true } });
  }

  async getBank(id: string) {
    const bank = await this.prisma.bank.findUnique({
      where: { id },
      include: { branches: true, executives: { include: { user: true, branch: true } } },
    });
    if (!bank) throw new NotFoundException('Bank not found.');
    return bank;
  }

  async updateBank(id: string, data: { name?: string; phone?: string; email?: string }) {
    const bank = await this.prisma.bank.findUnique({ where: { id } });
    if (!bank) throw new NotFoundException('Bank not found.');
    return this.prisma.bank.update({ where: { id }, data });
  }

  async deleteBank(id: string) {
    const bank = await this.prisma.bank.findUnique({ where: { id } });
    if (!bank) throw new NotFoundException('Bank not found.');
    try {
      return await this.prisma.bank.delete({ where: { id } });
    } catch (e) {
      throw new BadRequestException('Cannot delete this bank — it still has branches, executives, or finance cases linked to it.');
    }
  }

  async createBranch(bankId: string, data: { name: string; city?: string; serviceArea?: string; vehicleEligibilityJson?: string }) {
    const bank = await this.prisma.bank.findUnique({ where: { id: bankId } });
    if (!bank) throw new NotFoundException('Bank not found.');
    return this.prisma.bankBranch.create({ data: { ...data, bankId } });
  }

  listBranches(bankId: string) {
    return this.prisma.bankBranch.findMany({ where: { bankId } });
  }

  async assignExecutive(bankId: string, userId: string, branchId?: string) {
    const bank = await this.prisma.bank.findUnique({ where: { id: bankId } });
    if (!bank) throw new NotFoundException('Bank not found.');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');
    return this.prisma.financeExecutive.create({ data: { bankId, userId, branchId } });
  }
}
