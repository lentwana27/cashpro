const fs = require('fs');

// Fix CashierMonthlyPerformance
let code = fs.readFileSync('src/components/CashierMonthlyPerformance.tsx', 'utf8');
code = code.replace(
  `const stats: Record<string, { name: string, overUSD: number, underUSD: number, overZAR: number, underZAR: number }> = {};`,
  `const stats: Record<string, { id: string, name: string, overUSD: number, underUSD: number, overZAR: number, underZAR: number }> = {};`
);
fs.writeFileSync('src/components/CashierMonthlyPerformance.tsx', code);

// Fix CashierPerformance
code = fs.readFileSync('src/components/CashierPerformance.tsx', 'utf8');
code = code.replace(
  `const stats: Record<string, { name: string, sales: number, cash: number, variance: number, totalOvers: number, totalUnders: number, counts: number }> = {};`,
  `const stats: Record<string, { id: string, name: string, sales: number, cash: number, variance: number, totalOvers: number, totalUnders: number, counts: number }> = {};`
);
fs.writeFileSync('src/components/CashierPerformance.tsx', code);

// Fix SupervisorDashboard
code = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');
code = code.replace(
  `<CashierShortageChart reconciliations={reconciliations} />`,
  `<CashierShortageChart reconciliations={reconciliations} branches={branches} />`
);
code = code.replace(
  `<CashierMonthlyPerformance reconciliations={reconciliations} />`,
  `<CashierMonthlyPerformance reconciliations={reconciliations} branches={branches} />`
);
code = code.replace(
  `<CashierPerformance reconciliations={reconciliations} />`,
  `<CashierPerformance reconciliations={reconciliations} branches={branches} />`
);
fs.writeFileSync('src/pages/SupervisorDashboard.tsx', code);
