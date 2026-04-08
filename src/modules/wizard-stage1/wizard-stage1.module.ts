import { Module } from '@nestjs/common';
import { WizardStage1Controller } from './wizard-stage1.controller';

@Module({
  controllers: [WizardStage1Controller],
})
export class WizardStage1Module {}
