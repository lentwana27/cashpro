const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');

server = server.replace(
  `api.post('/auth/signup', async (req, res) => {
  const { name, email, password, role, branchId, twoFactorCode } = req.body;
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, email));
  if (existing.length > 0) {
    return res.status(400).json({ error: 'Email already in use' });
  }
  const user = {
    id: uuidv4(),
    name,
    email,
    passwordHash: password,
    twoFactorCode: twoFactorCode || '123456',
    role: role || 'SUPERVISOR',
    branchId: branchId || null,
    active: true,
    createdAt: new Date()
  };`,
  `api.post('/auth/signup', async (req, res) => {
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
  };`
);

server = server.replace(
  `api.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }
  const users = await db.select().from(schema.users).where(eq(schema.users.email, email));
  const user = users[0];
  if (user && user.passwordHash === password) {
    // Start 2FA step
    res.json({ requires2FA: true, tempToken: user.id });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});`,
  `api.post('/auth/login', async (req, res) => {
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
    const isSetup = !user.twoFactorCode;
    res.json({ requires2FA: true, tempToken: user.id, isSetup });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});`
);

server = server.replace(
  `api.post('/auth/verify-2fa', async (req, res) => {
  const { tempToken, code } = req.body;
  if (!tempToken || !code) {
    return res.status(400).json({ error: 'Missing token or code' });
  }
  const users = await db.select().from(schema.users).where(eq(schema.users.id, tempToken));
  const user = users[0];
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  if (code !== user.twoFactorCode) {
    return res.status(401).json({ error: 'Invalid 2FA code' });
  }
  await db.update(schema.users).set({ isOnline: true, lastSeen: new Date().toISOString() }).where(eq(schema.users.id, user.id));
  res.json({ user, token: 'fake-jwt-token-replace-later' });
});`,
  `api.post('/auth/verify-2fa', async (req, res) => {
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
});`
);

fs.writeFileSync('server.ts', server);
