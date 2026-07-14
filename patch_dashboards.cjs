const fs = require('fs');

function patchDashboard(file, reconciliationsVar) {
  let code = fs.readFileSync(file, 'utf8');
  if (code.includes('CashierPerformance')) return;
  
  code = code.replace(/import \{ DailyReconciliation, Branch \} from '\.\.\/lib\/types';/, "import { DailyReconciliation, Branch } from '../lib/types';\nimport { CashierPerformance } from '../components/CashierPerformance';");
  
  // Try finding a good place to inject it. Usually after the KPI cards and before or after the main table.
  // We'll put it right after the branchAggregates/table block.
  
  code = code.replace(/(<\/\w+>\s*){2,4} {0,4}\{\/\* Quick Actions \*\/\}/g, match => `
      <CashierPerformance reconciliations={${reconciliationsVar}} startDate={startDate} endDate={endDate} />
${match}`);

  code = code.replace(/(<\/\w+>\s*){2,4} {0,4}export function /g, match => `
      <CashierPerformance reconciliations={${reconciliationsVar}} startDate={startDate} endDate={endDate} />
${match}`); // Failsafe for end of file, but not recommended.

  // Let's just find `</Layout></div>` or similar bottom structures.
  const lastDivRegex = /<\/div>\s*<\/div>\s*\);\s*\}/;
  if (lastDivRegex.test(code)) {
    code = code.replace(lastDivRegex, `
        <CashierPerformance reconciliations={${reconciliationsVar}} startDate={startDate} endDate={endDate} />
      </div>
    </div>
  );
}`);
  }
  
  fs.writeFileSync(file, code);
}

patchDashboard('src/pages/DirectorDashboard.tsx', 'filteredReconciliations');
patchDashboard('src/pages/AccountantDashboard.tsx', 'filteredReconciliations');
patchDashboard('src/pages/AdminDashboard.tsx', 'filteredReconciliations'); // If admin dashboard exists
// Auditor maybe doesn't exist?

