const fs = require('fs');
let content = fs.readFileSync('src/lib/types.ts', 'utf8');

content = content.replace(
  "salesConfirmed?: boolean;",
  "salesConfirmed?: boolean;\n  salesInputtedBy?: string;\n  salesInputtedByName?: string;\n  auditorAmendmentApproval?: boolean;\n  accountantAmendmentApproval?: boolean;"
);

fs.writeFileSync('src/lib/types.ts', content);
console.log("Patched types");
