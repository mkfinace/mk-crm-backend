import { Module } from '@nestjs/common';
import { CarDataSubmissionsController } from './car-data-submissions.controller';
import { CarDataSubmissionsService } from './car-data-submissions.service';
import { FeaturesModule } from '../features/features.module';
import { ColoursModule } from '../colours/colours.module';
import { WarrantyModule } from '../warranty/warranty.module';
import { DynamicFieldsModule } from '../dynamic-fields/dynamic-fields.module';
import { AuditLogsModule } from '../auditlogs/auditlogs.module';

@Module({
  imports: [FeaturesModule, ColoursModule, WarrantyModule, DynamicFieldsModule, AuditLogsModule],
  controllers: [CarDataSubmissionsController],
  providers: [CarDataSubmissionsService],
})
export class CarDataSubmissionsModule {}
