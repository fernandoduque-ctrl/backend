import { Module } from '@nestjs/common';
import { WizardStage6Controller } from './wizard-stage6.controller';

@Module({
  controllers: [WizardStage6Controller],
})
export class WizardStage6Module {}
