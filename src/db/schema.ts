import { mysqlTable, json, text, varchar, timestamp, double, boolean } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  uid: varchar('uid', { length: 191 }).unique(), // Firebase Auth UID
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

export const messages = mysqlTable('messages', {
  id: varchar('id', { length: 36 }).primaryKey(),
  fromId: text('from_id').notNull(),
  toId: text('to_id').notNull(),
  content: text('content').notNull(),
  createdAt: text('created_at').notNull(),
  read: boolean('read').default(false),
});

export const branches = mysqlTable('branches', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  location: text('location').notNull(),
  active: boolean('active').default(true),
  lat: double('lat'),
  lng: double('lng'),
  hasTills: boolean('has_tills').default(false),
  tills: json('tills'),
});

export const exchangeRates = mysqlTable('exchange_rates', {
  id: varchar('id', { length: 36 }).primaryKey(),
  currencyCode: text('currency_code').notNull(),
  rateToUsd: double('rate_to_usd').notNull(),
  effectiveDate: text('effective_date').notNull(),
});

export const exchangeRateHistory = mysqlTable('exchange_rate_history', {
  id: varchar('id', { length: 36 }).primaryKey(),
  currencyCode: text('currency_code').notNull(),
  oldRate: double('old_rate').notNull(),
  newRate: double('new_rate').notNull(),
  changedByUserId: text('changed_by_user_id').notNull(),
  changedAt: text('changed_at').notNull(),
});

export const reconciliations = mysqlTable('reconciliations', {
  id: varchar('id', { length: 36 }).primaryKey(),
  branchId: text('branch_id').notNull(),
  supervisorId: text('supervisor_id').notNull(),
  date: text('date').notNull(),
  salesConfirmed: boolean('sales_confirmed').default(false),
  salesInputtedBy: text('sales_inputted_by'),
  salesInputtedByName: text('sales_inputted_by_name'),
  auditorAmendmentApproval: boolean('auditor_amendment_approval').default(false),
  accountantAmendmentApproval: boolean('accountant_amendment_approval').default(false),

  totalSales: json('total_sales'),
  depositsReceived: json('deposits_received'),
  manualSalesToday: json('manual_sales_today'),
  debtors: json('debtors'),
  depositClaims: json('deposit_claims'),
  returnsRefunds: json('returns_refunds'),
  expenses: json('expenses'),
  purchases: json('purchases'),
  manualSalesPrevious: json('manual_sales_previous'),
  endOfDayCash: json('end_of_day_cash'),
  tillCashBreakdown: json('till_cash_breakdown'),
  tillVariances: json('till_variances'),

  expectedCashUsd: double('expected_cash_usd').notNull(),
  varianceUsd: double('variance_usd').notNull(),

  status: text('status').notNull(),
  accountantNotes: text('accountant_notes'),
  notes: text('notes'),
  signature: text('signature'),
  amendmentNotes: json('amendment_notes'),

  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const systemLogs = mysqlTable('system_logs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: text('user_id').notNull(),
  userName: text('user_name').notNull(),
  action: text('action').notNull(),
  details: text('details').notNull(),
  timestamp: text('timestamp').notNull(),
});

export const systemUpdates = mysqlTable('system_updates', {
  id: varchar('id', { length: 36 }).primaryKey(),
  date: text('date').notNull(),
  title: text('title').notNull(),
  features: json('features').notNull(),
  targetRoles: json('target_roles').notNull(), // e.g. ["DIRECTOR", "ADMIN", "SUPERVISOR"]
});
