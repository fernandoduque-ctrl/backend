import { Module } from '@nestjs/common';
import { WizardImportacaoEsocialController } from './wizard-importacao-esocial.controller';

@Module({
  controllers: [WizardImportacaoEsocialController],
})
export class WizardImportacaoEsocialModule {}
