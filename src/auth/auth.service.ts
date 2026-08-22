import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// ============================================================================
// SMS GATEWAY NOTE (dev mode):
// No SMS provider is wired up yet — the OTP code is returned directly in the
// API response (and logged) so the whole system is testable without any paid
// account. Before going live with real customers, plug in MSG91/Twilio here:
// call their send-SMS API with `code` instead of returning it to the client.
// ============================================================================

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
}

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async requestOtp(mobile: string) {
    if (!/^\d{10}$/.test(mobile)) {
      throw new BadRequestException('Enter a valid 10-digit mobile number.');
    }
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min validity

    await this.prisma.otpCode.create({
      data: { mobile, code, expiresAt },
    });

    console.log(`[DEV MODE] OTP for ${mobile}: ${code}`); // stand-in for SMS send

    return {
      success: true,
      message: 'OTP sent.',
      devOtp: code, // ⚠️ remove this field once a real SMS gateway is wired in
    };
  }

  async verifyOtp(mobile: string, code: string) {
    const otp = await this.prisma.otpCode.findFirst({
      where: { mobile, code, verified: false },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp) throw new UnauthorizedException('Invalid OTP.');
    if (otp.expiresAt < new Date()) throw new UnauthorizedException('OTP expired.');

    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { verified: true },
    });

    // Find or create the customer record tied to this mobile number
    let customer = await this.prisma.customer.findUnique({ where: { mobile } });
    if (!customer) {
      customer = await this.prisma.customer.create({
        data: { name: 'Customer', mobile, otpVerified: true },
      });
    } else if (!customer.otpVerified) {
      customer = await this.prisma.customer.update({
        where: { id: customer.id },
        data: { otpVerified: true },
      });
    }

    return { success: true, customer };
  }
}
