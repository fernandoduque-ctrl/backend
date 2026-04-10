import { Module } from '@nestjs/common';
import { WizardRubricasEventosController } from './wizard-rubricas-eventos.controller';

@Module({
  controllers: [WizardRubricasEventosController],
})
export class WizardRubricasEventosModule {}
