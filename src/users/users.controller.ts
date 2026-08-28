import { Body, Controller, Delete, Get, Post, Put, Param, Query, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from './users.service';
import { CreateUserDto, LoginDto, UpdateUserDto } from './users.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private jwt: JwtService,
  ) {}

  // Staff/admin account management — Super Admin only. Creating a new admin
  // account is exactly the kind of action that must not be publicly callable.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Post()
  createUser(@Body() data: CreateUserDto) {
    return this.usersService.createUser(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Get()
  listUsers(@Query('role') role?: string) {
    return this.usersService.listUsers(role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Put(':id')
  updateUser(@Param('id') id: string, @Body() data: UpdateUserDto) {
    return this.usersService.updateUser(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Put(':id/toggle-active')
  toggleActive(@Param('id') id: string) {
    return this.usersService.toggleActive(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
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

  // Emergency password reset — open once in a browser (no shell/DB access
  // needed). Remove or change SEED_KEY once you don't need this exposed.
  @Get('admin/reset-password')
  async resetPasswordEmergency(
    @Query('key') key: string,
    @Query('mobile') mobile: string,
    @Query('newPassword') newPassword: string,
  ) {
    if (key !== (process.env.SEED_KEY || 'mkfinance-seed-2026')) {
      throw new UnauthorizedException('Invalid or missing key.');
    }
    if (!mobile || !newPassword || newPassword.length < 4) {
      throw new UnauthorizedException('Provide ?mobile=...&newPassword=... (min 4 characters).');
    }
    return this.usersService.resetPasswordEmergency(mobile, newPassword);
  }
}
