import { Module } from '@nestjs/common';
import { WizardEmpresaCadastroController } from './wizard-empresa-cadastro.controller';

@Module({
  controllers: [WizardEmpresaCadastroController],
})
export class WizardEmpresaCadastroModule {}
