const fs = require('fs');
let code = fs.readFileSync('src/pages/Login.tsx', 'utf8');
code = code.replace(/KeyRound(,\s*)?/, '');
fs.writeFileSync('src/pages/Login.tsx', code);
