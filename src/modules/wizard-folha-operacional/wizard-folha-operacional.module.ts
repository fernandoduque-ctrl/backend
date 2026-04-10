import { Module } from '@nestjs/common';
import { WizardFolhaOperacionalController } from './wizard-folha-operacional.controller';

@Module({
  controllers: [WizardFolhaOperacionalController],
})
export class WizardFolhaOperacionalModule {}
