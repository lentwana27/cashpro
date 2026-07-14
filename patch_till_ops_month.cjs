const fs = require('fs');
let code = fs.readFileSync('src/pages/TillOperators.tsx', 'utf8');

code = code.replace(
`import { CashierShortageChart } from '../components/CashierShortageChart';`,
`import { CashierShortageChart } from '../components/CashierShortageChart';\nimport { CashierMonthlyPerformance } from '../components/CashierMonthlyPerformance';`
);

code = code.replace(
`<CashierPerformance reconciliations={reconciliations} branches={branches} />`,
`<CashierMonthlyPerformance reconciliations={reconciliations} />\n      <CashierPerformance reconciliations={reconciliations} branches={branches} />`
);

fs.writeFileSync('src/pages/TillOperators.tsx', code);
