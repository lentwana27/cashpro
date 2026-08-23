const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');

server = server.replace(
  `api.post('/auth/signup', async (req, res) => {
  const { name, email, password, role, branchId } = req.body;`,
  `api.post('/auth/signup', async (req, res) => {
  const { name, email, password, role, branchId, twoFactorCode } = req.body;`
);

server = server.replace(
  `    passwordHash: password,
    role: role || 'SUPERVISOR',`,
  `    passwordHash: password,
    twoFactorCode: twoFactorCode || '123456',
    role: role || 'SUPERVISOR',`
);

server = server.replace(
  `  if (code !== '123456') {
    return res.status(401).json({ error: 'Invalid 2FA code' });
  }
  const users = await db.select().from(schema.users).where(eq(schema.users.id, tempToken));
  const user = users[0];`,
  `  const users = await db.select().from(schema.users).where(eq(schema.users.id, tempToken));
  const user = users[0];
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  if (code !== user.twoFactorCode) {
    return res.status(401).json({ error: 'Invalid 2FA code' });
  }`
);

// We need to also clean up the redundant user check below the replace.
// Let's just do a string replace for the whole block to be safe.
