const fs = require('fs');
const path = require('path');

const files = [
  'src/components/CashierMonthlyPerformance.tsx',
  'src/components/CashierHistoryModal.tsx',
  'src/components/UpdatesModal.tsx',
  'src/components/ExportReportModal.tsx',
  'src/components/ReconModal.tsx',
  'src/components/BranchHistoryModal.tsx',
  'src/pages/SystemBranches.tsx',
  'src/pages/AdminDashboard.tsx',
  'src/pages/DirectorDashboard.tsx',
  'src/pages/AccountantDashboard.tsx',
  'src/pages/SupervisorDashboard.tsx',
  'src/pages/AuditorDashboard.tsx'
];

for (const file of files) {
  let code = fs.readFileSync(file, 'utf8');
  
  // Add import if not there
  if (code.includes('format(new Date') && !code.includes('safeFormat')) {
     const importPath = file.startsWith('src/pages') ? '../lib/formatDate' : '../lib/formatDate';
     code = `import { safeFormat } from '${importPath}';\n` + code;
  }

  // Replace format(new Date(X), Y) with safeFormat(X, Y)
  // Need to be careful about nested parentheses.
  // Actually, we can just replace `format(new Date(` with `safeFormat(` for most things.
  // But safeFormat expects dateString, not a Date object, although new Date(Date object) is valid.
  // We can just use a robust regex.
  code = code.replace(/format\(new Date\(([^)]*)\),\s*([^)]+)\)/g, 'safeFormat($1 || new Date(), $2)');
  code = code.replace(/format\(new Date\(\),\s*([^)]+)\)/g, 'safeFormat(new Date(), $1)');
  
  fs.writeFileSync(file, code);
}
