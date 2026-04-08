import { Module } from '@nestjs/common';
import { LeaveRecordsController } from './leave-records.controller';

@Module({
  controllers: [LeaveRecordsController],
})
export class LeaveRecordsModule {}
