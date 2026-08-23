import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BanksService } from './banks.service';
import { AssignFinanceExecutiveDto, CreateBankBranchDto, CreateBankDto, UpdateBankDto } from './banks.dto';

@ApiTags('banks')
@Controller('banks')
export class BanksController {
  constructor(private banksService: BanksService) {}

  @Post()
  createBank(@Body() data: CreateBankDto) {
    return this.banksService.createBank(data);
  }

  @Get()
  listBanks() {
    return this.banksService.listBanks();
  }

  @Get(':id')
  getBank(@Param('id') id: string) {
    return this.banksService.getBank(id);
  }

  @Put(':id')
  updateBank(@Param('id') id: string, @Body() data: UpdateBankDto) {
    return this.banksService.updateBank(id, data);
  }

  @Delete(':id')
  deleteBank(@Param('id') id: string) {
    return this.banksService.deleteBank(id);
  }

  @Post(':id/branches')
  createBranch(@Param('id') id: string, @Body() data: CreateBankBranchDto) {
    return this.banksService.createBranch(id, data);
  }

  @Get(':id/branches')
  listBranches(@Param('id') id: string) {
    return this.banksService.listBranches(id);
  }

  @Post(':id/executives')
  assignExecutive(@Param('id') id: string, @Body() data: AssignFinanceExecutiveDto) {
    return this.banksService.assignExecutive(id, data.userId, data.branchId);
  }
}
