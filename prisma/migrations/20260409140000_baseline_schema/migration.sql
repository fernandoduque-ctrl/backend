-- Baseline: schema completo (antes só existia ALTER em User sem CREATE inicial).
-- Ordem: Company antes de User (FK SQLite).

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientDisplayName" TEXT NOT NULL,
    "legalName" TEXT,
    "taxId" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "hasBranches" BOOLEAN NOT NULL DEFAULT false,
    "hasDifferentBranchLogos" BOOLEAN NOT NULL DEFAULT false,
    "currentStage" INTEGER NOT NULL DEFAULT 1,
    "onboardingStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CLIENT',
    "companyId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContactPerson" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cpf" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContactPerson_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "taxId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Branch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UploadedFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT,
    "stageNumber" INTEGER,
    "stepNumber" INTEGER,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "originalName" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedById" TEXT,
    "illegible" BOOLEAN NOT NULL DEFAULT false,
    "userNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UploadedFile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "UploadedFile_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompanyLogo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT,
    "uploadedFileId" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'COMPANY',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompanyLogo_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CompanyLogo_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CompanyLogo_uploadedFileId_fkey" FOREIGN KEY ("uploadedFileId") REFERENCES "UploadedFile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WizardStage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "stageNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "submittedForValidationAt" DATETIME,
    "approvedAt" DATETIME,
    "rejectedAt" DATETIME,
    "reviewerNotes" TEXT,
    "finalNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WizardStage_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WizardStepProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "stageNumber" INTEGER NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WizardStepProgress_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "journeyType" TEXT NOT NULL DEFAULT 'FIXED',
    "startTime" TEXT,
    "endTime" TEXT,
    "breakMinutes" INTEGER NOT NULL DEFAULT 0,
    "weeklyRestSuggestion" TEXT,
    "workloadDailyMinutes" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkSchedule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkScheduleWeekday" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workScheduleId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    CONSTRAINT "WorkScheduleWeekday_workScheduleId_fkey" FOREIGN KEY ("workScheduleId") REFERENCES "WorkSchedule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CostCenter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CostCenter_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CostCenter_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BankReference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "EmployeePaymentBank" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "bankReferenceId" TEXT NOT NULL,
    "agency" TEXT NOT NULL,
    "agencyDigit" TEXT,
    "accountType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EmployeePaymentBank_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmployeePaymentBank_bankReferenceId_fkey" FOREIGN KEY ("bankReferenceId") REFERENCES "BankReference" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "costCenterId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Department_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Department_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "CostCenter" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PensionConfiguration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "hasActivePension" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PensionConfiguration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HistoricalPayrollFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "competence" TEXT NOT NULL,
    "uploadedFileId" TEXT NOT NULL,
    "userNote" TEXT,
    "totalEarnings" DECIMAL,
    "totalDeductions" DECIMAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HistoricalPayrollFile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HistoricalPayrollFile_uploadedFileId_fkey" FOREIGN KEY ("uploadedFileId") REFERENCES "UploadedFile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LeaveRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "leaveType" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "expectedReturnDate" DATETIME,
    "sourceType" TEXT NOT NULL DEFAULT 'MANUAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LeaveRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DependentRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "dependentName" TEXT NOT NULL,
    "cpf" TEXT,
    "dependencyType" TEXT NOT NULL,
    "motherName" TEXT,
    "birthDate" DATETIME,
    "sourceType" TEXT NOT NULL DEFAULT 'MANUAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DependentRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmployeeRegistryFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "uploadedFileId" TEXT NOT NULL,
    "userNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmployeeRegistryFile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmployeeRegistryFile_uploadedFileId_fkey" FOREIGN KEY ("uploadedFileId") REFERENCES "UploadedFile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaxReliefConfiguration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "hasTaxRelief" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TaxReliefConfiguration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VacationRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "accrualStartDate" DATETIME NOT NULL,
    "accrualEndDate" DATETIME NOT NULL,
    "takenDays" INTEGER NOT NULL DEFAULT 0,
    "pendingDays" INTEGER NOT NULL DEFAULT 0,
    "sourceType" TEXT NOT NULL DEFAULT 'MANUAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VacationRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Benefit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "internalName" TEXT NOT NULL,
    "paymentRuleType" TEXT NOT NULL,
    "companyPercentage" DECIMAL,
    "employeePercentage" DECIMAL,
    "hasDependents" BOOLEAN NOT NULL DEFAULT false,
    "dependentCompanyPercentage" DECIMAL,
    "dependentEmployeePercentage" DECIMAL,
    "valueType" TEXT NOT NULL,
    "defaultValue" DECIMAL,
    "transportDiscountPercent" DECIMAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "understoodAck" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Benefit_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BenefitSupplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "benefitId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxId" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BenefitSupplier_benefitId_fkey" FOREIGN KEY ("benefitId") REFERENCES "Benefit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BenefitSupplierLayoutFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "benefitSupplierId" TEXT NOT NULL,
    "uploadedFileId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BenefitSupplierLayoutFile_benefitSupplierId_fkey" FOREIGN KEY ("benefitSupplierId") REFERENCES "BenefitSupplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BenefitSupplierLayoutFile_uploadedFileId_fkey" FOREIGN KEY ("uploadedFileId") REFERENCES "UploadedFile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PayrollRubric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rubricType" TEXT NOT NULL,
    "nature" TEXT,
    "incidenceINSS" BOOLEAN NOT NULL DEFAULT false,
    "incidenceFGTS" BOOLEAN NOT NULL DEFAULT false,
    "incidenceIRRF" BOOLEAN NOT NULL DEFAULT false,
    "incidenceESocial" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceType" TEXT NOT NULL DEFAULT 'MONTHLY',
    "defaultCostCenterId" TEXT,
    "defaultDepartmentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PayrollRubric_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PayrollRubric_defaultCostCenterId_fkey" FOREIGN KEY ("defaultCostCenterId") REFERENCES "CostCenter" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PayrollRubric_defaultDepartmentId_fkey" FOREIGN KEY ("defaultDepartmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ESocialImportBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "requestedById" TEXT,
    "certificateType" TEXT NOT NULL,
    "certificateTaxId" TEXT,
    "certificatePasswordHint" TEXT,
    "environment" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "selectedEventsJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "confirmationTextAccepted" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ESocialImportBatch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ESocialImportBatch_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ESocialImportStageRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "recordType" TEXT NOT NULL,
    "externalId" TEXT,
    "payloadJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'STAGED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ESocialImportStageRecord_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ESocialImportBatch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ESocialImportAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ESocialImportAlert_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ESocialImportBatch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metaJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "dataJson" TEXT NOT NULL DEFAULT '{}',
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- CreateIndex
CREATE INDEX "Company_taxId_idx" ON "Company"("taxId");

-- CreateIndex
CREATE UNIQUE INDEX "ContactPerson_companyId_key" ON "ContactPerson"("companyId");

-- CreateIndex
CREATE INDEX "Branch_companyId_idx" ON "Branch"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_companyId_taxId_key" ON "Branch"("companyId", "taxId");

-- CreateIndex
CREATE INDEX "UploadedFile_companyId_category_idx" ON "UploadedFile"("companyId", "category");

-- CreateIndex
CREATE INDEX "CompanyLogo_companyId_idx" ON "CompanyLogo"("companyId");

-- CreateIndex
CREATE INDEX "WizardStage_companyId_idx" ON "WizardStage"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "WizardStage_companyId_stageNumber_key" ON "WizardStage"("companyId", "stageNumber");

-- CreateIndex
CREATE INDEX "WizardStepProgress_companyId_stageNumber_idx" ON "WizardStepProgress"("companyId", "stageNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WizardStepProgress_companyId_stageNumber_stepNumber_key" ON "WizardStepProgress"("companyId", "stageNumber", "stepNumber");

-- CreateIndex
CREATE INDEX "WorkSchedule_companyId_idx" ON "WorkSchedule"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkScheduleWeekday_workScheduleId_weekday_key" ON "WorkScheduleWeekday"("workScheduleId", "weekday");

-- CreateIndex
CREATE INDEX "CostCenter_companyId_idx" ON "CostCenter"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "CostCenter_companyId_code_key" ON "CostCenter"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "BankReference_code_key" ON "BankReference"("code");

-- CreateIndex
CREATE INDEX "EmployeePaymentBank_companyId_idx" ON "EmployeePaymentBank"("companyId");

-- CreateIndex
CREATE INDEX "Department_companyId_idx" ON "Department"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_companyId_code_key" ON "Department"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "PensionConfiguration_companyId_key" ON "PensionConfiguration"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "HistoricalPayrollFile_companyId_competence_key" ON "HistoricalPayrollFile"("companyId", "competence");

-- CreateIndex
CREATE INDEX "LeaveRecord_companyId_idx" ON "LeaveRecord"("companyId");

-- CreateIndex
CREATE INDEX "DependentRecord_companyId_idx" ON "DependentRecord"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "TaxReliefConfiguration_companyId_key" ON "TaxReliefConfiguration"("companyId");

-- CreateIndex
CREATE INDEX "VacationRecord_companyId_idx" ON "VacationRecord"("companyId");

-- CreateIndex
CREATE INDEX "Benefit_companyId_idx" ON "Benefit"("companyId");

-- CreateIndex
CREATE INDEX "PayrollRubric_companyId_idx" ON "PayrollRubric"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollRubric_companyId_code_key" ON "PayrollRubric"("companyId", "code");

-- CreateIndex
CREATE INDEX "ESocialImportBatch_companyId_idx" ON "ESocialImportBatch"("companyId");

-- CreateIndex
CREATE INDEX "ESocialImportStageRecord_batchId_idx" ON "ESocialImportStageRecord"("batchId");

-- CreateIndex
CREATE INDEX "ESocialImportAlert_batchId_idx" ON "ESocialImportAlert"("batchId");

-- CreateIndex
CREATE INDEX "AuditLog_companyId_idx" ON "AuditLog"("companyId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
