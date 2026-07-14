const fs = require('fs');
let code = fs.readFileSync('src/components/CashierPerformance.tsx', 'utf8');

let target = '<td className="px-6 py-4 text-right font-mono text-slate-300">${c.cash.toFixed(2)}</td>';
let parts = code.split(target);
if (parts.length === 2) {
  let p2 = parts[1];
  let endVariance = p2.indexOf('</td>') + 5;
  let newPart2 = `
                  <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400">
                    {c.totalOvers > 0 ? "+" : ""}{c.totalOvers.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-rose-400">
                    {c.totalUnders < 0 ? c.totalUnders.toFixed(2) : "0.00"}
                  </td>
` + p2.substring(0, endVariance) + p2.substring(endVariance);
  code = parts[0] + target + newPart2;
  fs.writeFileSync('src/components/CashierPerformance.tsx', code);
}
