const fs = require('fs');
let code = fs.readFileSync('src/pages/TillOperators.tsx', 'utf8');

code = code.replace(
`<CashierPerformance reconciliations={reconciliations} />`,
`<CashierPerformance reconciliations={reconciliations} branches={branches} />`
);

fs.writeFileSync('src/pages/TillOperators.tsx', code);
