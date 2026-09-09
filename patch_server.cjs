const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const postUsersRegex = /api\.post\('\/users', async \(req, res\) => \{([\s\S]*?)await db\.insert\(schema\.users\)/;
const postUsersReplacement = `api.post('/users', async (req, res) => {
  const { email } = req.body;
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, email));
  if (existing.length > 0) {
    return res.status(400).json({ error: 'Email already in use' });
  }$1await db.insert(schema.users)`;

content = content.replace(postUsersRegex, postUsersReplacement);

fs.writeFileSync('server.ts', content);
console.log('Patched server.ts');
