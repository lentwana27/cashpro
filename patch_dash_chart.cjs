const fs = require('fs');

function injectChart(file) {
  let code = fs.readFileSync(file, 'utf8');
  if (code.includes('CashierShortageChart')) return;
  
  code = code.replace(/import \{ CashierPerformance \} from '\.\.\/components\/CashierPerformance';/, "import { CashierPerformance } from '../components/CashierPerformance';\nimport { CashierShortageChart } from '../components/CashierShortageChart';");
  
  // Try inserting it right after <CashierPerformance />
  code = code.replace(/<CashierPerformance reconciliations=\{filteredReconciliations\} \/>/g, 
    "<CashierPerformance reconciliations={filteredReconciliations} />\n        <CashierShortageChart reconciliations={filteredReconciliations} branches={branches} />");

  fs.writeFileSync(file, code);
}

injectChart('src/pages/DirectorDashboard.tsx');
injectChart('src/pages/AuditorDashboard.tsx');
