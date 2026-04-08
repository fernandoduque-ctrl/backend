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
import { WizardStage1Module } from './modules/wizard-stage1/wizard-stage1.module';
import { WizardStage2Module } from './modules/wizard-stage2/wizard-stage2.module';
import { WizardStage3Module } from './modules/wizard-stage3/wizard-stage3.module';
import { WizardStage4Module } from './modules/wizard-stage4/wizard-stage4.module';
import { WizardStage5Module } from './modules/wizard-stage5/wizard-stage5.module';
import { WizardStage6Module } from './modules/wizard-stage6/wizard-stage6.module';
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
    WizardStage1Module,
    WizardStage2Module,
    WizardStage3Module,
    WizardStage4Module,
    WizardStage5Module,
    WizardStage6Module,
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
