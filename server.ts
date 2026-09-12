import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import compression from 'compression';
import 'dotenv/config';

import { db } from './src/db/index.js';
import * as schema from './src/db/schema.js';
import { eq, desc, or } from 'drizzle-orm';

const app = express();
const PORT = 3000;

app.use(compression());
app.use(cors());
app.use(express.json());

// ==========================================
// API ROUTES
// ==========================================

const api = express.Router();
api.get("/health", (req, res) => res.json({ status: "ok" }));

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
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, email));
  if (existing.length > 0) {
    return res.status(400).json({ error: 'Email already in use' });
  }
  const user = {
    id: uuidv4(),
    name,
    email,
    passwordHash: password,
    twoFactorCode: null,
    role: role || 'SUPERVISOR',
    branchId: branchId || null,
    active: false,
    createdAt: new Date()
  };
  await db.insert(schema.users).values(user);
  res.json(user);
});

api.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }
  const users = await db.select().from(schema.users).where(eq(schema.users.email, email));
  const user = users[0];
  if (user && user.passwordHash === password) {
    if (!user.active) {
      return res.status(401).json({ error: 'Account pending admin approval' });
    }
    await db.update(schema.users).set({ isOnline: true, lastSeen: new Date().toISOString() }).where(eq(schema.users.id, user.id));
    res.json({ user, token: 'fake-jwt-token-replace-later' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

api.post('/auth/verify-2fa', async (req, res) => {
  const { tempToken, code } = req.body;
  if (!tempToken || !code) {
    return res.status(400).json({ error: 'Missing token or code' });
  }
  const users = await db.select().from(schema.users).where(eq(schema.users.id, tempToken));
  const user = users[0];
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  if (!user.active) {
    return res.status(401).json({ error: 'Account pending admin approval' });
  }
  
  if (!user.twoFactorCode) {
    // First time setup
    await db.update(schema.users).set({ twoFactorCode: code, isOnline: true, lastSeen: new Date().toISOString() }).where(eq(schema.users.id, user.id));
    user.twoFactorCode = code;
    return res.json({ user, token: 'fake-jwt-token-replace-later' });
  }
  
  if (code !== user.twoFactorCode) {
    return res.status(401).json({ error: 'Invalid 2FA code' });
  }
  
  await db.update(schema.users).set({ isOnline: true, lastSeen: new Date().toISOString() }).where(eq(schema.users.id, user.id));
  res.json({ user, token: 'fake-jwt-token-replace-later' });
});

api.post('/auth/logout', async (req, res) => {
  const { userId } = req.body;
  if (userId) {
    await db.update(schema.users).set({ isOnline: false, lastSeen: new Date().toISOString() }).where(eq(schema.users.id, String(userId)));
  }
  res.json({ success: true });
});

api.post('/auth/heartbeat', async (req, res) => {
  const uid = req.headers['x-user-id'] as string || req.body.userId;
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

api.post('/rates', async (req, res) => {
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

api.put('/rates/:code', async (req, res) => {
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
    return { ...u, isOnline: online };
  });
  res.json(users);
});
api.post('/users', async (req, res) => {
  const { email } = req.body;
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, email));
  if (existing.length > 0) {
    return res.status(400).json({ error: 'Email already in use' });
  }
  const user = { ...req.body, id: uuidv4(), active: true };
  if (user.createdAt) {
    user.createdAt = new Date(user.createdAt);
  } else {
    user.createdAt = new Date();
  }
  await db.insert(schema.users).values(user);
  res.json(user);
});
api.put('/users/:id', async (req, res) => {
  const data = { ...req.body };
  if (data.email) {
    const existing = await db.select().from(schema.users).where(eq(schema.users.email, data.email));
    if (existing.length > 0 && existing[0].id !== req.params.id) {
      return res.status(400).json({ error: 'Email already in use by another user' });
    }
  }
  if (data.createdAt) {
    delete data.createdAt; // Prevent overriding createdAt incorrectly
  }
  await db.update(schema.users).set(data).where(eq(schema.users.id, req.params.id));
  res.json({ success: true });
});
api.put('/users/:id/approve', async (req, res) => {
  await db.update(schema.users).set({ active: true }).where(eq(schema.users.id, req.params.id));
  res.json({ success: true });
});

api.delete('/users/:id', async (req, res) => {
  await db.delete(schema.users).where(eq(schema.users.id, req.params.id));
  res.json({ success: true });
});

// Branches
api.get('/branches', async (req, res) => {
  const branches = await db.select().from(schema.branches);
  res.json(branches);
});
api.post('/branches', async (req, res) => {
  const branch = { ...req.body, id: uuidv4(), active: true };
  await db.insert(schema.branches).values(branch);
  res.json(branch);
});
api.put('/branches/:id', async (req, res) => {
  await db.update(schema.branches).set(req.body).where(eq(schema.branches.id, req.params.id));
  res.json({ success: true });
});
api.delete('/branches/:id', async (req, res) => {
  await db.delete(schema.branches).where(eq(schema.branches.id, req.params.id));
  res.json({ success: true });
});

// Messages
api.get('/messages', async (req, res) => {
  const msgs = await db.select().from(schema.messages).orderBy(desc(schema.messages.createdAt));
  res.json(msgs);
});
api.get('/messages/:userId', async (req, res) => {
  const userId = req.params.userId;
  const msgs = await db.select()
    .from(schema.messages)
    .where(or(eq(schema.messages.toId, userId), eq(schema.messages.fromId, userId)))
    .orderBy(desc(schema.messages.createdAt));
  res.json(msgs);
});
api.post('/messages', async (req, res) => {
  const msg = { ...req.body, id: uuidv4(), createdAt: new Date().toISOString(), read: false };
  await db.insert(schema.messages).values(msg);
  res.json(msg);
});
api.put('/messages/:id/read', async (req, res) => {
  await db.update(schema.messages).set({ read: true }).where(eq(schema.messages.id, req.params.id));
  res.json({ success: true });
});

// Logs
api.get('/logs', async (req, res) => {
  const logs = await db.select().from(schema.systemLogs).orderBy(desc(schema.systemLogs.timestamp));
  res.json(logs);
});
api.post('/logs', async (req, res) => {
  await db.insert(schema.systemLogs).values({ ...req.body, id: uuidv4(), timestamp: new Date().toISOString() });
  res.json({ success: true });
});

// Reconciliations

api.delete('/reconciliations/branch/:branchId', async (req, res) => {
  try {
    const { branchId } = req.params;
    await db.delete(schema.reconciliations).where(eq(schema.reconciliations.branchId, branchId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

api.get('/reconciliations', async (req, res) => {
  const recs = await db.select().from(schema.reconciliations).orderBy(desc(schema.reconciliations.createdAt));
  res.json(recs);
});
api.post('/reconciliations', async (req, res) => {
  const recon = { ...req.body, id: uuidv4(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  await db.insert(schema.reconciliations).values(recon);
  res.json(recon);
});
api.put('/reconciliations/:id', async (req, res) => {
  const uid = req.headers['x-user-id'] as string;
  const uname = req.headers['x-user-name'] as string;
  
  if (uid && uname) {
    if (req.body.salesConfirmed === true) {
      logAction(uid, uname, 'CONFIRM SALES', `Locked sales for reconciliation ${req.params.id}`);
    }
    if (req.body.salesInputtedByName) {
      logAction(uid, uname, 'INPUT SALES', `Inputted sales for reconciliation ${req.params.id}`);
    }
    if (req.body.auditorAmendmentApproval) {
      logAction(uid, uname, 'AUDITOR AMENDMENT APPROVAL', `Auditor approved amendment for ${req.params.id}`);
    }
    if (req.body.accountantAmendmentApproval) {
      logAction(uid, uname, 'ACCT AMENDMENT APPROVAL', `Accountant approved amendment for ${req.params.id}`);
    }
    if (req.body.status) {
      logAction(uid, uname, 'UPDATE STATUS', `Status changed to ${req.body.status} for ${req.params.id}`);
    }
  }

  await db.update(schema.reconciliations).set({ ...req.body, updatedAt: new Date().toISOString() }).where(eq(schema.reconciliations.id, req.params.id));
  const recs = await db.select().from(schema.reconciliations).where(eq(schema.reconciliations.id, req.params.id));
  res.json(recs[0] || {});
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
async function startServer() {
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
      const users = await db.select().from(schema.users).where(eq(schema.users.email, 'admin@cashuppro.com'));
      if (users.length === 0) {
        await db.insert(schema.users).values({
          id: 'admin-1',
          name: 'System Admin',
          email: 'admin@cashuppro.com',
          passwordHash: 'admin50$',
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
