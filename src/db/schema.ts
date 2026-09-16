import { relations } from 'drizzle-orm';
import { jsonb, pgTable, text, timestamp, doublePrecision, boolean, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  uid: text('uid').unique(), // Firebase Auth UID
  name: text('name').notNull(),
  email: text('email').notNull(),
  passwordHash: text('password_hash'),
  twoFactorCode: text('two_factor_code'),
  role: text('role').notNull(),
  branchId: text('branch_id'),
  active: boolean('active').default(true),
  lastSeen: text('last_seen'),
  isOnline: boolean('is_online').default(false),
  pendingDeletion: boolean('pending_deletion').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  fromId: text('from_id').notNull(),
  toId: text('to_id').notNull(),
  content: text('content').notNull(),
  createdAt: text('created_at').notNull(),
  read: boolean('read').default(false),
});

export const branches = pgTable('branches', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  location: text('location').notNull(),
  active: boolean('active').default(true),
  lat: doublePrecision('lat'),
  lng: doublePrecision('lng'),
  hasTills: boolean('has_tills').default(false),
  tills: jsonb('tills'),
});

export const exchangeRates = pgTable('exchange_rates', {
  id: text('id').primaryKey(),
  currencyCode: text('currency_code').notNull(),
  rateToUsd: doublePrecision('rate_to_usd').notNull(),
  effectiveDate: text('effective_date').notNull(),
});

export const exchangeRateHistory = pgTable('exchange_rate_history', {
  id: text('id').primaryKey(),
  currencyCode: text('currency_code').notNull(),
  oldRate: doublePrecision('old_rate').notNull(),
  newRate: doublePrecision('new_rate').notNull(),
  changedByUserId: text('changed_by_user_id').notNull(),
  changedAt: text('changed_at').notNull(),
});

export const reconciliations = pgTable('reconciliations', {
  id: text('id').primaryKey(),
  branchId: text('branch_id').notNull(),
  supervisorId: text('supervisor_id').notNull(),
  date: text('date').notNull(),
  salesConfirmed: boolean('sales_confirmed').default(false),
  salesInputtedBy: text('sales_inputted_by'),
  salesInputtedByName: text('sales_inputted_by_name'),
  auditorAmendmentApproval: boolean('auditor_amendment_approval').default(false),
  accountantAmendmentApproval: boolean('accountant_amendment_approval').default(false),
  
  totalSales: jsonb('total_sales'),
  depositsReceived: jsonb('deposits_received'),
  manualSalesToday: jsonb('manual_sales_today'),
  debtors: jsonb('debtors'),
  depositClaims: jsonb('deposit_claims'),
  returnsRefunds: jsonb('returns_refunds'),
  expenses: jsonb('expenses'),
  purchases: jsonb('purchases'),
  manualSalesPrevious: jsonb('manual_sales_previous'),
  endOfDayCash: jsonb('end_of_day_cash'),
  tillCashBreakdown: jsonb('till_cash_breakdown'),
  tillVariances: jsonb('till_variances'),
  
  expectedCashUsd: doublePrecision('expected_cash_usd').notNull(),
  varianceUsd: doublePrecision('variance_usd').notNull(),
  
  status: text('status').notNull(),
  accountantNotes: text('accountant_notes'),
  notes: text('notes'),
  signature: text('signature'),
  amendmentNotes: jsonb('amendment_notes'),
  
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const systemLogs = pgTable('system_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  userName: text('user_name').notNull(),
  action: text('action').notNull(),
  details: text('details').notNull(),
  timestamp: text('timestamp').notNull(),
});

export const systemUpdates = pgTable('system_updates', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  title: text('title').notNull(),
  features: jsonb('features').notNull(),
  targetRoles: jsonb('target_roles').notNull(), // e.g. ["DIRECTOR", "ADMIN", "SUPERVISOR"]
});
