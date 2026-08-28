import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TestDrivesService } from './testdrives.service';
import { CreateTestDriveDto, UpdateTestDriveDto } from './testdrives.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { STAFF_ROLES } from '../auth/role-groups';

@ApiTags('test-drives')
@Controller('test-drives')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...STAFF_ROLES)
export class TestDrivesController {
  constructor(private testDrivesService: TestDrivesService) {}

  @Post()
  createTestDrive(@Body() data: CreateTestDriveDto) {
    return this.testDrivesService.createTestDrive(data);
  }

  @Get()
  listTestDrives(@Query('leadId') leadId?: string) {
    return this.testDrivesService.listTestDrives(leadId);
  }

  @Put(':id')
  updateTestDrive(@Param('id') id: string, @Body() data: UpdateTestDriveDto) {
    return this.testDrivesService.updateTestDrive(id, data);
  }

  @Delete(':id')
  deleteTestDrive(@Param('id') id: string) {
    return this.testDrivesService.deleteTestDrive(id);
  }
}
