import { Module } from '@nestjs/common';
import { PayrollRubricsController } from './payroll-rubrics.controller';

@Module({
  controllers: [PayrollRubricsController],
})
export class PayrollRubricsModule {}
