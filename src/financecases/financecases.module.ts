import { Module } from '@nestjs/common';
import { FinanceCasesController } from './financecases.controller';
import { FinanceCasesService } from './financecases.service';
import { AuditLogsModule } from '../auditlogs/auditlogs.module';

@Module({
  imports: [AuditLogsModule],
  controllers: [FinanceCasesController],
  providers: [FinanceCasesService],
})
export class FinanceCasesModule {}
