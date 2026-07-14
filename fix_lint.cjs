const fs = require('fs');

let code = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');
code = code.replace(
  `<CashierPerformance reconciliations={history} />`,
  `<CashierPerformance reconciliations={history} branches={branches} />`
);
fs.writeFileSync('src/pages/SupervisorDashboard.tsx', code);
