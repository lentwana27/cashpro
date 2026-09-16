const fs = require('fs');

// Fix AdminDashboard.tsx
let adminCode = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');
adminCode = adminCode.replace(
  'const actionUpper = log.action.toUpperCase();',
  'const actionUpper = (log.action || "").toUpperCase();'
);
adminCode = adminCode.replace(
  'const detailsUpper = log.details.toUpperCase();',
  'const detailsUpper = (log.details || "").toUpperCase();'
);
fs.writeFileSync('src/pages/AdminDashboard.tsx', adminCode);

// Fix SupervisorDashboard.tsx
let superCode = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');
superCode = superCode.replace(
  '{user?.name?.charAt(0).toUpperCase()}',
  '{(user?.name || "").charAt(0).toUpperCase()}'
);
fs.writeFileSync('src/pages/SupervisorDashboard.tsx', superCode);
