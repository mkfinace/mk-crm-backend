import { Module } from '@nestjs/common';
import { DynamicFieldsController } from './dynamic-fields.controller';
import { DynamicFieldsService } from './dynamic-fields.service';

@Module({
  controllers: [DynamicFieldsController],
  providers: [DynamicFieldsService],
  exports: [DynamicFieldsService],
})
export class DynamicFieldsModule {}
