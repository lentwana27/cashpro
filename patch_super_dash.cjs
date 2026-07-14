const fs = require('fs');

let code = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');

if (!code.includes('CashierPerformance')) {
  code = code.replace(/import \{ ExchangeRate, DailyReconciliation, ReconLineItem \} from "\.\.\/lib\/types";/, `import { ExchangeRate, DailyReconciliation, ReconLineItem } from "../lib/types";
import { CashierPerformance } from "../components/CashierPerformance";`);

  // inject it into the return value before the Quick Log Modal (which is near the end)
  code = code.replace(/\{\/\* Quick Log Modal \*\/\}/g, `
      {history.length > 0 && (
         <CashierPerformance reconciliations={history} />
      )}
      {/* Quick Log Modal */}`);
  
  fs.writeFileSync('src/pages/SupervisorDashboard.tsx', code);
}
