import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { createServer as createViteServer } from 'vite';
import compression from 'compression';

// Simplified imports for the single-file server structure
import { User, Branch, ExchangeRate, DailyReconciliation, ExchangeRateHistory, Message, SystemLog } from './src/lib/types.js';

const app = express();
const PORT = 3000;
const DB_FILE = path.resolve(process.cwd(), 'cashup_db.json');

app.use(compression());
app.use(cors());
app.use(express.json());

// ==========================================
// MOCK DATABASE ENGINE
// ==========================================
interface DatabaseState {
  users: User[];
  branches: Branch[];
  exchangeRates: ExchangeRate[];
  exchangeRateHistory: ExchangeRateHistory[];
  reconciliations: DailyReconciliation[];
  messages: Message[];
  logs: SystemLog[];
}

const defaultState: DatabaseState = {
  users: [
    {
      id: 'admin-1',
      name: 'System Admin',
      email: 'admin@cashuppro.com',
      passwordHash: 'admin50$', // plain text for prototype simplicity
      role: 'ADMIN',
      active: true,
    }
  ],
  branches: [],
  exchangeRates: [
    { id: 'er-usd', currencyCode: 'USD', rateToUsd: 1.0, effectiveDate: new Date().toISOString() },
    { id: 'er-zar', currencyCode: 'ZAR', rateToUsd: 0.055, effectiveDate: new Date().toISOString() },
    { id: 'er-zmw', currencyCode: 'ZMW', rateToUsd: 0.037, effectiveDate: new Date().toISOString() },
  ],
  exchangeRateHistory: [],
  reconciliations: [],
  messages: [],
  logs: [],
};

class DB {
  private data: DatabaseState;

  private isWriting = false;
  private pendingWrite = false;
  private saveTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseState {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        return { ...defaultState, ...parsed, messages: parsed.messages || [], logs: parsed.logs || [] };
      }
    } catch (error) {
      console.error('Failed to load db.json, using defaults.', error);
    }
    return defaultState;
  }

  public save() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(async () => {
      if (this.isWriting) {
        this.pendingWrite = true;
        return;
      }
      this.isWriting = true;
      try {
        await fs.promises.writeFile(DB_FILE, JSON.stringify(this.data), 'utf-8');
      } catch (error) {
        console.error('Save error', error);
      } finally {
        this.isWriting = false;
        if (this.pendingWrite) {
          this.pendingWrite = false;
          this.save();
        }
      }
    }, 100);
  }

  public logAction(userId: string, userName: string, action: string, details: string) {
    this.data.logs.push({
      id: uuidv4(),
      userId,
      userName,
      action,
      details,
      timestamp: new Date().toISOString()
    });
    this.save();
  }

  private seedTestData() {
    const today = new Date().toISOString().split('T')[0];
    const recId = uuidv4();
    this.data.reconciliations.push({
      id: recId,
      branchId: 'branch-1',
      supervisorId: 'sup-1',
      date: today,
      totalSales: [{ id: uuidv4(), reconciliationId: recId, description: 'Daily Sales', amount: 10000, currencyCode: 'ZAR', usdEquivalent: 550 }],
      depositsReceived: [{ id: uuidv4(), reconciliationId: recId, description: 'Deposits', amount: 500, currencyCode: 'ZAR', usdEquivalent: 27.5 }],
      debtors: [{ id: uuidv4(), reconciliationId: recId, description: 'Debtors', amount: 1000, currencyCode: 'ZAR', usdEquivalent: 55 }],
      returnsRefunds: [{ id: uuidv4(), reconciliationId: recId, description: 'Refunds', amount: 200, currencyCode: 'ZAR', usdEquivalent: 11 }],
      expenses: [{ id: uuidv4(), reconciliationId: recId, description: 'Stationery', amount: 100, currencyCode: 'ZAR', usdEquivalent: 5.5, category: 'Ops' }],
      purchases: [{ id: uuidv4(), reconciliationId: recId, description: 'Milk', amount: 50, currencyCode: 'ZAR', usdEquivalent: 2.75, category: 'Kitchen' }],
      endOfDayCash: { id: uuidv4(), reconciliationId: recId, description: 'End of Day Cash', amount: 9150, currencyCode: 'ZAR', usdEquivalent: 503.25 },
      expectedCashUsd: 503.25,
      varianceUsd: 0,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    this.save();
  }

  get state() { return this.data; }
}

const db = new DB();

// ==========================================
// API ROUTES
// ==========================================

const api = express.Router();

// Middleware to log actions automatically
api.use((req, res, next) => {
  const method = req.method;
  if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
    const originalSend = res.send;
    res.send = function (body) {
      const uid = req.headers['x-user-id'] as string;
      const uname = req.headers['x-user-name'] as string;
      if (uid && uname && res.statusCode >= 200 && res.statusCode < 300) {
        // Exclude heartbeat
        if (!req.path.includes('/heartbeat')) {
          db.logAction(uid, uname, `${method} ${req.path}`, JSON.stringify(req.body));
        }
      }
      return originalSend.call(this, body);
    };
  }
  next();
});

// -- AUTH --
api.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase();
  const user = db.state.users.find(u => u.email.toLowerCase() === normalizedEmail && u.passwordHash === password && u.active);
  if (user) {
    const { passwordHash, ...userWithoutPassword } = user;
    res.json({ token: `fake-jwt-for-${user.id}`, user: userWithoutPassword });
  } else {
    res.status(401).json({ error: 'Invalid credentials or inactive account' });
  }
});

api.post('/auth/signup', (req, res) => {
  const { name, email, password, role, branchId } = req.body;
  const normalizedEmail = email.toLowerCase();
  if (db.state.users.find(u => u.email.toLowerCase() === normalizedEmail)) {
    return res.status(400).json({ error: 'Email already exists' });
  }
  const newUser: User = {
    id: uuidv4(),
    name, email: normalizedEmail, passwordHash: password, role, active: false, // Must be approved by admin
  };
  db.state.users.push(newUser);
  db.save();
  const { passwordHash, ...safeUser } = newUser;
  res.json({ message: 'Signup successful, pending admin approval', user: safeUser });
});

// -- LOGS --
api.get('/logs', (req, res) => {
  res.json(db.state.logs);
});

// -- USERS (Admin) --
api.get('/users', (req, res) => {
  res.json(db.state.users.map(u => {
    const { passwordHash, ...safe } = u;
    const isOnline = u.lastSeen ? (new Date().getTime() - new Date(u.lastSeen).getTime()) < 60000 : false;
    return { ...safe, isOnline };
  }));
});
api.put('/users/:id/approve', (req, res) => {
  const user = db.state.users.find(u => u.id === req.params.id);
  if (user) { user.active = true; db.save(); res.json({ success: true }); }
  else res.status(404).json({ error: 'User not found' });
});

api.put('/users/:id', (req, res) => {
  const user = db.state.users.find(u => u.id === req.params.id);
  if (user) {
    const { role, branchId, active } = req.body;
    if (role !== undefined) user.role = role;
    if (branchId !== undefined) user.branchId = branchId;
    if (active !== undefined) user.active = active;
    db.save();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

api.post('/auth/heartbeat', (req, res) => {
  const { userId } = req.body;
  const user = db.state.users.find(u => u.id === userId);
  if (user) {
    user.lastSeen = new Date().toISOString();
    db.save();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// -- MESSAGES --
api.get('/messages/:userId', (req, res) => {
  const { userId } = req.params;
  const msgs = db.state.messages.filter(m => m.fromId === userId || m.toId === userId);
  res.json(msgs);
});

api.post('/messages', (req, res) => {
  const { fromId, toId, content } = req.body;
  const newMsg: Message = {
    id: uuidv4(),
    fromId,
    toId,
    content,
    createdAt: new Date().toISOString(),
    read: false
  };
  db.state.messages.push(newMsg);
  db.save();
  res.json(newMsg);
});

// -- BRANCHES --
api.get('/branches', (req, res) => {
  res.json(db.state.branches);
});

api.post('/branches', (req, res) => {
  const { name, code, location, active, lat, lng, hasTills, tills } = req.body;
  if (db.state.branches.find(b => b.code.toLowerCase() === code.toLowerCase())) {
    return res.status(400).json({ error: 'Branch code already exists' });
  }
  const newBranch: Branch = {
    id: `branch-${uuidv4()}`,
    name,
    code: code.toUpperCase(),
    location,
    active: active !== undefined ? active : true,
    lat,
    lng,
    hasTills,
    tills
  };
  db.state.branches.push(newBranch);
  db.save();
  res.json(newBranch);
});

api.put('/branches/:id', (req, res) => {
  const branch = db.state.branches.find(b => b.id === req.params.id);
  if (branch) {
    const { name, location, active, lat, lng, hasTills, tills } = req.body;
    if (name !== undefined) branch.name = name;
    if (location !== undefined) branch.location = location;
    if (active !== undefined) branch.active = active;
    if (lat !== undefined) branch.lat = lat;
    if (lng !== undefined) branch.lng = lng;
    branch.hasTills = hasTills;
    branch.tills = tills;
    db.save();
    res.json(branch);
  } else {
    res.status(404).json({ error: 'Branch not found' });
  }
});

// -- EXCHANGE RATES --
api.get('/rates', (req, res) => {
  res.json(db.state.exchangeRates);
});
api.post('/rates', (req, res) => {
  const { code, rate, userId } = req.body;
  const existing = db.state.exchangeRates.find(r => r.currencyCode === code);
  if (existing) {
    db.state.exchangeRateHistory.push({
      id: uuidv4(),
      currencyCode: code, oldRate: existing.rateToUsd, newRate: rate,
      changedByUserId: userId, changedAt: new Date().toISOString()
    });
    existing.rateToUsd = rate;
    existing.effectiveDate = new Date().toISOString();
  } else {
    db.state.exchangeRates.push({
      id: uuidv4(), currencyCode: code, rateToUsd: rate, effectiveDate: new Date().toISOString()
    });
  }
  db.save();
  res.json({ success: true, rates: db.state.exchangeRates });
});

// -- RECONCILIATIONS --
api.get('/reconciliations', (req, res) => {
  res.json(db.state.reconciliations);
});

api.post('/reconciliations', (req, res) => {
  const recon: DailyReconciliation = { ...req.body, id: uuidv4(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  db.state.reconciliations.push(recon);
  db.save();
  res.json(recon);
});

api.put('/reconciliations/:id', (req, res) => {
  const index = db.state.reconciliations.findIndex(r => r.id === req.params.id);
  if (index >= 0) {
    db.state.reconciliations[index] = { ...db.state.reconciliations[index], ...req.body, updatedAt: new Date().toISOString() };
    db.save();
    res.json(db.state.reconciliations[index]);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

api.use((req, res) => {
  res.status(404).json({ error: 'API Endpoint Not Found' });
});

app.use('/api', api);

// ==========================================
// STARTUP + VITE MIDDLEWARE
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
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

  if (process.env.VERCEL !== '1') {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`CashUp Pro Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
