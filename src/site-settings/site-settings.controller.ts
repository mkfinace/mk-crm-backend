import { Body, Controller, Get, Param, Put, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SiteSettingsService } from './site-settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermission } from '../permissions/permissions.decorator';

// IMPORTANT: no class-level guard — getAll() below is deliberately public
// (website reads it) and must never pick up a controller-wide guard.
//
// SECURITY FIX: getAllRaw() and upsert() previously had NO guard at all —
// anyone, unauthenticated, could edit live website content via a raw PUT
// request. Fixed here as part of the permissions migration.
@ApiTags('site-settings')
@Controller('site-settings')
export class SiteSettingsController {
  constructor(private service: SiteSettingsService) {}

  // Public — used by the website to render editable content.
  @Get()
  getAll() {
    return this.service.getAll();
  }

  // Admin editor list (full rows, grouped).
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('site_settings.manage')
  @Get('admin/list')
  getAllRaw() {
    return this.service.getAllRaw();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('site_settings.manage')
  @Put(':key')
  upsert(@Param('key') key: string, @Body() body: { label: string; group: string; value: any }) {
    return this.service.upsert(key, body);
  }

  // One-off — open once in a browser (no shell needed). Safe to repeat —
  // only fills in defaults that don't exist yet, never overwrites an edit.
  @Get('admin/seed-defaults')
  seedDefaults(@Query('key') key: string) {
    if (key !== (process.env.SEED_KEY || 'mkfinance-seed-2026')) {
      throw new UnauthorizedException('Invalid or missing key.');
    }
    return this.service.seedDefaults();
  }
}
