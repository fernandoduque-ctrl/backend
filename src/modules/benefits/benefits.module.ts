import { Module } from '@nestjs/common';
import { BenefitsController } from './benefits.controller';

@Module({
  controllers: [BenefitsController],
})
export class BenefitsModule {}
