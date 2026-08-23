import { Body, Controller, Delete, Get, Post, Put, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, LoginDto, UpdateUserDto } from './users.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  createUser(@Body() data: CreateUserDto) {
    return this.usersService.createUser(data);
  }

  @Get()
  listUsers(@Query('role') role?: string) {
    return this.usersService.listUsers(role);
  }

  @Put(':id')
  updateUser(@Param('id') id: string, @Body() data: UpdateUserDto) {
    return this.usersService.updateUser(id, data);
  }

  @Put(':id/toggle-active')
  toggleActive(@Param('id') id: string) {
    return this.usersService.toggleActive(id);
  }

  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }

  @Post('login')
  async login(@Body() data: LoginDto) {
    const user = await this.usersService.verifyPassword(data.mobile, data.password);
    if (!user) return { success: false, error: 'Invalid credentials or inactive account.' };
    const { passwordHash, ...safeUser } = user;
    return { success: true, user: safeUser };
  }
}
