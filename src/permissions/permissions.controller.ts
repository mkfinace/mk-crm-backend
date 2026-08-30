import { Controller, Delete, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

// Deliberately still guarded by the old RolesGuard, not PermissionsGuard —
// editing the permission matrix itself must never be something a misgrant
// could lock an admin out of.
@ApiTags('permissions')
@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class PermissionsController {
  constructor(private permissionsService: PermissionsService) {}

  @Get('matrix')
  getMatrix() {
    return this.permissionsService.getMatrix();
  }

  @Put(':role/:code')
  grant(@Param('role') role: string, @Param('code') code: string) {
    return this.permissionsService.grant(role, code);
  }

  @Delete(':role/:code')
  revoke(@Param('role') role: string, @Param('code') code: string) {
    return this.permissionsService.revoke(role, code);
  }
}
