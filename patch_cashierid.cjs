const fs = require('fs');
let code = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');

code = code.replace(
`        const cashierId = matchingCash[0]?.cashierId || '';
        const cashierName = matchingCash[0]?.cashierName || '';`,
`        const cashierId = matchingCash.find((cb: any) => cb.cashierId)?.cashierId || '';
        const cashierName = matchingCash.find((cb: any) => cb.cashierName)?.cashierName || '';`
);

fs.writeFileSync('src/pages/SupervisorDashboard.tsx', code);
