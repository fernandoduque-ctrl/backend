import { Module } from '@nestjs/common';
import { WizardHistoricoTrabalhadoresController } from './wizard-historico-trabalhadores.controller';

@Module({
  controllers: [WizardHistoricoTrabalhadoresController],
})
export class WizardHistoricoTrabalhadoresModule {}
