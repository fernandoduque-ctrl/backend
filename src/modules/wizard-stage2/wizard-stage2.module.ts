import { Module } from '@nestjs/common';
import { WizardStage2Controller } from './wizard-stage2.controller';

@Module({
  controllers: [WizardStage2Controller],
})
export class WizardStage2Module {}
