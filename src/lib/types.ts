export type UserRole = 'ADMIN' | 'ACCOUNTANT' | 'HEAD_ACCOUNTANT' | 'DIRECTOR' | 'SUPERVISOR' | 'AUDITOR';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  branchId?: string; // Optional for non-supervisors
  active: boolean;
  lastSeen?: string;
  isOnline?: boolean;
}

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  location: string;
  active: boolean;
  lat?: number;
  lng?: number;
  hasTills?: boolean;
  tills?: { id: string; name: string }[];
}

export interface Currency {
  code: string;
  name: string;
}

export interface ExchangeRate {
  id: string;
  currencyCode: string;
  rateToUsd: number;
  effectiveDate: string; // ISO String
}

export interface ExchangeRateHistory {
  id: string;
  currencyCode: string;
  oldRate: number;
  newRate: number;
  changedByUserId: string;
  changedAt: string; // ISO String
}

export type ReconStatus = 'PENDING' | 'APPROVED' | 'FLAGGED';

export interface SystemLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface ReconLineItem {
  id: string;
  reconciliationId: string;
  description: string;
  invoiceNumber?: string;
  cashierName?: string;
  category?: string;
  amount: number | string;
  currencyCode: string;
  usdEquivalent: number;
}

export interface DailyReconciliation {
  id: string;
  branchId: string;
  supervisorId: string;
  date: string; // YYYY-MM-DD
  salesConfirmed?: boolean;
  
  // Income
  totalSales: ReconLineItem[];
  depositsReceived: ReconLineItem[];
  
  // Deductions
  debtors: ReconLineItem[];
  depositClaims?: ReconLineItem[];
  returnsRefunds: ReconLineItem[];
  expenses: ReconLineItem[];
  purchases: ReconLineItem[];
  
  // Cash
  endOfDayCash: ReconLineItem;
  tillCashBreakdown?: ReconLineItem[];
  
  // Totals
  expectedCashUsd: number;
  varianceUsd: number;
  
  status: ReconStatus | 'AMENDMENT_REQUESTED' | 'AMENDMENT_APPROVED';
  accountantNotes?: string;
  notes?: string;
  signature?: string;
  amendmentNotes?: string[];
  createdAt: string;
  updatedAt: string;
}

// Summary representations
export interface BranchSummary {
  branchId: string;
  branchName: string;
  reconciliationId?: string;
  status: 'MISSING' | ReconStatus;
  totalSalesUsd: number;
  varianceUsd: number;
  expectedCashUsd: number;
  endOfDayCashUsd: number;
  date: string;
}

export interface KPIStats {
  totalSalesUsd: number;
  totalExpensesUsd: number;
  totalVarianceUsd: number;
  branchesWithShortages: number;
}
