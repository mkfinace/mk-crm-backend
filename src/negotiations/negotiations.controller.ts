import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NegotiationsService } from './negotiations.service';
import { CreateNegotiationDto, DecideNegotiationDto } from './negotiations.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermission } from '../permissions/permissions.decorator';

@ApiTags('negotiations')
@Controller('negotiations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NegotiationsController {
  constructor(private negotiationsService: NegotiationsService) {}

  @RequirePermission('negotiations.manage')
  @Post()
  createNegotiation(@Body() data: CreateNegotiationDto, @Req() req: any) {
    return this.negotiationsService.createNegotiation({ ...data, createdBy: req.user.sub });
  }

  @RequirePermission('negotiations.view')
  @Get()
  listNegotiations(@Query('leadId') leadId?: string) {
    return this.negotiationsService.listNegotiations(leadId);
  }

  // Approving/rejecting a discount beyond the executive's limit — Dealer
  // Manager or Admin only (an executive approving their own request would
  // defeat the point of the limit).
  @RequirePermission('negotiations.approve')
  @Put(':id/decide')
  decideApproval(@Param('id') id: string, @Body() data: DecideNegotiationDto, @Req() req: any) {
    return this.negotiationsService.decideApproval(id, data.approve, req.user.sub, data.discountApproved);
  }
}
