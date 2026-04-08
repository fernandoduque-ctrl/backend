import { Module } from '@nestjs/common';
import { WizardStage3Controller } from './wizard-stage3.controller';

@Module({
  controllers: [WizardStage3Controller],
})
export class WizardStage3Module {}
