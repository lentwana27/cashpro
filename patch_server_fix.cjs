const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace("  const data = { ...req.body };\n  if (data.createdAt) {", "  if (data.createdAt) {");

fs.writeFileSync('server.ts', content);
console.log('Fixed server.ts');
