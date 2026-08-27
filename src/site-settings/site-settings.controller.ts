import { Body, Controller, Get, Param, Put, Query, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SiteSettingsService } from './site-settings.service';

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
  @Get('admin/list')
  getAllRaw() {
    return this.service.getAllRaw();
  }

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
