const fs = require('fs');
let content = fs.readFileSync('src/pages/SystemUsers.tsx', 'utf8');

content = content.replace(
  /\{currentUser\?.role === 'ADMIN' && \(/g,
  "{(currentUser?.role === 'ADMIN' || currentUser?.role === 'AUDITOR') && ("
);

fs.writeFileSync('src/pages/SystemUsers.tsx', content);
