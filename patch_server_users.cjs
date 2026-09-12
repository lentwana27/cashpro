const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const oldEndpoint = `api.get('/users', async (req, res) => {
  const users = await db.select().from(schema.users);
  res.json(users);
});`;

const newEndpoint = `api.get('/users', async (req, res) => {
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
});`;

if (content.includes(oldEndpoint)) {
  content = content.replace(oldEndpoint, newEndpoint);
  fs.writeFileSync('server.ts', content);
  console.log("Patched server.ts /users endpoint");
} else {
  console.log("Could not find /users endpoint");
}
