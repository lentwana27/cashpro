const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

// The sidebar has 2 places. Let's just do a blanket replace:
content = content.replace(
  /\{\(user\.role === 'ADMIN' \|\| user\.role === 'SUPERVISOR'\) && \(/g,
  "{(user.role === 'ADMIN' || user.role === 'SUPERVISOR' || user.role === 'AUDITOR') && ("
);

fs.writeFileSync('src/components/Layout.tsx', content);
