import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FinanceCasesService } from './financecases.service';
import { CreateFinanceCaseDto, UpdateFinanceCaseStageDto } from './financecases.dto';

@ApiTags('finance-cases')
@Controller('finance-cases')
export class FinanceCasesController {
  constructor(private financeCasesService: FinanceCasesService) {}

  @Post()
  createFinanceCase(@Body() data: CreateFinanceCaseDto) {
    return this.financeCasesService.createFinanceCase(data);
  }

  @Get()
  listFinanceCases(@Query('leadId') leadId?: string) {
    return this.financeCasesService.listFinanceCases(leadId);
  }

  @Get(':id')
  getFinanceCase(@Param('id') id: string) {
    return this.financeCasesService.getFinanceCase(id);
  }

  @Put(':id/stage')
  updateStage(@Param('id') id: string, @Body() data: UpdateFinanceCaseStageDto) {
    return this.financeCasesService.updateStage(id, data.stage, data.changedBy, data.notes);
  }
}
