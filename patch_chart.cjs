const fs = require('fs');
let code = fs.readFileSync('src/components/CashierShortageChart.tsx', 'utf8');

code = code.replace(
`stats[key].variance += (tv.variance || 0);`,
`if ((tv.variance || 0) < 0) {
            stats[key].variance += (tv.variance || 0);
          }`
);

fs.writeFileSync('src/components/CashierShortageChart.tsx', code);
