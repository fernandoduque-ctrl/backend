import { Module } from '@nestjs/common';
import { EmployeePaymentBanksController } from './employee-payment-banks.controller';

@Module({
  controllers: [EmployeePaymentBanksController],
})
export class EmployeePaymentBanksModule {}
