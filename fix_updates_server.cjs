const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  '    const data = req.body;\n    await db.insert(schema.systemUpdates).values(data);',
  '    const data = { ...req.body, id: uuidv4() };\n    await db.insert(schema.systemUpdates).values(data);'
);

fs.writeFileSync('server.ts', code);
