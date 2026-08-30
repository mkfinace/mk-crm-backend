import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DealersService } from './dealers.service';
import { AssignDealerExecutiveDto, AssignDealerManagerDto, CreateDealerBranchDto, CreateDealerDto, UpdateDealerDto } from './dealers.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermission } from '../permissions/permissions.decorator';

@ApiTags('dealers')
@Controller('dealers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DealersController {
  constructor(private dealersService: DealersService) {}

  @RequirePermission('dealers.manage')
  @Post()
  createDealer(@Body() data: CreateDealerDto) {
    return this.dealersService.createDealer(data);
  }

  @RequirePermission('dealers.view')
  @Get()
  listDealers() {
    return this.dealersService.listDealers();
  }

  @RequirePermission('dealers.view')
  @Get(':id')
  getDealer(@Param('id') id: string) {
    return this.dealersService.getDealer(id);
  }

  @RequirePermission('dealers.manage')
  @Put(':id')
  updateDealer(@Param('id') id: string, @Body() data: UpdateDealerDto) {
    return this.dealersService.updateDealer(id, data);
  }

  @RequirePermission('dealers.manage')
  @Delete(':id')
  deleteDealer(@Param('id') id: string) {
    return this.dealersService.deleteDealer(id);
  }

  @RequirePermission('dealers.manage')
  @Post(':id/branches')
  createBranch(@Param('id') id: string, @Body() data: CreateDealerBranchDto) {
    return this.dealersService.createBranch(id, data);
  }

  @RequirePermission('dealers.view')
  @Get(':id/branches')
  listBranches(@Param('id') id: string) {
    return this.dealersService.listBranches(id);
  }

  @RequirePermission('dealers.manage')
  @Post(':id/managers')
  assignManager(@Param('id') id: string, @Body() data: AssignDealerManagerDto) {
    return this.dealersService.assignManager(id, data.userId);
  }

  @RequirePermission('dealers.manage')
  @Post(':id/executives')
  assignExecutive(@Param('id') id: string, @Body() data: AssignDealerExecutiveDto) {
    return this.dealersService.assignExecutive(id, data.userId, data.branchId);
  }

  // Bank tie-ups — view open to any staff (a Dealer Executive needs to see
  // which banks they can use); managing is Admin-only (this is a business
  // decision, not something the dealer side self-manages).
  @RequirePermission('dealers.view')
  @Get(':id/banks')
  getDealerBanks(@Param('id') id: string) {
    return this.dealersService.getDealerBanks(id);
  }

  @RequirePermission('dealers.banks_manage')
  @Put(':id/banks')
  setDealerBanks(@Param('id') id: string, @Body('bankIds') bankIds: string[]) {
    return this.dealersService.setDealerBanks(id, bankIds || []);
  }
}
