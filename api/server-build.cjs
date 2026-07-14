var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc2) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc2 = __getOwnPropDesc(from, key)) || desc2.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_express_async_errors = require("express-async-errors");
var import_cors = __toESM(require("cors"), 1);
var import_path = __toESM(require("path"), 1);
var import_uuid = require("uuid");
var import_compression = __toESM(require("compression"), 1);
var import_config = require("dotenv/config");

// src/db/index.ts
var import_node_postgres = require("drizzle-orm/node-postgres");
var import_pg = __toESM(require("pg"), 1);

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
var import_pg_core = require("drizzle-orm/pg-core");
var users = (0, import_pg_core.pgTable)("users", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  uid: (0, import_pg_core.text)("uid").unique(),
  // Firebase Auth UID
  name: (0, import_pg_core.text)("name").notNull(),
  email: (0, import_pg_core.text)("email").notNull(),
  passwordHash: (0, import_pg_core.text)("password_hash"),
  role: (0, import_pg_core.text)("role").notNull(),
  branchId: (0, import_pg_core.text)("branch_id"),
  active: (0, import_pg_core.boolean)("active").default(true),
  lastSeen: (0, import_pg_core.text)("last_seen"),
  isOnline: (0, import_pg_core.boolean)("is_online").default(false),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var messages = (0, import_pg_core.pgTable)("messages", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  fromId: (0, import_pg_core.text)("from_id").notNull(),
  toId: (0, import_pg_core.text)("to_id").notNull(),
  content: (0, import_pg_core.text)("content").notNull(),
  createdAt: (0, import_pg_core.text)("created_at").notNull(),
  read: (0, import_pg_core.boolean)("read").default(false)
});
var branches = (0, import_pg_core.pgTable)("branches", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  name: (0, import_pg_core.text)("name").notNull(),
  code: (0, import_pg_core.text)("code").notNull(),
  location: (0, import_pg_core.text)("location").notNull(),
  active: (0, import_pg_core.boolean)("active").default(true),
  lat: (0, import_pg_core.doublePrecision)("lat"),
  lng: (0, import_pg_core.doublePrecision)("lng"),
  hasTills: (0, import_pg_core.boolean)("has_tills").default(false),
  tills: (0, import_pg_core.jsonb)("tills")
});
var exchangeRates = (0, import_pg_core.pgTable)("exchange_rates", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  currencyCode: (0, import_pg_core.text)("currency_code").notNull(),
  rateToUsd: (0, import_pg_core.doublePrecision)("rate_to_usd").notNull(),
  effectiveDate: (0, import_pg_core.text)("effective_date").notNull()
});
var exchangeRateHistory = (0, import_pg_core.pgTable)("exchange_rate_history", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  currencyCode: (0, import_pg_core.text)("currency_code").notNull(),
  oldRate: (0, import_pg_core.doublePrecision)("old_rate").notNull(),
  newRate: (0, import_pg_core.doublePrecision)("new_rate").notNull(),
  changedByUserId: (0, import_pg_core.text)("changed_by_user_id").notNull(),
  changedAt: (0, import_pg_core.text)("changed_at").notNull()
});
var reconciliations = (0, import_pg_core.pgTable)("reconciliations", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  branchId: (0, import_pg_core.text)("branch_id").notNull(),
  supervisorId: (0, import_pg_core.text)("supervisor_id").notNull(),
  date: (0, import_pg_core.text)("date").notNull(),
  salesConfirmed: (0, import_pg_core.boolean)("sales_confirmed").default(false),
  totalSales: (0, import_pg_core.jsonb)("total_sales"),
  depositsReceived: (0, import_pg_core.jsonb)("deposits_received"),
  debtors: (0, import_pg_core.jsonb)("debtors"),
  depositClaims: (0, import_pg_core.jsonb)("deposit_claims"),
  returnsRefunds: (0, import_pg_core.jsonb)("returns_refunds"),
  expenses: (0, import_pg_core.jsonb)("expenses"),
  purchases: (0, import_pg_core.jsonb)("purchases"),
  endOfDayCash: (0, import_pg_core.jsonb)("end_of_day_cash"),
  tillCashBreakdown: (0, import_pg_core.jsonb)("till_cash_breakdown"),
  tillVariances: (0, import_pg_core.jsonb)("till_variances"),
  expectedCashUsd: (0, import_pg_core.doublePrecision)("expected_cash_usd").notNull(),
  varianceUsd: (0, import_pg_core.doublePrecision)("variance_usd").notNull(),
  status: (0, import_pg_core.text)("status").notNull(),
  accountantNotes: (0, import_pg_core.text)("accountant_notes"),
  notes: (0, import_pg_core.text)("notes"),
  signature: (0, import_pg_core.text)("signature"),
  amendmentNotes: (0, import_pg_core.jsonb)("amendment_notes"),
  createdAt: (0, import_pg_core.text)("created_at").notNull(),
  updatedAt: (0, import_pg_core.text)("updated_at").notNull()
});
var systemLogs = (0, import_pg_core.pgTable)("system_logs", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  userId: (0, import_pg_core.text)("user_id").notNull(),
  userName: (0, import_pg_core.text)("user_name").notNull(),
  action: (0, import_pg_core.text)("action").notNull(),
  details: (0, import_pg_core.text)("details").notNull(),
  timestamp: (0, import_pg_core.text)("timestamp").notNull()
});

// src/db/index.ts
var { Pool } = import_pg.default;
var createPool = () => {
  let dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || "postgresql://postgres.kzhdpuvbitlhdzfnzrxf:vIsionSibanda18%24@aws-0-eu-west-1.pooler.supabase.com:6543/postgres";
  if (dbUrl && dbUrl.includes("db.kzhdpuvbitlhdzfnzrxf.supabase.co")) {
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
var db = (0, import_node_postgres.drizzle)(pool, { schema: schema_exports });

// server.ts
var import_drizzle_orm = require("drizzle-orm");
var app = (0, import_express.default)();
var PORT = 3e3;
app.use((0, import_compression.default)());
app.use((0, import_cors.default)());
app.use(import_express.default.json());
var api = import_express.default.Router();
api.get("/health", (req, res) => res.json({ status: "ok" }));
async function logAction(userId, userName, action, details) {
  try {
    await db.insert(systemLogs).values({
      id: (0, import_uuid.v4)(),
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
  const existing = await db.select().from(users).where((0, import_drizzle_orm.eq)(users.email, email));
  if (existing.length > 0) {
    return res.status(400).json({ error: "Email already in use" });
  }
  const user = {
    id: (0, import_uuid.v4)(),
    name,
    email,
    passwordHash: password,
    role: role || "SUPERVISOR",
    branchId: branchId || null,
    active: true,
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
  const users2 = await db.select().from(users).where((0, import_drizzle_orm.eq)(users.email, email));
  const user = users2[0];
  if (user && user.passwordHash === password) {
    await db.update(users).set({ isOnline: true, lastSeen: (/* @__PURE__ */ new Date()).toISOString() }).where((0, import_drizzle_orm.eq)(users.id, user.id));
    res.json({ user, token: "fake-jwt-token-replace-later" });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});
api.post("/auth/logout", async (req, res) => {
  const { userId } = req.body;
  if (userId) {
    await db.update(users).set({ isOnline: false, lastSeen: (/* @__PURE__ */ new Date()).toISOString() }).where((0, import_drizzle_orm.eq)(users.id, String(userId)));
  }
  res.json({ success: true });
});
api.post("/auth/heartbeat", async (req, res) => {
  const uid = req.headers["x-user-id"] || req.body.userId;
  if (uid) {
    await db.update(users).set({ isOnline: true, lastSeen: (/* @__PURE__ */ new Date()).toISOString() }).where((0, import_drizzle_orm.eq)(users.id, uid));
  }
  res.json({ success: true });
});
api.get("/rates", async (req, res) => {
  const rates = await db.select().from(exchangeRates);
  res.json(rates);
});
api.get("/rates/history", async (req, res) => {
  const history = await db.select().from(exchangeRateHistory).orderBy((0, import_drizzle_orm.desc)(exchangeRateHistory.changedAt));
  res.json(history);
});
api.post("/rates", async (req, res) => {
  const { code, rate, userId } = req.body;
  const rates = await db.select().from(exchangeRates).where((0, import_drizzle_orm.eq)(exchangeRates.currencyCode, code));
  const existingRate = rates[0];
  if (existingRate) {
    const oldRate = existingRate.rateToUsd;
    await db.update(exchangeRates).set({ rateToUsd: rate, effectiveDate: (/* @__PURE__ */ new Date()).toISOString() }).where((0, import_drizzle_orm.eq)(exchangeRates.currencyCode, code));
    await db.insert(exchangeRateHistory).values({
      id: (0, import_uuid.v4)(),
      currencyCode: code,
      oldRate,
      newRate: rate,
      changedByUserId: userId || "unknown",
      changedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    res.json({ success: true });
  } else {
    await db.insert(exchangeRates).values({
      id: (0, import_uuid.v4)(),
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
  const rates = await db.select().from(exchangeRates).where((0, import_drizzle_orm.eq)(exchangeRates.currencyCode, code));
  const rate = rates[0];
  if (rate) {
    const oldRate = rate.rateToUsd;
    await db.update(exchangeRates).set({ rateToUsd: newRate, effectiveDate: (/* @__PURE__ */ new Date()).toISOString() }).where((0, import_drizzle_orm.eq)(exchangeRates.currencyCode, code));
    await db.insert(exchangeRateHistory).values({
      id: (0, import_uuid.v4)(),
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
  const user = { ...req.body, id: (0, import_uuid.v4)(), active: true };
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
  if (data.createdAt) {
    delete data.createdAt;
  }
  await db.update(users).set(data).where((0, import_drizzle_orm.eq)(users.id, req.params.id));
  res.json({ success: true });
});
api.put("/users/:id/approve", async (req, res) => {
  await db.update(users).set({ active: true }).where((0, import_drizzle_orm.eq)(users.id, req.params.id));
  res.json({ success: true });
});
api.delete("/users/:id", async (req, res) => {
  await db.delete(users).where((0, import_drizzle_orm.eq)(users.id, req.params.id));
  res.json({ success: true });
});
api.get("/branches", async (req, res) => {
  const branches2 = await db.select().from(branches);
  res.json(branches2);
});
api.post("/branches", async (req, res) => {
  const branch = { ...req.body, id: (0, import_uuid.v4)(), active: true };
  await db.insert(branches).values(branch);
  res.json(branch);
});
api.put("/branches/:id", async (req, res) => {
  await db.update(branches).set(req.body).where((0, import_drizzle_orm.eq)(branches.id, req.params.id));
  res.json({ success: true });
});
api.delete("/branches/:id", async (req, res) => {
  await db.delete(branches).where((0, import_drizzle_orm.eq)(branches.id, req.params.id));
  res.json({ success: true });
});
api.get("/messages", async (req, res) => {
  const msgs = await db.select().from(messages).orderBy((0, import_drizzle_orm.desc)(messages.createdAt));
  res.json(msgs);
});
api.get("/messages/:userId", async (req, res) => {
  const userId = req.params.userId;
  const msgs = await db.select().from(messages).where((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(messages.toId, userId), (0, import_drizzle_orm.eq)(messages.fromId, userId))).orderBy((0, import_drizzle_orm.desc)(messages.createdAt));
  res.json(msgs);
});
api.post("/messages", async (req, res) => {
  const msg = { ...req.body, id: (0, import_uuid.v4)(), createdAt: (/* @__PURE__ */ new Date()).toISOString(), read: false };
  await db.insert(messages).values(msg);
  res.json(msg);
});
api.put("/messages/:id/read", async (req, res) => {
  await db.update(messages).set({ read: true }).where((0, import_drizzle_orm.eq)(messages.id, req.params.id));
  res.json({ success: true });
});
api.get("/logs", async (req, res) => {
  const logs = await db.select().from(systemLogs).orderBy((0, import_drizzle_orm.desc)(systemLogs.timestamp));
  res.json(logs);
});
api.post("/logs", async (req, res) => {
  await db.insert(systemLogs).values({ ...req.body, id: (0, import_uuid.v4)(), timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  res.json({ success: true });
});
api.delete("/reconciliations/branch/:branchId", async (req, res) => {
  try {
    const { branchId } = req.params;
    await db.delete(reconciliations).where((0, import_drizzle_orm.eq)(reconciliations.branchId, branchId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
api.get("/reconciliations", async (req, res) => {
  const recs = await db.select().from(reconciliations).orderBy((0, import_drizzle_orm.desc)(reconciliations.createdAt));
  res.json(recs);
});
api.post("/reconciliations", async (req, res) => {
  const recon = { ...req.body, id: (0, import_uuid.v4)(), createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  await db.insert(reconciliations).values(recon);
  res.json(recon);
});
api.put("/reconciliations/:id", async (req, res) => {
  await db.update(reconciliations).set({ ...req.body, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).where((0, import_drizzle_orm.eq)(reconciliations.id, req.params.id));
  const recs = await db.select().from(reconciliations).where((0, import_drizzle_orm.eq)(reconciliations.id, req.params.id));
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
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    try {
      const users2 = await db.select().from(users).where((0, import_drizzle_orm.eq)(users.email, "admin@cashuppro.com"));
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
          { id: "er-zmw", currencyCode: "ZMW", rateToUsd: 0.037, effectiveDate: (/* @__PURE__ */ new Date()).toISOString() }
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
//# sourceMappingURL=server.cjs.map
