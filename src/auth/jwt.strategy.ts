import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string; // user or customer id
  role: string; // UserRole enum value, or 'CUSTOMER'
  mobile: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me',
    });
  }

  async validate(payload: JwtPayload) {
    // Whatever this returns becomes `req.user` in every guarded controller.
    return payload;
  }
}
