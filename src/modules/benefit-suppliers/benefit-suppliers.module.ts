import { Module } from '@nestjs/common';
import { BenefitSuppliersController } from './benefit-suppliers.controller';

@Module({
  controllers: [BenefitSuppliersController],
})
export class BenefitSuppliersModule {}
