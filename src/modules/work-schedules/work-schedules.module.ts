import { Module } from '@nestjs/common';
import { WorkSchedulesController } from './work-schedules.controller';

@Module({
  controllers: [WorkSchedulesController],
})
export class WorkSchedulesModule {}
