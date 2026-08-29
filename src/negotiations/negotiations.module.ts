import { Module } from '@nestjs/common';
import { NegotiationsController } from './negotiations.controller';
import { NegotiationsService } from './negotiations.service';
import { AuditLogsModule } from '../auditlogs/auditlogs.module';

@Module({
  imports: [AuditLogsModule],
  controllers: [NegotiationsController],
  providers: [NegotiationsService],
})
export class NegotiationsModule {}
