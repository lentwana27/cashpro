const fs = require('fs');
let file = 'src/pages/AuditorDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');
if (!code.includes('CashierPerformance')) {
  code = code.replace(/import \{ DailyReconciliation \} from '\.\.\/lib\/types';/, "import { DailyReconciliation } from '../lib/types';\nimport { CashierPerformance } from '../components/CashierPerformance';");
  const lastDivRegex = /<\/div>\s*<\/div>\s*\);\s*\}/;
  if (lastDivRegex.test(code)) {
    code = code.replace(lastDivRegex, `
        <CashierPerformance reconciliations={filteredReconciliations} />
      </div>
    </div>
  );
}`);
  }
  fs.writeFileSync(file, code);
}
