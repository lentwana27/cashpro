const fs = require('fs');
let content = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');

content = content.replace(
  'Branch Code: {user?.branchId}',
  '{branch?.name ? `Branch: ${branch.name}` : `Branch Code: ${user?.branchId}`}'
);

fs.writeFileSync('src/pages/SupervisorDashboard.tsx', content);
console.log('Patched SupervisorDashboard.tsx!');
