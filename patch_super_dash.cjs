const fs = require('fs');
let content = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');

content = content.replace(
  'export function SupervisorDashboard() {',
  'export function SupervisorDashboard({ branchIdOverride }: { branchIdOverride?: string }) {'
);

content = content.replace(/user\?\.branchId/g, '(branchIdOverride || user?.branchId)');
content = content.replace(/user\.branchId/g, '(branchIdOverride || user?.branchId)');

fs.writeFileSync('src/pages/SupervisorDashboard.tsx', content);
console.log('Patched SupervisorDashboard.tsx!');
