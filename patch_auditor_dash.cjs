const fs = require('fs');
let code = fs.readFileSync('src/pages/AuditorDashboard.tsx', 'utf8');

// Insert import if not exists
if (!code.includes('CashierShortageChart')) {
  code = code.replace(/import \{ DailyReconciliation, Branch \} from '\.\.\/lib\/types';/g, 
  "import { DailyReconciliation, Branch } from '../lib/types';\nimport { CashierShortageChart } from '../components/CashierShortageChart';");
}

code = code.replace(/<\/div>\n    <\/div>\n  \);\n\}\n\nfunction PreviewSection/g, 
  `</div>\n      <CashierShortageChart reconciliations={filteredRecon} branches={branches} />\n    </div>\n  );\n}\n\nfunction PreviewSection`);
  
fs.writeFileSync('src/pages/AuditorDashboard.tsx', code);
