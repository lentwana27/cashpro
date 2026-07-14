const fs = require('fs');
let code = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');

// replace the MissingSalesForm tillVariances initialization
code = code.replace(
`  const [tillVariances, setTillVariances] = useState<any[]>(() => {
    if (recon?.tillVariances && recon.tillVariances.length > 0) return recon.tillVariances;
    return cashBreakdown.map((cb: any) => ({
      tillName: cb.description.replace('Cash: ', '').replace('End of Day Physical Cash Counted', 'Total Sales'),
      cashierId: cb.cashierId || '',
      cashierName: cb.cashierName || '',
      expected: 0,
      actual: cb.usdEquivalent || 0,
      variance: 0
    }));
  });`,
`  const tillNames =
    branch?.hasTills && branch.tills?.length > 0
      ? branch.tills.map((t: any) => t.name)
      : ["Total Sales"];

  const [tillVariances, setTillVariances] = useState<any[]>(() => {
    if (recon?.tillVariances && recon.tillVariances.length > 0) return recon.tillVariances;
    return tillNames.map((name: string) => {
        const matchingCash = cashBreakdown.filter((cb: any) => cb.description.includes(name) || cb.description.includes("End of Day Physical Cash Counted"));
        const totalCash = matchingCash.reduce((acc: number, curr: any) => acc + (curr.usdEquivalent || 0), 0);
        const cashierId = matchingCash[0]?.cashierId || '';
        const cashierName = matchingCash[0]?.cashierName || '';
        return {
            tillName: name,
            cashierId,
            cashierName,
            expected: 0,
            actual: totalCash,
            variance: 0
        };
    });
  });`
);

// We need to remove the duplicate tillNames below createItem since we hoisted it
code = code.replace(
`  const createItem = (desc: string): ReconLineItem => ({
    id: Math.random().toString(),
    reconciliationId: "",
    description: desc,
    amount: 0,
    currencyCode: desc.includes("(ZAR)") ? "ZAR" : "USD",
    usdEquivalent: 0,
  });

  const tillNames =
    branch?.hasTills && branch.tills?.length > 0
      ? branch.tills.map((t: any) => t.name)
      : ["Total Sales"];`,
`  const createItem = (desc: string): ReconLineItem => ({
    id: Math.random().toString(),
    reconciliationId: "",
    description: desc,
    amount: 0,
    currencyCode: desc.includes("(ZAR)") ? "ZAR" : "USD",
    usdEquivalent: 0,
  });`
);

// We also need to fix computedTillVariances in handleSubmit
code = code.replace(
`      const computedTillVariances = tillVariances.map((tv: any, idx: number) => {
        const tillSales = updatedTotalSales[idx]?.usdEquivalent || 0;
        const tillCash = cashBreakdown[idx]?.usdEquivalent || 0;`,
`      const computedTillVariances = tillVariances.map((tv: any, idx: number) => {
        const tillSales = updatedTotalSales[idx]?.usdEquivalent || 0;
        const matchingCash = cashBreakdown.filter((cb: any) => cb.description.includes(tv.tillName) || cb.description.includes("End of Day Physical Cash Counted"));
        const tillCash = matchingCash.reduce((acc: number, curr: any) => acc + (curr.usdEquivalent || 0), 0);`
);

fs.writeFileSync('src/pages/SupervisorDashboard.tsx', code);
