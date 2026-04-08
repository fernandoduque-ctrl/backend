import { AsyncLocalStorage } from 'async_hooks';

export type CompanyContextStore = { companyId: string };

export const companyContextStorage = new AsyncLocalStorage<CompanyContextStore>();
