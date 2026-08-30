import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

// ============================================================================
// SMS GATEWAY NOTE (dev mode):
// No SMS provider is wired up yet — the OTP code is returned directly in the
// API response (and logged) so the whole system is testable without any paid
// account. Before going live with real customers, plug in MSG91/Twilio here:
// call their send-SMS API with `code` instead of returning it to the client.
// ============================================================================

// ============================================================================
// OTP ABUSE PROTECTION:
// Two separate limits, both DB-based (no Redis needed at this scale):
// 1. REQUEST throttle — caps how many OTPs can be requested for one mobile
//    number in a rolling window, so a script can't flood SMS sends.
// 2. VERIFY attempt lockout — caps how many wrong-code guesses are allowed
//    against the currently-active OTP, so a 6-digit code can't be brute-
//    forced (1M combinations is crackable fast with no attempt limit).
// ============================================================================
const OTP_REQUEST_LIMIT = 5;
const OTP_REQUEST_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const OTP_MAX_VERIFY_ATTEMPTS = 5;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async requestOtp(mobile: string) {
    if (!/^\d{10}$/.test(mobile)) {
      throw new BadRequestException('Enter a valid 10-digit mobile number.');
    }

    const recentCount = await this.prisma.otpCode.count({
      where: { mobile, createdAt: { gte: new Date(Date.now() - OTP_REQUEST_WINDOW_MS) } },
    });
    if (recentCount >= OTP_REQUEST_LIMIT) {
      throw new BadRequestException('Too many OTP requests for this number. Please try again after some time.');
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
    // The most recent unverified OTP for this mobile is "the active one" —
    // attempts are tracked against it regardless of what code the user typed,
    // so guessing wrong codes against a stale/expired OTP still counts.
    const otp = await this.prisma.otpCode.findFirst({
      where: { mobile, verified: false },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp) throw new UnauthorizedException('No OTP requested for this number. Please request a new one.');
    if (otp.expiresAt < new Date()) throw new UnauthorizedException('OTP expired. Please request a new one.');
    if (otp.attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
      throw new UnauthorizedException('Too many incorrect attempts. Please request a new OTP.');
    }

    if (otp.code !== code) {
      const updated = await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: otp.attempts + 1 },
      });
      const remaining = OTP_MAX_VERIFY_ATTEMPTS - updated.attempts;
      throw new UnauthorizedException(
        remaining > 0 ? `Invalid OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` : 'Too many incorrect attempts. Please request a new OTP.',
      );
    }

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

    return {
      success: true,
      customer,
      token: this.jwt.sign({ sub: customer.id, role: 'CUSTOMER', mobile: customer.mobile }),
    };
  }
}
