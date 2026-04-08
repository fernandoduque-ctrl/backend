import { Module } from '@nestjs/common';
import { VacationRecordsController } from './vacation-records.controller';

@Module({
  controllers: [VacationRecordsController],
})
export class VacationRecordsModule {}
