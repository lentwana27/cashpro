const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  "const uid = req.headers['x-user-id'];",
  "const uid = req.headers['x-user-id'] as string;"
);

content = content.replace(
  "const uname = req.headers['x-user-name'];",
  "const uname = req.headers['x-user-name'] as string;"
);

fs.writeFileSync('server.ts', content);
console.log("Fixed server.ts headers");
