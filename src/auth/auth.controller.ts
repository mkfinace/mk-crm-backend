import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('otp/request')
  requestOtp(@Body('mobile') mobile: string) {
    return this.authService.requestOtp(mobile);
  }

  @Post('otp/verify')
  verifyOtp(@Body('mobile') mobile: string, @Body('code') code: string) {
    return this.authService.verifyOtp(mobile, code);
  }
}
