const fs = require('fs');

const files = [
  'src/components/CashierMonthlyPerformance.tsx',
  'src/components/ExportReportModal.tsx',
  'src/pages/AccountantDashboard.tsx',
  'src/pages/AdminDashboard.tsx',
  'src/pages/DirectorDashboard.tsx',
  'src/pages/SupervisorDashboard.tsx'
];

for (const file of files) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/safeFormat\(\s*\|\|\s*new Date\(\)/g, 'safeFormat(new Date()');
  fs.writeFileSync(file, code);
}
