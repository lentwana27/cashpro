const fs = require('fs');
let code = fs.readFileSync('src/components/CashierMonthlyPerformance.tsx', 'utf8');

code = code.replace(/format\(parseISO\(m \+ '-01'\), 'MMMM yyyy'\)/g, 'safeFormat(parseISO(m + "-01"), "MMMM yyyy")');
code = code.replace(/format\(parseISO\(selectedMonth \+ '-01'\), 'MMMM yyyy'\)/g, 'safeFormat(parseISO(selectedMonth + "-01"), "MMMM yyyy")');

fs.writeFileSync('src/components/CashierMonthlyPerformance.tsx', code);
