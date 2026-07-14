const fs = require('fs');
let code = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');

const computeCode = `
    const computedTillVariances = tillNames.map((name: string, idx: number) => {
        const tillSales = sales[idx]?.usdEquivalent || 0;
        const matchingCash = cashBreakdown.filter((cb: any) => cb.description.includes(name) || cb.description.includes("End of Day Physical Cash Counted"));
        const tillCash = matchingCash.reduce((acc: number, curr: any) => acc + (curr.usdEquivalent || 0), 0);
        const cashierId = matchingCash.find((cb: any) => cb.cashierId)?.cashierId || '';
        const cashierName = matchingCash.find((cb: any) => cb.cashierName)?.cashierName || 'Unknown';
        
        return {
            tillName: name,
            cashierId,
            cashierName: cashierId ? cashierName : 'Unknown',
            expected: tillSales,
            actual: tillCash,
            variance: tillCash - tillSales
        };
    });

    const payload: any = {
`;

code = code.replace(
`    const payload: any = {`,
computeCode
);

code = code.replace(
`      endOfDayCash,
      tillCashBreakdown: cashBreakdown,
      expectedCashUsd: expected,
      varianceUsd: variance,
      status: "PENDING",`,
`      endOfDayCash,
      tillCashBreakdown: cashBreakdown,
      expectedCashUsd: expected,
      varianceUsd: variance,
      tillVariances: computedTillVariances,
      status: "PENDING",`
);

fs.writeFileSync('src/pages/SupervisorDashboard.tsx', code);
