import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BanksService } from './banks.service';
import { AssignFinanceExecutiveDto, CreateBankBranchDto, CreateBankDto, UpdateBankDto } from './banks.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermission } from '../permissions/permissions.decorator';

@ApiTags('banks')
@Controller('banks')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BanksController {
  constructor(private banksService: BanksService) {}

  @RequirePermission('banks.manage')
  @Post()
  createBank(@Body() data: CreateBankDto) {
    return this.banksService.createBank(data);
  }

  @RequirePermission('banks.view')
  @Get()
  listBanks() {
    return this.banksService.listBanks();
  }

  @RequirePermission('banks.view')
  @Get(':id')
  getBank(@Param('id') id: string) {
    return this.banksService.getBank(id);
  }

  @RequirePermission('banks.manage')
  @Put(':id')
  updateBank(@Param('id') id: string, @Body() data: UpdateBankDto) {
    return this.banksService.updateBank(id, data);
  }

  @RequirePermission('banks.manage')
  @Delete(':id')
  deleteBank(@Param('id') id: string) {
    return this.banksService.deleteBank(id);
  }

  @RequirePermission('banks.manage')
  @Post(':id/branches')
  createBranch(@Param('id') id: string, @Body() data: CreateBankBranchDto) {
    return this.banksService.createBranch(id, data);
  }

  @RequirePermission('banks.view')
  @Get(':id/branches')
  listBranches(@Param('id') id: string) {
    return this.banksService.listBranches(id);
  }

  @RequirePermission('banks.manage')
  @Post(':id/executives')
  assignExecutive(@Param('id') id: string, @Body() data: AssignFinanceExecutiveDto) {
    return this.banksService.assignExecutive(id, data.userId, data.branchId);
  }
}
