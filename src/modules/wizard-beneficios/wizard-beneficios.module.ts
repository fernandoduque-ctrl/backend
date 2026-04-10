import { Module } from '@nestjs/common';
import { WizardBeneficiosController } from './wizard-beneficios.controller';

@Module({
  controllers: [WizardBeneficiosController],
})
export class WizardBeneficiosModule {}
