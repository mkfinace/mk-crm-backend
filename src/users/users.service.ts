import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
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
    role: string;
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

  async updateUser(id: string, data: {
    name?: string;
    mobile?: string;
    email?: string;
    password?: string;
    role?: string;
    dealerId?: string;
    bankId?: string;
  }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new BadRequestException('User not found.');

    const updateData: any = {
      name: data.name,
      mobile: data.mobile,
      email: data.email,
      dealerId: data.dealerId,
      bankId: data.bankId,
    };
    if (data.role) updateData.role = data.role as any;
    if (data.password) updateData.passwordHash = await bcrypt.hash(data.password, 10);

    return this.prisma.user.update({ where: { id }, data: updateData });
  }

  async toggleActive(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new BadRequestException('User not found.');
    return this.prisma.user.update({
      where: { id },
      data: { status: user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' },
    });
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new BadRequestException('User not found.');
    try {
      return await this.prisma.user.delete({ where: { id } });
    } catch (e) {
      throw new BadRequestException('Cannot delete this user — they have leads, activities, or other records linked to them. Deactivate instead using toggle-active.');
    }
  }

  async verifyPassword(mobile: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { mobile } });
    if (!user || !user.passwordHash) return null;
    if (user.status !== 'ACTIVE') return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    return valid ? user : null;
  }

  // Emergency password reset — for when nobody can log in yet (e.g. the
  // very first SUPER_ADMIN forgot their password, or an account got locked
  // before any other admin existed). Protected by SEED_KEY, same pattern as
  // the other one-off /admin/... routes elsewhere in this API.
  async resetPasswordEmergency(mobile: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { mobile } });
    if (!user) throw new BadRequestException('No user found with that mobile number.');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash, status: 'ACTIVE' } });
    return { success: true, message: `Password reset for ${user.name} (${user.role}). You can log in now.` };
  }

  // ---- Self-service "Forgot Password" (OTP-based, no admin help needed) ----
  async requestPasswordResetOtp(mobile: string) {
    const user = await this.prisma.user.findUnique({ where: { mobile } });
    // Same response whether or not the account exists — don't reveal which
    // mobile numbers have staff accounts.
    if (!user || user.status !== 'ACTIVE') {
      return { success: true, message: 'If that mobile number has an active staff account, an OTP has been sent.' };
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min validity
    await this.prisma.otpCode.create({ data: { mobile, code, userId: user.id, expiresAt } });
    console.log(`[DEV MODE] Password-reset OTP for ${mobile}: ${code}`); // stand-in for SMS send

    return {
      success: true,
      message: 'If that mobile number has an active staff account, an OTP has been sent.',
      devOtp: code, // ⚠️ remove once a real SMS gateway is wired in
    };
  }

  async resetPasswordWithOtp(mobile: string, code: string, newPassword: string) {
    const otp = await this.prisma.otpCode.findFirst({
      where: { mobile, code, verified: false, userId: { not: null } },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp) throw new UnauthorizedException('Invalid OTP.');
    if (otp.expiresAt < new Date()) throw new UnauthorizedException('OTP expired — request a new one.');

    const user = await this.prisma.user.findUnique({ where: { mobile } });
    if (!user) throw new BadRequestException('User not found.');

    await this.prisma.otpCode.update({ where: { id: otp.id }, data: { verified: true } });
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    return { success: true, message: 'Password updated — you can log in now.' };
  }
}
