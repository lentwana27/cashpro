const fs = require('fs');
let content = fs.readFileSync('src/components/CashierMonthlyPerformance.tsx', 'utf8');

content = content.replace(
  "id: string, name: string, overUSD: number, underUSD: number, overZAR: number, underZAR: number }>",
  "id: string, name: string, branchName: string, overUSD: number, underUSD: number, overZAR: number, underZAR: number }>"
);

content = content.replace(
  "if (!stats[tv.cashierId]) {",
  "const b = branches.find(b => b.id === r.branchId);\n          const bName = b ? b.name : 'Unknown';\n          if (!stats[tv.cashierId]) {"
);

content = content.replace(
  "stats[tv.cashierId] = { id: tv.cashierId, name: tv.cashierName || 'Unknown', overUSD: 0, underUSD: 0, overZAR: 0, underZAR: 0 };",
  "stats[tv.cashierId] = { id: tv.cashierId, name: tv.cashierName || 'Unknown', branchName: bName, overUSD: 0, underUSD: 0, overZAR: 0, underZAR: 0 };"
);

content = content.replace(
  '<th className="px-6 py-4 font-medium" rowSpan={2}>Cashier Name</th>',
  '<th className="px-6 py-4 font-medium" rowSpan={2}>Cashier Name</th>\n                <th className="px-6 py-4 font-medium" rowSpan={2}>Branch</th>'
);

content = content.replace(
  '<td className="px-6 py-4 font-bold text-white">{c.name}</td>',
  '<td className="px-6 py-4 font-bold text-white">{c.name}</td>\n                  <td className="px-6 py-4 text-slate-300">{c.branchName}</td>'
);

fs.writeFileSync('src/components/CashierMonthlyPerformance.tsx', content);
console.log('Patched CashierMonthlyPerformance.tsx!');
