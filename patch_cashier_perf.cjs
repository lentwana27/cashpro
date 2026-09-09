const fs = require('fs');
let content = fs.readFileSync('src/components/CashierPerformance.tsx', 'utf8');

// Update stats interface
content = content.replace(
  "id: string, name: string, sales: number, cash: number, variance: number, totalOvers: number, totalUnders: number, counts: number }>",
  "id: string, name: string, branchName: string, sales: number, cash: number, variance: number, totalOvers: number, totalUnders: number, counts: number }>"
);

// Add branch mapping
content = content.replace(
  "if (!stats[tv.cashierId]) {",
  "const b = branches.find(b => b.id === r.branchId);\n          const bName = b ? b.name : 'Unknown';\n          if (!stats[tv.cashierId]) {"
);

// Update init
content = content.replace(
  "stats[tv.cashierId] = { id: tv.cashierId, name: tv.cashierName || 'Unknown', sales: 0, cash: 0, variance: 0, totalOvers: 0, totalUnders: 0, counts: 0 };",
  "stats[tv.cashierId] = { id: tv.cashierId, name: tv.cashierName || 'Unknown', branchName: bName, sales: 0, cash: 0, variance: 0, totalOvers: 0, totalUnders: 0, counts: 0 };"
);

// Update table header
content = content.replace(
  '<th className="px-6 py-4 font-medium">Cashier Name</th>',
  '<th className="px-6 py-4 font-medium">Cashier Name</th>\n                <th className="px-6 py-4 font-medium">Branch</th>'
);

// Update table row
content = content.replace(
  '<td className="px-6 py-4 font-bold text-white">{c.name}</td>',
  '<td className="px-6 py-4 font-bold text-white">{c.name}</td>\n                  <td className="px-6 py-4 text-slate-300">{c.branchName}</td>'
);

fs.writeFileSync('src/components/CashierPerformance.tsx', content);
console.log('Patched CashierPerformance.tsx!');
