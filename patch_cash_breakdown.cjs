const fs = require('fs');
let code = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');

// Patch createItem inside Form
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

// Patch cashTillNames
code = code.replace(
`  const cashTillNames =
    branch?.hasTills && branch.tills?.length > 0
      ? branch.tills.map((t: any) => \`Cash: \${t.name}\`)
      : ["End of Day Physical Cash Counted"];`,
`  const cashTillNames =
    branch?.hasTills && branch.tills?.length > 0
      ? branch.tills.flatMap((t: any) => [\`Cash: \${t.name} (USD)\`, \`Cash: \${t.name} (ZAR)\`])
      : ["End of Day Physical Cash Counted (USD)", "End of Day Physical Cash Counted (ZAR)"];`
);

// Also patch createItem inside ReconListField just in case they add more
code = code.replace(
`  const createItem = (desc: string) => ({
    id: Math.random().toString(),
    description: desc,
    amount: 0,
    currencyCode: "USD",
    usdEquivalent: 0,
  });`,
`  const createItem = (desc: string) => ({
    id: Math.random().toString(),
    description: desc,
    amount: 0,
    currencyCode: desc.includes("(ZAR)") ? "ZAR" : "USD",
    usdEquivalent: 0,
  });`
);

fs.writeFileSync('src/pages/SupervisorDashboard.tsx', code);
