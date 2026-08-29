import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NegotiationsService } from './negotiations.service';
import { CreateNegotiationDto, DecideNegotiationDto } from './negotiations.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { STAFF_ROLES } from '../auth/role-groups';

const SALES_ROLES = ['SUPER_ADMIN', 'SALES_ADMIN', 'DEALER_MANAGER', 'DEALER_EXECUTIVE'];
const APPROVER_ROLES = ['SUPER_ADMIN', 'SALES_ADMIN', 'DEALER_MANAGER'];

@ApiTags('negotiations')
@Controller('negotiations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...STAFF_ROLES)
export class NegotiationsController {
  constructor(private negotiationsService: NegotiationsService) {}

  @Roles(...SALES_ROLES)
  @Post()
  createNegotiation(@Body() data: CreateNegotiationDto, @Req() req: any) {
    return this.negotiationsService.createNegotiation({ ...data, createdBy: req.user.sub });
  }

  @Get()
  listNegotiations(@Query('leadId') leadId?: string) {
    return this.negotiationsService.listNegotiations(leadId);
  }

  // Approving/rejecting a discount beyond the executive's limit — Dealer
  // Manager or Admin only (an executive approving their own request would
  // defeat the point of the limit).
  @Roles(...APPROVER_ROLES)
  @Put(':id/decide')
  decideApproval(@Param('id') id: string, @Body() data: DecideNegotiationDto, @Req() req: any) {
    return this.negotiationsService.decideApproval(id, data.approve, req.user.sub, data.discountApproved);
  }
}
