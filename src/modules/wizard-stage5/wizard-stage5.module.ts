import { Module } from '@nestjs/common';
import { WizardStage5Controller } from './wizard-stage5.controller';

@Module({
  controllers: [WizardStage5Controller],
})
export class WizardStage5Module {}
