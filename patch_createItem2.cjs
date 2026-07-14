const fs = require('fs');
let code = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');

code = code.replace(
`  const createItem = (desc: string): ReconLineItem => ({
    id: Math.random().toString(),
    reconciliationId: "",
    description: desc,
    amount: 0,
    currencyCode: "USD",
    usdEquivalent: 0,
  });`,
`  const createItem = (desc: string): ReconLineItem => ({
    id: Math.random().toString(),
    reconciliationId: "",
    description: desc,
    amount: 0,
    currencyCode: desc.includes("(ZAR)") ? "ZAR" : "USD",
    usdEquivalent: 0,
  });`
);
fs.writeFileSync('src/pages/SupervisorDashboard.tsx', code);
