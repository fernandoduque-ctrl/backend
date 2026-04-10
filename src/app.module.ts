import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { CompanyContextInterceptor } from './common/interceptors/company-context.interceptor';
import { AuthModule } from './modules/auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { BranchesModule } from './modules/branches/branches.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { UsersModule } from './modules/users/users.module';
import { WizardModule } from './modules/wizard/wizard.module';
import { WizardEmpresaCadastroModule } from './modules/wizard-empresa-cadastro/wizard-empresa-cadastro.module';
import { WizardFolhaOperacionalModule } from './modules/wizard-folha-operacional/wizard-folha-operacional.module';
import { WizardHistoricoTrabalhadoresModule } from './modules/wizard-historico-trabalhadores/wizard-historico-trabalhadores.module';
import { WizardBeneficiosModule } from './modules/wizard-beneficios/wizard-beneficios.module';
import { WizardRubricasEventosModule } from './modules/wizard-rubricas-eventos/wizard-rubricas-eventos.module';
import { WizardImportacaoEsocialModule } from './modules/wizard-importacao-esocial/wizard-importacao-esocial.module';
import { WorkSchedulesModule } from './modules/work-schedules/work-schedules.module';
import { CostCentersModule } from './modules/cost-centers/cost-centers.module';
import { BanksModule } from './modules/banks/banks.module';
import { EmployeePaymentBanksModule } from './modules/employee-payment-banks/employee-payment-banks.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { LeaveRecordsModule } from './modules/leave-records/leave-records.module';
import { DependentRecordsModule } from './modules/dependent-records/dependent-records.module';
import { VacationRecordsModule } from './modules/vacation-records/vacation-records.module';
import { BenefitsModule } from './modules/benefits/benefits.module';
import { BenefitSuppliersModule } from './modules/benefit-suppliers/benefit-suppliers.module';
import { PayrollRubricsModule } from './modules/payroll-rubrics/payroll-rubrics.module';
import { EsocialImportModule } from './modules/esocial-import/esocial-import.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { SettingsModule } from './modules/settings/settings.module';
import { SchemaDiagramModule } from './modules/schema-diagram/schema-diagram.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    PrismaModule,
    AuthModule,
    CompaniesModule,
    BranchesModule,
    UploadsModule,
    DashboardModule,
    UsersModule,
    WizardModule,
    WizardEmpresaCadastroModule,
    WizardFolhaOperacionalModule,
    WizardHistoricoTrabalhadoresModule,
    WizardBeneficiosModule,
    WizardRubricasEventosModule,
    WizardImportacaoEsocialModule,
    WorkSchedulesModule,
    CostCentersModule,
    BanksModule,
    EmployeePaymentBanksModule,
    DepartmentsModule,
    LeaveRecordsModule,
    DependentRecordsModule,
    VacationRecordsModule,
    BenefitsModule,
    BenefitSuppliersModule,
    PayrollRubricsModule,
    EsocialImportModule,
    AuditLogModule,
    SettingsModule,
    SchemaDiagramModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: CompanyContextInterceptor },
  ],
})
export class AppModule {}
