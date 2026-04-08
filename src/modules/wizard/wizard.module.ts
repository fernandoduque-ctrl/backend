import { Module } from '@nestjs/common';
import { WizardController } from './wizard.controller';
import { WizardService } from './wizard.service';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  controllers: [WizardController],
  providers: [WizardService, RolesGuard],
  exports: [WizardService],
})
export class WizardModule {}
