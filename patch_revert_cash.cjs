const fs = require('fs');
let code = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');

code = code.replace(
`  const cashTillNames =
    branch?.hasTills && branch.tills?.length > 0
      ? branch.tills.flatMap((t: any) => [\`Cash: \${t.name} (USD)\`, \`Cash: \${t.name} (ZAR)\`])
      : ["End of Day Physical Cash Counted (USD)", "End of Day Physical Cash Counted (ZAR)"];`,
`  const cashTillNames =
    branch?.hasTills && branch.tills?.length > 0
      ? branch.tills.map((t: any) => \`Cash: \${t.name}\`)
      : ["End of Day Physical Cash Counted"];`
);

fs.writeFileSync('src/pages/SupervisorDashboard.tsx', code);
