const fs = require('fs');
const files = [
  'src/pages/DirectorDashboard.tsx',
  'src/pages/AuditorDashboard.tsx',
  'src/pages/AccountantDashboard.tsx',
  'src/pages/SupervisorDashboard.tsx'
];

for (const file of files) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/<CashierPerformance[^\>]*\/>/g, "");
  code = code.replace(/<CashierShortageChart[^\>]*\/>/g, "");
  fs.writeFileSync(file, code);
}
