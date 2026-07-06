const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
  /error: 'Internal Server Error: ' \+ \(err\.message \|\| 'Unknown'\),\n\s*stack: err\.stack,/g,
  `error: 'Internal Server Error: ' + (err instanceof Error ? err.message : String(err)),\n      stack: err instanceof Error ? err.stack : undefined,`
);
fs.writeFileSync('server.ts', code);
