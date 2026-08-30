import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CarDataSubmissionsService } from './car-data-submissions.service';
import { CreateSubmissionDto, ReviewSubmissionDto } from './car-data-submissions.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermission } from '../permissions/permissions.decorator';

@ApiTags('car-data-submissions')
@Controller('car-data-submissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CarDataSubmissionsController {
  constructor(private submissionsService: CarDataSubmissionsService) {}

  @RequirePermission('car_data.submit')
  @Post()
  createSubmission(@Body() data: CreateSubmissionDto, @Req() req: any) {
    return this.submissionsService.createSubmission(data, req.user.sub);
  }

  // A submitter can see their own queue; an approver can see everyone's
  // (both permissions independently unlock this same list endpoint — the
  // service itself doesn't further restrict by identity, since "my
  // submissions" for a Dealer Executive vs the full Approval Center for an
  // Admin are just different query params on the same data).
  @RequirePermission('car_data.submit')
  @Get('mine')
  listMine(@Req() req: any, @Query('status') status?: string) {
    return this.submissionsService.listSubmissions(status, undefined, req.user.sub);
  }

  @RequirePermission('car_data.approve')
  @Get()
  listAll(@Query('status') status?: string, @Query('variantId') variantId?: string) {
    return this.submissionsService.listSubmissions(status, variantId);
  }

  @RequirePermission('car_data.approve')
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.submissionsService.getSubmission(id);
  }

  @RequirePermission('car_data.approve')
  @Put(':id/approve')
  approve(@Param('id') id: string, @Body() data: ReviewSubmissionDto, @Req() req: any) {
    return this.submissionsService.approveSubmission(id, req.user.sub, data.reviewNotes);
  }

  @RequirePermission('car_data.approve')
  @Put(':id/reject')
  reject(@Param('id') id: string, @Body() data: ReviewSubmissionDto, @Req() req: any) {
    return this.submissionsService.rejectSubmission(id, req.user.sub, data.reviewNotes);
  }
}
