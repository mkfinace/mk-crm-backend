import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TestDrivesService } from './testdrives.service';
import { CreateTestDriveDto, UpdateTestDriveDto } from './testdrives.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermission } from '../permissions/permissions.decorator';

@ApiTags('test-drives')
@Controller('test-drives')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TestDrivesController {
  constructor(private testDrivesService: TestDrivesService) {}

  @RequirePermission('portal.access')
  @Post('my')
  createMyTestDrive(@Body() data: CreateTestDriveDto, @Req() req: any) {
    return this.testDrivesService.createMyTestDrive(req.user.sub, data);
  }

  @RequirePermission('test_drives.manage')
  @Post()
  createTestDrive(@Body() data: CreateTestDriveDto, @Req() req: any) {
    return this.testDrivesService.createTestDrive(data, req.user.sub);
  }

  @RequirePermission('test_drives.view')
  @Get()
  listTestDrives(@Query('leadId') leadId?: string) {
    return this.testDrivesService.listTestDrives(leadId);
  }

  @RequirePermission('test_drives.manage')
  @Put(':id')
  updateTestDrive(@Param('id') id: string, @Body() data: UpdateTestDriveDto, @Req() req: any) {
    return this.testDrivesService.updateTestDrive(id, data, req.user.sub);
  }

  @RequirePermission('test_drives.manage')
  @Delete(':id')
  deleteTestDrive(@Param('id') id: string, @Req() req: any) {
    return this.testDrivesService.deleteTestDrive(id, req.user.sub);
  }
}
