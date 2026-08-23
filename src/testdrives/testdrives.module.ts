import { Module } from '@nestjs/common';
import { TestDrivesController } from './testdrives.controller';
import { TestDrivesService } from './testdrives.service';

@Module({
  controllers: [TestDrivesController],
  providers: [TestDrivesService],
})
export class TestDrivesModule {}
