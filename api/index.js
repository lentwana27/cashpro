var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server.ts
import express from "express";
import "express-async-errors";
import cors from "cors";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import compression from "compression";
import "dotenv/config";

// src/db/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  branches: () => branches,
  exchangeRateHistory: () => exchangeRateHistory,
  exchangeRates: () => exchangeRates,
  messages: () => messages,
  reconciliations: () => reconciliations,
  systemLogs: () => systemLogs,
  users: () => users
});
import { jsonb, pgTable, text, timestamp, doublePrecision, boolean } from "drizzle-orm/pg-core";
var users = pgTable("users", {
  id: text("id").primaryKey(),
  uid: text("uid").unique(),
  // Firebase Auth UID
  name: text("name").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash"),
  twoFactorCode: text("two_factor_code"),
  role: text("role").notNull(),
  branchId: text("branch_id"),
  active: boolean("active").default(true),
  lastSeen: text("last_seen"),
  isOnline: boolean("is_online").default(false),
  pendingDeletion: boolean("pending_deletion").default(false),
  createdAt: timestamp("created_at").defaultNow()
});
var messages = pgTable("messages", {
  id: text("id").primaryKey(),
  fromId: text("from_id").notNull(),
  toId: text("to_id").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull(),
  read: boolean("read").default(false)
});
var branches = pgTable("branches", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  location: text("location").notNull(),
  active: boolean("active").default(true),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  hasTills: boolean("has_tills").default(false),
  tills: jsonb("tills")
});
var exchangeRates = pgTable("exchange_rates", {
  id: text("id").primaryKey(),
  currencyCode: text("currency_code").notNull(),
  rateToUsd: doublePrecision("rate_to_usd").notNull(),
  effectiveDate: text("effective_date").notNull()
});
var exchangeRateHistory = pgTable("exchange_rate_history", {
  id: text("id").primaryKey(),
  currencyCode: text("currency_code").notNull(),
  oldRate: doublePrecision("old_rate").notNull(),
  newRate: doublePrecision("new_rate").notNull(),
  changedByUserId: text("changed_by_user_id").notNull(),
  changedAt: text("changed_at").notNull()
});
var reconciliations = pgTable("reconciliations", {
  id: text("id").primaryKey(),
  branchId: text("branch_id").notNull(),
  supervisorId: text("supervisor_id").notNull(),
  date: text("date").notNull(),
  salesConfirmed: boolean("sales_confirmed").default(false),
  totalSales: jsonb("total_sales"),
  depositsReceived: jsonb("deposits_received"),
  debtors: jsonb("debtors"),
  depositClaims: jsonb("deposit_claims"),
  returnsRefunds: jsonb("returns_refunds"),
  expenses: jsonb("expenses"),
  purchases: jsonb("purchases"),
  endOfDayCash: jsonb("end_of_day_cash"),
  tillCashBreakdown: jsonb("till_cash_breakdown"),
  tillVariances: jsonb("till_variances"),
  expectedCashUsd: doublePrecision("expected_cash_usd").notNull(),
  varianceUsd: doublePrecision("variance_usd").notNull(),
  status: text("status").notNull(),
  accountantNotes: text("accountant_notes"),
  notes: text("notes"),
  signature: text("signature"),
  amendmentNotes: jsonb("amendment_notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});
var systemLogs = pgTable("system_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  action: text("action").notNull(),
  details: text("details").notNull(),
  timestamp: text("timestamp").notNull()
});

// src/db/index.ts
var { Pool } = pg;
var createPool = () => {
  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl === "undefined") {
    dbUrl = "postgresql://postgres.kzhdpuvbitlhdzfnzrxf:vIsionSibanda18%24@aws-0-eu-west-1.pooler.supabase.com:6543/postgres";
  } else if (dbUrl && dbUrl.includes("db.kzhdpuvbitlhdzfnzrxf.supabase.co") && dbUrl.includes("[vIsionSibanda18$]")) {
    dbUrl = "postgresql://postgres.kzhdpuvbitlhdzfnzrxf:vIsionSibanda18%24@aws-0-eu-west-1.pooler.supabase.com:6543/postgres";
  }
  if (dbUrl) {
    return new Pool({
      connectionString: dbUrl,
      connectionTimeoutMillis: 15e3,
      ssl: dbUrl.includes("localhost") ? void 0 : { rejectUnauthorized: false }
    });
  }
  return new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    connectionTimeoutMillis: 15e3
  });
};
var pool = createPool();
console.log("Connecting to DB host:", pool.options.host);
pool.on("error", (err) => {
  console.error("Unexpected error on idle SQL pool client:", err);
});
var db = drizzle(pool, { schema: schema_exports });

// server.ts
import { eq, desc, or } from "drizzle-orm";
var app = express();
var PORT = 3e3;
app.use(compression());
app.use(cors());
app.use(express.json());
var api = express.Router();
api.get("/health", (req, res) => res.json({ status: "ok" }));
async function logAction(userId, userName, action, details) {
  try {
    await db.insert(systemLogs).values({
      id: uuidv4(),
      userId,
      userName,
      action,
      details,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (e) {
    console.error("log error", e);
  }
}
api.use((req, res, next) => {
  const method = req.method;
  if (method === "POST" || method === "PUT" || method === "DELETE") {
    const originalSend = res.send;
    res.send = function(body) {
      const uid = req.headers["x-user-id"];
      const uname = req.headers["x-user-name"];
      if (uid && uname && res.statusCode >= 200 && res.statusCode < 300) {
        if (!req.path.includes("/heartbeat")) {
          logAction(uid, uname, `${method} ${req.path}`, typeof body === "string" ? body.substring(0, 50) : "");
        }
      }
      return originalSend.call(this, body);
    };
  }
  next();
});
api.post("/auth/signup", async (req, res) => {
  const { name, email, password, role, branchId } = req.body;
  const existing = await db.select().from(users).where(eq(users.email, email));
  if (existing.length > 0) {
    return res.status(400).json({ error: "Email already in use" });
  }
  const user = {
    id: uuidv4(),
    name,
    email,
    passwordHash: password,
    twoFactorCode: null,
    role: role || "SUPERVISOR",
    branchId: branchId || null,
    active: false,
    createdAt: /* @__PURE__ */ new Date()
  };
  await db.insert(users).values(user);
  res.json(user);
});
api.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password" });
  }
  const users2 = await db.select().from(users).where(eq(users.email, email));
  const user = users2[0];
  if (user && user.passwordHash === password) {
    if (!user.active) {
      return res.status(401).json({ error: "Account pending admin approval" });
    }
    await db.update(users).set({ isOnline: true, lastSeen: (/* @__PURE__ */ new Date()).toISOString() }).where(eq(users.id, user.id));
    res.json({ user, token: "fake-jwt-token-replace-later" });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});
api.post("/auth/verify-2fa", async (req, res) => {
  const { tempToken, code } = req.body;
  if (!tempToken || !code) {
    return res.status(400).json({ error: "Missing token or code" });
  }
  const users2 = await db.select().from(users).where(eq(users.id, tempToken));
  const user = users2[0];
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }
  if (!user.active) {
    return res.status(401).json({ error: "Account pending admin approval" });
  }
  if (!user.twoFactorCode) {
    await db.update(users).set({ twoFactorCode: code, isOnline: true, lastSeen: (/* @__PURE__ */ new Date()).toISOString() }).where(eq(users.id, user.id));
    user.twoFactorCode = code;
    return res.json({ user, token: "fake-jwt-token-replace-later" });
  }
  if (code !== user.twoFactorCode) {
    return res.status(401).json({ error: "Invalid 2FA code" });
  }
  await db.update(users).set({ isOnline: true, lastSeen: (/* @__PURE__ */ new Date()).toISOString() }).where(eq(users.id, user.id));
  res.json({ user, token: "fake-jwt-token-replace-later" });
});
api.post("/auth/logout", async (req, res) => {
  const { userId } = req.body;
  if (userId) {
    await db.update(users).set({ isOnline: false, lastSeen: (/* @__PURE__ */ new Date()).toISOString() }).where(eq(users.id, String(userId)));
  }
  res.json({ success: true });
});
api.post("/auth/heartbeat", async (req, res) => {
  const uid = req.headers["x-user-id"] || req.body.userId;
  if (uid) {
    await db.update(users).set({ isOnline: true, lastSeen: (/* @__PURE__ */ new Date()).toISOString() }).where(eq(users.id, uid));
  }
  res.json({ success: true });
});
api.get("/rates", async (req, res) => {
  const rates = await db.select().from(exchangeRates);
  res.json(rates);
});
api.get("/rates/history", async (req, res) => {
  const history = await db.select().from(exchangeRateHistory).orderBy(desc(exchangeRateHistory.changedAt));
  res.json(history);
});
api.post("/rates", async (req, res) => {
  const { code, rate, userId } = req.body;
  const rates = await db.select().from(exchangeRates).where(eq(exchangeRates.currencyCode, code));
  const existingRate = rates[0];
  if (existingRate) {
    const oldRate = existingRate.rateToUsd;
    await db.update(exchangeRates).set({ rateToUsd: rate, effectiveDate: (/* @__PURE__ */ new Date()).toISOString() }).where(eq(exchangeRates.currencyCode, code));
    await db.insert(exchangeRateHistory).values({
      id: uuidv4(),
      currencyCode: code,
      oldRate,
      newRate: rate,
      changedByUserId: userId || "unknown",
      changedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    res.json({ success: true });
  } else {
    await db.insert(exchangeRates).values({
      id: uuidv4(),
      currencyCode: code,
      rateToUsd: rate,
      effectiveDate: (/* @__PURE__ */ new Date()).toISOString()
    });
    res.json({ success: true });
  }
});
api.put("/rates/:code", async (req, res) => {
  const code = req.params.code;
  const { newRate, userId } = req.body;
  const rates = await db.select().from(exchangeRates).where(eq(exchangeRates.currencyCode, code));
  const rate = rates[0];
  if (rate) {
    const oldRate = rate.rateToUsd;
    await db.update(exchangeRates).set({ rateToUsd: newRate, effectiveDate: (/* @__PURE__ */ new Date()).toISOString() }).where(eq(exchangeRates.currencyCode, code));
    await db.insert(exchangeRateHistory).values({
      id: uuidv4(),
      currencyCode: code,
      oldRate,
      newRate,
      changedByUserId: userId || "unknown",
      changedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Rate not found" });
  }
});
api.get("/users", async (req, res) => {
  const users2 = await db.select().from(users);
  res.json(users2);
});
api.post("/users", async (req, res) => {
  const { email } = req.body;
  const existing = await db.select().from(users).where(eq(users.email, email));
  if (existing.length > 0) {
    return res.status(400).json({ error: "Email already in use" });
  }
  const user = { ...req.body, id: uuidv4(), active: true };
  if (user.createdAt) {
    user.createdAt = new Date(user.createdAt);
  } else {
    user.createdAt = /* @__PURE__ */ new Date();
  }
  await db.insert(users).values(user);
  res.json(user);
});
api.put("/users/:id", async (req, res) => {
  const data = { ...req.body };
  if (data.email) {
    const existing = await db.select().from(users).where(eq(users.email, data.email));
    if (existing.length > 0 && existing[0].id !== req.params.id) {
      return res.status(400).json({ error: "Email already in use by another user" });
    }
  }
  if (data.createdAt) {
    delete data.createdAt;
  }
  await db.update(users).set(data).where(eq(users.id, req.params.id));
  res.json({ success: true });
});
api.put("/users/:id/approve", async (req, res) => {
  await db.update(users).set({ active: true }).where(eq(users.id, req.params.id));
  res.json({ success: true });
});
api.delete("/users/:id", async (req, res) => {
  await db.delete(users).where(eq(users.id, req.params.id));
  res.json({ success: true });
});
api.get("/branches", async (req, res) => {
  const branches2 = await db.select().from(branches);
  res.json(branches2);
});
api.post("/branches", async (req, res) => {
  const branch = { ...req.body, id: uuidv4(), active: true };
  await db.insert(branches).values(branch);
  res.json(branch);
});
api.put("/branches/:id", async (req, res) => {
  await db.update(branches).set(req.body).where(eq(branches.id, req.params.id));
  res.json({ success: true });
});
api.delete("/branches/:id", async (req, res) => {
  await db.delete(branches).where(eq(branches.id, req.params.id));
  res.json({ success: true });
});
api.get("/messages", async (req, res) => {
  const msgs = await db.select().from(messages).orderBy(desc(messages.createdAt));
  res.json(msgs);
});
api.get("/messages/:userId", async (req, res) => {
  const userId = req.params.userId;
  const msgs = await db.select().from(messages).where(or(eq(messages.toId, userId), eq(messages.fromId, userId))).orderBy(desc(messages.createdAt));
  res.json(msgs);
});
api.post("/messages", async (req, res) => {
  const msg = { ...req.body, id: uuidv4(), createdAt: (/* @__PURE__ */ new Date()).toISOString(), read: false };
  await db.insert(messages).values(msg);
  res.json(msg);
});
api.put("/messages/:id/read", async (req, res) => {
  await db.update(messages).set({ read: true }).where(eq(messages.id, req.params.id));
  res.json({ success: true });
});
api.get("/logs", async (req, res) => {
  const logs = await db.select().from(systemLogs).orderBy(desc(systemLogs.timestamp));
  res.json(logs);
});
api.post("/logs", async (req, res) => {
  await db.insert(systemLogs).values({ ...req.body, id: uuidv4(), timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  res.json({ success: true });
});
api.delete("/reconciliations/branch/:branchId", async (req, res) => {
  try {
    const { branchId } = req.params;
    await db.delete(reconciliations).where(eq(reconciliations.branchId, branchId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
api.get("/reconciliations", async (req, res) => {
  const recs = await db.select().from(reconciliations).orderBy(desc(reconciliations.createdAt));
  res.json(recs);
});
api.post("/reconciliations", async (req, res) => {
  const recon = { ...req.body, id: uuidv4(), createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  await db.insert(reconciliations).values(recon);
  res.json(recon);
});
api.put("/reconciliations/:id", async (req, res) => {
  await db.update(reconciliations).set({ ...req.body, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).where(eq(reconciliations.id, req.params.id));
  const recs = await db.select().from(reconciliations).where(eq(reconciliations.id, req.params.id));
  res.json(recs[0] || {});
});
api.use((req, res) => {
  res.status(404).json({ error: "API Endpoint Not Found" });
});
app.use("/api", api);
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);
  if (req.originalUrl.startsWith("/api")) {
    res.status(500).json({ error: "Internal Server Error: " + (err instanceof Error ? err.message : String(err)), stack: err instanceof Error ? err.stack : void 0 });
  } else {
    next(err);
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    try {
      const users2 = await db.select().from(users).where(eq(users.email, "admin@cashuppro.com"));
      if (users2.length === 0) {
        await db.insert(users).values({
          id: "admin-1",
          name: "System Admin",
          email: "admin@cashuppro.com",
          passwordHash: "admin50$",
          role: "ADMIN",
          active: true
        });
        await db.insert(exchangeRates).values([
          { id: "er-usd", currencyCode: "USD", rateToUsd: 1, effectiveDate: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "er-zar", currencyCode: "ZAR", rateToUsd: 0.055, effectiveDate: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "er-zig", currencyCode: "ZiG", rateToUsd: 0.037, effectiveDate: (/* @__PURE__ */ new Date()).toISOString() }
        ]);
      }
    } catch (e) {
      console.log("Seed error", e);
    }
  });
}
if (!process.env.VERCEL) {
  startServer();
}
var server_default = app;
export {
  server_default as default
};
//# sourceMappingURL=server.js.map
