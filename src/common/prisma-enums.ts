/** Valores persistidos como string no SQLite (substitui enums do Prisma). */

export const UserRole = {
  ADMIN: 'ADMIN',
  CONSULTANT: 'CONSULTANT',
  CLIENT: 'CLIENT',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const OnboardingStatus = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  PENDING_VALIDATION: 'PENDING_VALIDATION',
  COMPLETED: 'COMPLETED',
  BLOCKED: 'BLOCKED',
} as const;
export type OnboardingStatus = (typeof OnboardingStatus)[keyof typeof OnboardingStatus];

export const WizardStatus = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  PENDING_VALIDATION: 'PENDING_VALIDATION',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  BLOCKED: 'BLOCKED',
} as const;
export type WizardStatus = (typeof WizardStatus)[keyof typeof WizardStatus];

export const StepStatus = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  BLOCKED: 'BLOCKED',
} as const;
export type StepStatus = (typeof StepStatus)[keyof typeof StepStatus];

export const JourneyType = {
  FIXED: 'FIXED',
  SHIFT: 'SHIFT',
} as const;
export type JourneyType = (typeof JourneyType)[keyof typeof JourneyType];

export const BenefitType = {
  MEAL_VOUCHER: 'MEAL_VOUCHER',
  FOOD_VOUCHER: 'FOOD_VOUCHER',
  TRANSPORT_VOUCHER: 'TRANSPORT_VOUCHER',
  HEALTH_PLAN: 'HEALTH_PLAN',
  LIFE_INSURANCE: 'LIFE_INSURANCE',
  OTHER: 'OTHER',
} as const;
export type BenefitType = (typeof BenefitType)[keyof typeof BenefitType];

export const BenefitPaymentRuleType = {
  COMPANY_100: 'COMPANY_100',
  EMPLOYEE_100: 'EMPLOYEE_100',
  SPLIT_PERCENT: 'SPLIT_PERCENT',
} as const;
export type BenefitPaymentRuleType =
  (typeof BenefitPaymentRuleType)[keyof typeof BenefitPaymentRuleType];

export const BenefitValueType = {
  DAILY: 'DAILY',
  MONTHLY_FIXED: 'MONTHLY_FIXED',
} as const;
export type BenefitValueType = (typeof BenefitValueType)[keyof typeof BenefitValueType];

export const RubricType = {
  EARNING: 'EARNING',
  DEDUCTION: 'DEDUCTION',
  INFORMATIVE: 'INFORMATIVE',
} as const;
export type RubricType = (typeof RubricType)[keyof typeof RubricType];

export const ESocialEnvironment = {
  PRODUCTION: 'PRODUCTION',
  RESTRICTED_PRODUCTION: 'RESTRICTED_PRODUCTION',
} as const;
export type ESocialEnvironment =
  (typeof ESocialEnvironment)[keyof typeof ESocialEnvironment];

export const ImportBatchStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  COMPLETED_WITH_ALERTS: 'COMPLETED_WITH_ALERTS',
  ERROR: 'ERROR',
  CONFIRMED: 'CONFIRMED',
} as const;
export type ImportBatchStatus =
  (typeof ImportBatchStatus)[keyof typeof ImportBatchStatus];

export const UploadCategory = {
  CNPJ_MATRIX: 'CNPJ_MATRIX',
  CNPJ_BRANCH: 'CNPJ_BRANCH',
  LOGO_COMPANY: 'LOGO_COMPANY',
  LOGO_BRANCH: 'LOGO_BRANCH',
  PENSION_LIST: 'PENSION_LIST',
  COURT_ORDERS: 'COURT_ORDERS',
  HISTORICAL_PAYROLL: 'HISTORICAL_PAYROLL',
  LEAVE_RECORDS: 'LEAVE_RECORDS',
  DEPENDENTS: 'DEPENDENTS',
  EMPLOYEE_REGISTRY: 'EMPLOYEE_REGISTRY',
  TAX_RELIEF: 'TAX_RELIEF',
  VACATION: 'VACATION',
  BENEFIT_LAYOUT: 'BENEFIT_LAYOUT',
  CERTIFICATE_A1: 'CERTIFICATE_A1',
  RUBRICS_SPREADSHEET: 'RUBRICS_SPREADSHEET',
  OTHER: 'OTHER',
} as const;
export type UploadCategory = (typeof UploadCategory)[keyof typeof UploadCategory];

export const AlertSeverity = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL',
} as const;
export type AlertSeverity = (typeof AlertSeverity)[keyof typeof AlertSeverity];

export const LogoScope = {
  COMPANY: 'COMPANY',
  BRANCH: 'BRANCH',
} as const;
export type LogoScope = (typeof LogoScope)[keyof typeof LogoScope];
