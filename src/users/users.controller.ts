import { Body, Controller, Delete, Get, Post, Put, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from './users.service';
import { CreateUserDto, LoginDto, UpdateUserDto } from './users.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermission } from '../permissions/permissions.decorator';

// IMPORTANT: no class-level guard — login and forgot-password below are
// deliberately public (they're how you get a token in the first place)
// and must never pick up a controller-wide guard.
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private jwt: JwtService,
  ) {}

  // Staff/admin account management — Super Admin only by default. Creating
  // a new admin account is exactly the kind of action that must not be
  // publicly callable.
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('users.manage')
  @Post()
  createUser(@Body() data: CreateUserDto) {
    return this.usersService.createUser(data);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('users.manage')
  @Get()
  listUsers(@Query('role') role?: string) {
    return this.usersService.listUsers(role);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('users.manage')
  @Put(':id')
  updateUser(@Param('id') id: string, @Body() data: UpdateUserDto) {
    return this.usersService.updateUser(id, data);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('users.manage')
  @Put(':id/toggle-active')
  toggleActive(@Param('id') id: string) {
    return this.usersService.toggleActive(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('users.manage')
  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }

  // Public — this is how you get a token in the first place.
  @Post('login')
  async login(@Body() data: LoginDto) {
    const user = await this.usersService.verifyPassword(data.mobile, data.password);
    if (!user) return { success: false, error: 'Invalid credentials or inactive account.' };
    const { passwordHash, ...safeUser } = user;
    const token = this.jwt.sign({ sub: user.id, role: user.role, mobile: user.mobile });
    return { success: true, user: safeUser, token };
  }

  // Public — self-service "Forgot Password", OTP-based (reuses the OTP
  // system already built for customer login — no admin help needed).
  @Post('forgot-password/request')
  requestPasswordReset(@Body('mobile') mobile: string) {
    return this.usersService.requestPasswordResetOtp(mobile);
  }

  @Post('forgot-password/reset')
  resetPasswordWithOtp(@Body('mobile') mobile: string, @Body('code') code: string, @Body('newPassword') newPassword: string) {
    return this.usersService.resetPasswordWithOtp(mobile, code, newPassword);
  }
}
