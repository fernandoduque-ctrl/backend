import { Module } from '@nestjs/common';
import { CostCentersController } from './cost-centers.controller';

@Module({
  controllers: [CostCentersController],
})
export class CostCentersModule {}
