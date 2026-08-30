import { Module } from '@nestjs/common';
import { ColoursController } from './colours.controller';
import { ColoursService } from './colours.service';

@Module({
  controllers: [ColoursController],
  providers: [ColoursService],
})
export class ColoursModule {}
