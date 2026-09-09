const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const putUsersRegex = /api\.put\('\/users\/:id', async \(req, res\) => \{([\s\S]*?)await db\.update\(schema\.users\)/;
const putUsersReplacement = `api.put('/users/:id', async (req, res) => {
  const data = { ...req.body };
  if (data.email) {
    const existing = await db.select().from(schema.users).where(eq(schema.users.email, data.email));
    if (existing.length > 0 && existing[0].id !== req.params.id) {
      return res.status(400).json({ error: 'Email already in use by another user' });
    }
  }$1await db.update(schema.users)`;

content = content.replace(putUsersRegex, putUsersReplacement);

fs.writeFileSync('server.ts', content);
console.log('Patched server.ts PUT');
