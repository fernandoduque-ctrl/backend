import { Module } from '@nestjs/common';
import { WizardStage4Controller } from './wizard-stage4.controller';

@Module({
  controllers: [WizardStage4Controller],
})
export class WizardStage4Module {}
