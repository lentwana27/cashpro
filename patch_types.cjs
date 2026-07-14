const fs = require('fs');
let code = fs.readFileSync('src/lib/types.ts', 'utf8');

code = code.replace(
`  amount: number | string;
  currencyCode: string;`,
`  amount: number | string;
  amountZar?: number | string;
  currencyCode: string;`
);

fs.writeFileSync('src/lib/types.ts', code);
