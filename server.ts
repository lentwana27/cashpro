import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import path from 'path';
import { randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import compression from 'compression';
import 'dotenv/config';

import { db } from './src/db/index.js';
import * as schema from './src/db/schema.js';
import { eq, desc, or } from 'drizzle-orm';
import { hashPassword, verifyPassword, isHashed, signToken, verifyToken, assertAuthConfig, loginLockedFor, recordLoginFailure, clearLoginFailures } from './authUtil.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(compression());
app.use(cors());
app.use(express.json());

// ==========================================
// API ROUTES
// ==========================================

const api = express.Router();
api.get("/health", (req, res) => res.json({ status: "ok" }));

function requireRole(...roles: string[]) {
  return async (req: any, res: any, next: any) => {
    const uid = req.headers['x-user-id'] as string;
    if (!uid) {
      return res.status(401).json({ error: 'Missing user identity' });
    }
    const users = await db.select().from(schema.users).where(eq(schema.users.id, uid));
    const user = users[0];
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// Never send credentials to the browser.
function publicUser(u: any) {
  if (!u) return u;
  const { passwordHash, twoFactorCode, ...rest } = u;
  return rest;
}

async function logAction(userId: string, userName: string, action: string, details: string) {
  try {
    await db.insert(schema.systemLogs).values({
      id: uuidv4(),
      userId,
      userName,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  } catch(e) { console.error('log error', e) }
}

// ---------------------------------------------------------------------------
// Authentication: every route except health/login/signup needs a valid signed token.
// The verified identity then replaces whatever x-user-* headers the browser sent, so the
// rest of this file (requireRole, audit logging, ...) can trust them.
// ---------------------------------------------------------------------------
const PUBLIC_PATHS = new Set(['/health', '/auth/login', '/auth/signup']);

api.use(async (req: any, res, next) => {
  delete req.headers['x-user-id'];
  delete req.headers['x-user-name'];
  if (PUBLIC_PATHS.has(req.path)) return next();

  const header = String(req.headers['authorization'] || '');
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const found = await db.select().from(schema.users).where(eq(schema.users.id, payload.uid));
  const user = found[0];
  if (!user || !user.active) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  req.authUser = user;
  req.headers['x-user-id'] = user.id;
  req.headers['x-user-name'] = user.name;
  next();
});

const MANAGEABLE_BY_STAFF = ['CASHIER', 'SUPERVISOR'];

// Who may edit/request deletion of whom (mirrors what the Users page offers each role).
function canManageUser(actor: any, target: any): boolean {
  if (actor.role === 'ADMIN') return true;
  if (actor.role === 'SUPERVISOR') return target.role === 'CASHIER' && !!actor.branchId && target.branchId === actor.branchId;
  if (actor.role === 'AUDITOR') return MANAGEABLE_BY_STAFF.includes(target.role);
  return false;
}

// Strips fields a client must never set directly and hashes a supplied password.
async function sanitizeUserInput(body: any): Promise<any> {
  const data: any = { ...body };
  delete data.id;
  delete data.createdAt;
  delete data.isOnline;
  delete data.lastSeen;
  delete data.twoFactorCode;
  if (typeof data.passwordHash === 'string' && data.passwordHash.length > 0) {
    data.passwordHash = await hashPassword(data.passwordHash);
  } else {
    delete data.passwordHash;
  }
  return data;
}

api.use((req, res, next) => {
  const method = req.method;
  if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
    const originalSend = res.send;
    res.send = function (body) {
      const uid = req.headers['x-user-id'] as string;
      const uname = req.headers['x-user-name'] as string;
      if (uid && uname && res.statusCode >= 200 && res.statusCode < 300) {
        if (!req.path.includes('/heartbeat')) {
          logAction(uid, uname, `${method} ${req.path}`, typeof body === 'string' ? body.substring(0, 50) : '');
        }
      }
      return originalSend.call(this, body);
    };
  }
  next();
});

// Auth
api.post('/auth/signup', async (req, res) => {
  const { name, email, password, role, branchId } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, email));
  if (existing.length > 0) {
    return res.status(400).json({ error: 'Email already in use' });
  }
  const user = {
    id: uuidv4(),
    name,
    email,
    passwordHash: await hashPassword(String(password || '')),
    twoFactorCode: null,
    role: role || 'SUPERVISOR',
    branchId: branchId || null,
    active: false,
    createdAt: new Date()
  };
  await db.insert(schema.users).values(user);
  res.json(publicUser(user));
});

api.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }
  const key = String(email).toLowerCase();
  const lockedMs = loginLockedFor(key);
  if (lockedMs > 0) {
    return res.status(429).json({ error: `Too many failed attempts. Try again in ${Math.ceil(lockedMs / 60000)} minute(s).` });
  }
  const users = await db.select().from(schema.users).where(eq(schema.users.email, email));
  const user = users[0];
  const ok = !!user && await verifyPassword(String(password), user.passwordHash);
  if (!ok) {
    recordLoginFailure(key);
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  clearLoginFailures(key);
  if (!user.active) {
    return res.status(401).json({ error: 'Account pending admin approval' });
  }
  const update: any = { isOnline: true, lastSeen: new Date().toISOString() };
  if (!isHashed(user.passwordHash)) {
    update.passwordHash = await hashPassword(String(password)); // upgrade a legacy plain-text row
  }
  await db.update(schema.users).set(update).where(eq(schema.users.id, user.id));
  res.json({ user: publicUser(user), token: signToken(user.id) });
});

// The old 2FA endpoint let anyone sign in as a user who had no 2FA code set, using only the
// user id. The login flow never required 2FA, so it was unused; it is disabled.
api.post('/auth/verify-2fa', (req, res) => {
  res.status(410).json({ error: 'Two-factor sign-in is not available' });
});

api.post('/auth/logout', async (req, res) => {
  const userId = (req as any).authUser?.id;
  if (userId) {
    await db.update(schema.users).set({ isOnline: false, lastSeen: new Date().toISOString() }).where(eq(schema.users.id, String(userId)));
  }
  res.json({ success: true });
});

api.post('/auth/heartbeat', async (req, res) => {
  const uid = req.headers['x-user-id'] as string;
  if (uid) {
    await db.update(schema.users).set({ isOnline: true, lastSeen: new Date().toISOString() }).where(eq(schema.users.id, uid));
  }
  res.json({ success: true });
});

// Rates
api.get('/rates', async (req, res) => {
  const rates = await db.select().from(schema.exchangeRates);
  res.json(rates);
});

api.get('/rates/history', async (req, res) => {
  const history = await db.select().from(schema.exchangeRateHistory).orderBy(desc(schema.exchangeRateHistory.changedAt));
  res.json(history);
});

api.post('/rates', requireRole('ADMIN', 'HEAD_ACCOUNTANT'), async (req, res) => {
  const { code, rate, userId } = req.body;
  const rates = await db.select().from(schema.exchangeRates).where(eq(schema.exchangeRates.currencyCode, code));
  const existingRate = rates[0];
  if (existingRate) {
    const oldRate = existingRate.rateToUsd;
    await db.update(schema.exchangeRates).set({ rateToUsd: rate, effectiveDate: new Date().toISOString() }).where(eq(schema.exchangeRates.currencyCode, code));
    await db.insert(schema.exchangeRateHistory).values({
      id: uuidv4(),
      currencyCode: code,
      oldRate,
      newRate: rate,
      changedByUserId: userId || 'unknown',
      changedAt: new Date().toISOString()
    });
    res.json({ success: true });
  } else {
    await db.insert(schema.exchangeRates).values({
      id: uuidv4(),
      currencyCode: code,
      rateToUsd: rate,
      effectiveDate: new Date().toISOString()
    });
    res.json({ success: true });
  }
});

api.put('/rates/:code', requireRole('ADMIN', 'HEAD_ACCOUNTANT'), async (req, res) => {
  const code = req.params.code;
  const { newRate, userId } = req.body;
  const rates = await db.select().from(schema.exchangeRates).where(eq(schema.exchangeRates.currencyCode, code));
  const rate = rates[0];
  if (rate) {
    const oldRate = rate.rateToUsd;
    await db.update(schema.exchangeRates).set({ rateToUsd: newRate, effectiveDate: new Date().toISOString() }).where(eq(schema.exchangeRates.currencyCode, code));
    await db.insert(schema.exchangeRateHistory).values({
      id: uuidv4(),
      currencyCode: code,
      oldRate,
      newRate,
      changedByUserId: userId || 'unknown',
      changedAt: new Date().toISOString()
    });
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Rate not found' });
  }
});

// Users
api.get('/users', async (req, res) => {
  let users = await db.select().from(schema.users);
  const now = Date.now();
  users = users.map(u => {
    let online = false;
    if (u.lastSeen) {
      online = (now - new Date(u.lastSeen).getTime()) < 60000;
    }
    return { ...publicUser(u), isOnline: online };
  });
  res.json(users);
});
api.post('/users', async (req: any, res) => {
  const actor = req.authUser;
  if (!['ADMIN', 'SUPERVISOR', 'AUDITOR'].includes(actor.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  const { email } = req.body;
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, email));
  if (existing.length > 0) {
    return res.status(400).json({ error: 'Email already in use' });
  }
  const data = await sanitizeUserInput(req.body);
  if (!data.passwordHash) {
    return res.status(400).json({ error: 'A password is required' });
  }
  if (actor.role !== 'ADMIN') {
    const allowedRoles = actor.role === 'SUPERVISOR' ? ['CASHIER'] : MANAGEABLE_BY_STAFF;
    if (!allowedRoles.includes(data.role || 'CASHIER')) {
      return res.status(403).json({ error: 'You cannot create a user with that role' });
    }
    if (actor.role === 'SUPERVISOR') data.branchId = actor.branchId;
  }
  const user = { ...data, id: uuidv4(), active: true, createdAt: new Date() };
  await db.insert(schema.users).values(user);
  res.json(publicUser(user));
});
api.put('/users/:id', async (req: any, res) => {
  const actor = req.authUser;
  const found = await db.select().from(schema.users).where(eq(schema.users.id, req.params.id));
  const target = found[0];
  if (!target) {
    return res.status(404).json({ error: 'User not found' });
  }
  if (!canManageUser(actor, target)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  const data = await sanitizeUserInput(req.body);
  if (data.email) {
    const existing = await db.select().from(schema.users).where(eq(schema.users.email, data.email));
    if (existing.length > 0 && existing[0].id !== req.params.id) {
      return res.status(400).json({ error: 'Email already in use by another user' });
    }
  }
  if (actor.role !== 'ADMIN') {
    const allowedRoles = actor.role === 'SUPERVISOR' ? ['CASHIER'] : MANAGEABLE_BY_STAFF;
    if (data.role !== undefined && !allowedRoles.includes(data.role)) {
      return res.status(403).json({ error: 'You cannot assign that role' });
    }
    if (actor.role === 'SUPERVISOR') data.branchId = actor.branchId;
  }
  if (Object.keys(data).length > 0) {
    await db.update(schema.users).set(data).where(eq(schema.users.id, req.params.id));
  }
  res.json({ success: true });
});
api.put('/users/:id/approve', requireRole('ADMIN'), async (req, res) => {
  await db.update(schema.users).set({ active: true }).where(eq(schema.users.id, req.params.id));
  res.json({ success: true });
});

api.delete('/users/:id', requireRole('ADMIN'), async (req, res) => {
  await db.delete(schema.users).where(eq(schema.users.id, req.params.id));
  res.json({ success: true });
});

// Branches
api.get('/branches', async (req, res) => {
  const branches = await db.select().from(schema.branches);
  res.json(branches);
});
api.post('/branches', requireRole('ADMIN'), async (req, res) => {
  const branch = { ...req.body, id: uuidv4(), active: true };
  await db.insert(schema.branches).values(branch);
  res.json(branch);
});
api.put('/branches/:id', requireRole('ADMIN'), async (req, res) => {
  await db.update(schema.branches).set(req.body).where(eq(schema.branches.id, req.params.id));
  res.json({ success: true });
});
api.delete('/branches/:id', requireRole('ADMIN'), async (req, res) => {
  await db.delete(schema.branches).where(eq(schema.branches.id, req.params.id));
  res.json({ success: true });
});

// Messages
api.get('/messages', requireRole('ADMIN'), async (req, res) => {
  const msgs = await db.select().from(schema.messages).orderBy(desc(schema.messages.createdAt));
  res.json(msgs);
});
api.get('/messages/:userId', async (req: any, res) => {
  const userId = req.params.userId;
  if (userId !== req.authUser.id && req.authUser.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  const msgs = await db.select()
    .from(schema.messages)
    .where(or(eq(schema.messages.toId, userId), eq(schema.messages.fromId, userId)))
    .orderBy(desc(schema.messages.createdAt));
  res.json(msgs);
});
api.post('/messages', async (req: any, res) => {
  const msg = { ...req.body, fromId: req.authUser.id, id: uuidv4(), createdAt: new Date().toISOString(), read: false };
  await db.insert(schema.messages).values(msg);
  res.json(msg);
});
api.put('/messages/:id/read', async (req: any, res) => {
  const found = await db.select().from(schema.messages).where(eq(schema.messages.id, req.params.id));
  if (!found[0]) return res.status(404).json({ error: 'Message not found' });
  if (found[0].toId !== req.authUser.id && req.authUser.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  await db.update(schema.messages).set({ read: true }).where(eq(schema.messages.id, req.params.id));
  res.json({ success: true });
});

// Logs
api.get('/logs', requireRole('ADMIN'), async (req, res) => {
  const logs = await db.select().from(schema.systemLogs).orderBy(desc(schema.systemLogs.timestamp));
  res.json(logs);
});
api.post('/logs', async (req: any, res) => {
  await db.insert(schema.systemLogs).values({ ...req.body, userId: req.authUser.id, userName: req.authUser.name, id: uuidv4(), timestamp: new Date().toISOString() });
  res.json({ success: true });
});

// Reconciliations

api.delete('/reconciliations/branch/:branchId', requireRole('ADMIN'), async (req, res) => {
  try {
    const { branchId } = req.params;
    await db.delete(schema.reconciliations).where(eq(schema.reconciliations.branchId, branchId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

api.delete('/reconciliations/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    if (!reason) {
      return res.status(400).json({ error: 'A reason for deletion is required' });
    }
    const uid = req.headers['x-user-id'] as string;
    const uname = req.headers['x-user-name'] as string;
    if (uid && uname) {
      logAction(uid, uname, 'DELETE RECONCILIATION', `Deleted reconciliation ${req.params.id}. Reason: ${reason}`);
    }
    await db.delete(schema.reconciliations).where(eq(schema.reconciliations.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

api.get('/reconciliations', async (req, res) => {
  const uid = req.headers['x-user-id'] as string;
  if (!uid) {
    return res.status(401).json({ error: 'Missing user identity' });
  }
  const requesters = await db.select().from(schema.users).where(eq(schema.users.id, uid));
  const requester = requesters[0];
  if (!requester) {
    return res.status(401).json({ error: 'Unknown user' });
  }
  const recs = await db.select().from(schema.reconciliations).orderBy(desc(schema.reconciliations.createdAt));

  // Cashiers only get the cash-ups that include one of their own tills, reduced to the
  // fields they need (no sales/expense breakdowns, notes, amendment reasons or other cashiers' tills).
  if (requester.role === 'CASHIER') {
    const own = recs
      .map((r: any) => {
        const tills = (Array.isArray(r.tillVariances) ? r.tillVariances : []).filter((tv: any) => tv && tv.cashierId === uid);
        return tills.length === 0 ? null : {
          id: r.id,
          branchId: r.branchId,
          date: r.date,
          status: r.status,
          createdAt: r.createdAt,
          tillVariances: tills,
        };
      })
      .filter(Boolean);
    return res.json(own);
  }

  res.json(recs);
});
api.post('/reconciliations', async (req: any, res) => {
  const actor = req.authUser;
  if (!['ADMIN', 'SUPERVISOR'].includes(actor.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  if (actor.role === 'SUPERVISOR' && req.body.branchId !== actor.branchId) {
    return res.status(403).json({ error: 'You can only submit for your own branch' });
  }
  const recon = { ...req.body, id: uuidv4(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  await db.insert(schema.reconciliations).values(recon);
  res.json(recon);
});
api.put('/reconciliations/:id', async (req: any, res) => {
  const actor = req.authUser;
  if (actor.role === 'CASHIER') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  if (actor.role === 'SUPERVISOR') {
    const target = (await db.select().from(schema.reconciliations).where(eq(schema.reconciliations.id, req.params.id)))[0];
    if (!target || target.branchId !== actor.branchId) {
      return res.status(403).json({ error: 'You can only change your own branch' });
    }
  }
  const uid = req.headers['x-user-id'] as string;
  const uname = req.headers['x-user-name'] as string;

  const updates: any = { ...req.body };

  if (uid && uname) {
    if (req.body.salesConfirmed === true) {
      logAction(uid, uname, 'CONFIRM SALES', `Locked sales for reconciliation ${req.params.id}`);
    }
    if (req.body.salesInputtedByName) {
      logAction(uid, uname, 'INPUT SALES', `Inputted sales for reconciliation ${req.params.id}`);
    }
    if (updates.status) {
      logAction(uid, uname, 'UPDATE STATUS', `Status changed to ${updates.status} for ${req.params.id}`);
    }
  }

  await db.update(schema.reconciliations).set({ ...updates, updatedAt: new Date().toISOString() }).where(eq(schema.reconciliations.id, req.params.id));
  const recs = await db.select().from(schema.reconciliations).where(eq(schema.reconciliations.id, req.params.id));
  res.json(recs[0] || {});
});

// Amendment approval is a strict sequence: Auditor -> Head Accountant -> Director.
// Each stage is only reachable once the previous one has actually completed
// (enforced against the current DB row, not client state), so - unlike the old
// dual-approval model - two approvers can never race each other into a stuck
// status: each stage has exactly one authorized role and one predecessor status.
const AMENDMENT_APPROVAL_FLOW: Record<string, { approverRoles: string[]; nextStatus: string; actionLabel: string }> = {
  AMENDMENT_REQUESTED: { approverRoles: ['AUDITOR', 'ADMIN'], nextStatus: 'AMENDMENT_PENDING_HEAD_ACCOUNTANT', actionLabel: 'AUDITOR AMENDMENT APPROVAL' },
  AMENDMENT_PENDING_HEAD_ACCOUNTANT: { approverRoles: ['HEAD_ACCOUNTANT', 'ADMIN'], nextStatus: 'AMENDMENT_PENDING_DIRECTOR', actionLabel: 'HEAD ACCOUNTANT AMENDMENT APPROVAL' },
  AMENDMENT_PENDING_DIRECTOR: { approverRoles: ['DIRECTOR', 'ADMIN'], nextStatus: 'AMENDMENT_APPROVED', actionLabel: 'DIRECTOR AMENDMENT APPROVAL' },
};

api.put('/reconciliations/:id/amendment-approve', async (req, res) => {
  const uid = req.headers['x-user-id'] as string;
  const uname = req.headers['x-user-name'] as string;
  if (!uid) {
    return res.status(401).json({ error: 'Missing user identity' });
  }

  const users = await db.select().from(schema.users).where(eq(schema.users.id, uid));
  const user = users[0];
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  const rows = await db.select().from(schema.reconciliations).where(eq(schema.reconciliations.id, req.params.id));
  const recon = rows[0];
  if (!recon) {
    return res.status(404).json({ error: 'Reconciliation not found' });
  }

  const stage = AMENDMENT_APPROVAL_FLOW[recon.status];
  if (!stage) {
    return res.status(400).json({ error: `This reconciliation is not awaiting amendment approval (current status: ${recon.status})` });
  }
  if (!stage.approverRoles.includes(user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions for this approval stage' });
  }

  await db.update(schema.reconciliations).set({ status: stage.nextStatus, updatedAt: new Date().toISOString() }).where(eq(schema.reconciliations.id, req.params.id));
  if (uname) {
    logAction(uid, uname, stage.actionLabel, `Reconciliation ${req.params.id} moved from ${recon.status} to ${stage.nextStatus}`);
  }
  const updated = await db.select().from(schema.reconciliations).where(eq(schema.reconciliations.id, req.params.id));
  res.json(updated[0] || {});
});

// System Updates Routes
api.get('/updates', async (req, res) => {
  try {
    const updates = await db.select().from(schema.systemUpdates);
    res.json(updates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch updates' });
  }
});

api.post('/updates', requireRole('ADMIN'), async (req, res) => {
  try {
    const data = { ...req.body, id: uuidv4() };
    await db.insert(schema.systemUpdates).values(data);
    res.json({ success: true });
  } catch (error) {
    console.error('Add update error:', error);
    res.status(500).json({ error: 'Failed to add update' });
  }
});

api.put('/updates/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    await db.update(schema.systemUpdates).set(data).where(eq(schema.systemUpdates.id, id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

api.delete('/updates/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    await db.delete(schema.systemUpdates).where(eq(schema.systemUpdates.id, req.params.id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete update' });
  }
});

api.use((req, res) => {
  res.status(404).json({ error: 'API Endpoint Not Found' });
});

app.use('/api', api);


app.use((err: any, req: any, res: any, next: any) => {
  console.error('Global Error Handler:', err);
  if (req.originalUrl.startsWith('/api')) {
    res.status(500).json({ error: 'Internal Server Error: ' + (err instanceof Error ? err.message : String(err)), stack: err instanceof Error ? err.stack : undefined });
  } else {
    next(err);
  }
});

// ==========================================
// STARTUP + VITE MIDDLEWARE
// ==========================================
// One-time (idempotent) migration: replace every remaining plain-text password with a salted hash.
// Each hash is checked against the original before it is written, and nothing is logged but counts.
async function migratePasswords() {
  const all = await db.select().from(schema.users);
  let migrated = 0, skipped = 0, failed = 0;
  for (const u of all) {
    if (!u.passwordHash || isHashed(u.passwordHash)) { skipped++; continue; }
    try {
      const hashed = await hashPassword(u.passwordHash);
      if (!(await verifyPassword(u.passwordHash, hashed))) { failed++; continue; }
      await db.update(schema.users).set({ passwordHash: hashed }).where(eq(schema.users.id, u.id));
      migrated++;
    } catch {
      failed++;
    }
  }
  console.log(`Password migration: ${migrated} hashed, ${skipped} already hashed/empty, ${failed} failed`);
}

async function startServer() {
  assertAuthConfig();
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    try {
      await migratePasswords();
    } catch (e) {
      console.log('Password migration error', e);
    }

    try {
      const users = await db.select().from(schema.users).where(eq(schema.users.email, 'admin@cashuppro.com'));
      if (users.length === 0) {
        await db.insert(schema.users).values({
          id: 'admin-1',
          name: 'System Admin',
          email: 'admin@cashuppro.com',
          passwordHash: await hashPassword(process.env.INITIAL_ADMIN_PASSWORD || randomBytes(24).toString('hex')),
          role: 'ADMIN',
          active: true,
        });
        
        await db.insert(schema.exchangeRates).values([
          { id: 'er-usd', currencyCode: 'USD', rateToUsd: 1.0, effectiveDate: new Date().toISOString() },
          { id: 'er-zar', currencyCode: 'ZAR', rateToUsd: 0.055, effectiveDate: new Date().toISOString() },
          { id: 'er-zig', currencyCode: 'ZiG', rateToUsd: 0.037, effectiveDate: new Date().toISOString() }
        ]);
      }
    } catch(e) {
      console.log('Seed error', e);
    }
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
