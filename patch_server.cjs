const fs = require('fs');
let serverTs = fs.readFileSync('server.ts', 'utf8');

serverTs = serverTs.replace(
`api.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }
  const users = await db.select().from(schema.users).where(eq(schema.users.email, email));
  const user = users[0];
  if (user && user.passwordHash === password) {
    await db.update(schema.users).set({ isOnline: true, lastSeen: new Date().toISOString() }).where(eq(schema.users.id, user.id));
    res.json({ user, token: 'fake-jwt-token-replace-later' });
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
    // Start 2FA step
    res.json({ requires2FA: true, tempToken: user.id });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

api.post('/auth/verify-2fa', async (req, res) => {
  const { tempToken, code } = req.body;
  if (!tempToken || !code) {
    return res.status(400).json({ error: 'Missing token or code' });
  }
  if (code !== '123456') {
    return res.status(401).json({ error: 'Invalid 2FA code' });
  }
  const users = await db.select().from(schema.users).where(eq(schema.users.id, tempToken));
  const user = users[0];
  if (user) {
    await db.update(schema.users).set({ isOnline: true, lastSeen: new Date().toISOString() }).where(eq(schema.users.id, user.id));
    res.json({ user, token: 'fake-jwt-token-replace-later' });
  } else {
    res.status(401).json({ error: 'User not found' });
  }
});`
);

fs.writeFileSync('server.ts', serverTs);
