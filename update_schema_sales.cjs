const fs = require('fs');
let content = fs.readFileSync('src/db/schema.ts', 'utf8');

content = content.replace(
  "salesConfirmed: boolean('sales_confirmed').default(false),",
  "salesConfirmed: boolean('sales_confirmed').default(false),\n  salesInputtedBy: text('sales_inputted_by'),\n  salesInputtedByName: text('sales_inputted_by_name'),\n  auditorAmendmentApproval: boolean('auditor_amendment_approval').default(false),\n  accountantAmendmentApproval: boolean('accountant_amendment_approval').default(false),"
);

fs.writeFileSync('src/db/schema.ts', content);
console.log("Patched schema");
