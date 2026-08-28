import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DealersService } from './dealers.service';
import { AssignDealerExecutiveDto, AssignDealerManagerDto, CreateDealerBranchDto, CreateDealerDto, UpdateDealerDto } from './dealers.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { STAFF_ROLES } from '../auth/role-groups';

@ApiTags('dealers')
@Controller('dealers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...STAFF_ROLES)
export class DealersController {
  constructor(private dealersService: DealersService) {}

  @Post()
  createDealer(@Body() data: CreateDealerDto) {
    return this.dealersService.createDealer(data);
  }

  @Get()
  listDealers() {
    return this.dealersService.listDealers();
  }

  @Get(':id')
  getDealer(@Param('id') id: string) {
    return this.dealersService.getDealer(id);
  }

  @Put(':id')
  updateDealer(@Param('id') id: string, @Body() data: UpdateDealerDto) {
    return this.dealersService.updateDealer(id, data);
  }

  @Delete(':id')
  deleteDealer(@Param('id') id: string) {
    return this.dealersService.deleteDealer(id);
  }

  @Post(':id/branches')
  createBranch(@Param('id') id: string, @Body() data: CreateDealerBranchDto) {
    return this.dealersService.createBranch(id, data);
  }

  @Get(':id/branches')
  listBranches(@Param('id') id: string) {
    return this.dealersService.listBranches(id);
  }

  @Post(':id/managers')
  assignManager(@Param('id') id: string, @Body() data: AssignDealerManagerDto) {
    return this.dealersService.assignManager(id, data.userId);
  }

  @Post(':id/executives')
  assignExecutive(@Param('id') id: string, @Body() data: AssignDealerExecutiveDto) {
    return this.dealersService.assignExecutive(id, data.userId, data.branchId);
  }
}
