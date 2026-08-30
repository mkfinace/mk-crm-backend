import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { DealersModule } from '../dealers/dealers.module';

@Module({
  imports: [DealersModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
