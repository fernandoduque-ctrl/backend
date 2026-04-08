import { Module } from '@nestjs/common';
import { DependentRecordsController } from './dependent-records.controller';

@Module({
  controllers: [DependentRecordsController],
})
export class DependentRecordsModule {}
