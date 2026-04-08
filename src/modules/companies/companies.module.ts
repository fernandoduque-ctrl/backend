import { Module, Global } from '@nestjs/common';
import { CompaniesController } from './companies.controller';
import { CompaniesContextService } from './companies-context.service';
import { RolesGuard } from '../../common/guards/roles.guard';

@Global()
@Module({
  controllers: [CompaniesController],
  providers: [CompaniesContextService, RolesGuard],
  exports: [CompaniesContextService],
})
export class CompaniesModule {}
