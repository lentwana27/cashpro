const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /<ProtectedRoute allowedRoles=\{\['ADMIN', 'SUPERVISOR'\]\}>\s*<Layout>\s*<SystemUsers \/>/g,
  `<ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR', 'AUDITOR']}>\n              <Layout>\n                <SystemUsers />`
);

fs.writeFileSync('src/App.tsx', content);
