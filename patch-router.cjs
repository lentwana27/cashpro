const fs = require('fs');
let code = fs.readFileSync('src/pages/DashboardRouter.tsx', 'utf8');

if (!code.includes('CashierDashboard')) {
  code = code.replace(
    "import { AuditorDashboard } from './AuditorDashboard';",
    "import { AuditorDashboard } from './AuditorDashboard';\nimport { CashierDashboard } from './CashierDashboard';"
  );
  
  code = code.replace(
    "case 'AUDITOR':\n      return <AuditorDashboard />;",
    "case 'AUDITOR':\n      return <AuditorDashboard />;\n    case 'CASHIER':\n      return <CashierDashboard />;"
  );
  
  fs.writeFileSync('src/pages/DashboardRouter.tsx', code);
}
