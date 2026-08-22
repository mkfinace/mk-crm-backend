import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: {
    name: string;
    mobile: string;
    email?: string;
    password: string;
    role: string; // matches UserRole enum
    dealerId?: string;
    bankId?: string;
  }) {
    const existing = await this.prisma.user.findUnique({ where: { mobile: data.mobile } });
    if (existing) throw new BadRequestException('A user with this mobile number already exists.');

    const passwordHash = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        name: data.name,
        mobile: data.mobile,
        email: data.email,
        passwordHash,
        role: data.role as any,
        dealerId: data.dealerId,
        bankId: data.bankId,
      },
    });
  }

  listUsers(role?: string) {
    return this.prisma.user.findMany({
      where: role ? { role: role as any } : {},
      select: { id: true, name: true, mobile: true, email: true, role: true, status: true, dealerId: true, bankId: true, createdAt: true },
    });
  }

  async toggleActive(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new BadRequestException('User not found.');
    return this.prisma.user.update({
      where: { id },
      data: { status: user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' },
    });
  }

  async verifyPassword(mobile: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { mobile } });
    if (!user || !user.passwordHash) return null;
    if (user.status !== 'ACTIVE') return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    return valid ? user : null;
  }
}
