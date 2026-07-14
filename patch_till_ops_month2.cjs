const fs = require('fs');
let code = fs.readFileSync('src/pages/TillOperators.tsx', 'utf8');

code = code.replace(
`<CashierMonthlyPerformance reconciliations={reconciliations} />`,
`<CashierMonthlyPerformance reconciliations={reconciliations} branches={branches} />`
);

fs.writeFileSync('src/pages/TillOperators.tsx', code);
