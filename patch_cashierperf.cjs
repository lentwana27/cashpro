const fs = require('fs');
let code = fs.readFileSync('src/components/CashierPerformance.tsx', 'utf8');

code = code.replace(/\{ name: string, sales: number, cash: number, variance: number, counts: number \}/g, 
`{ name: string, sales: number, cash: number, variance: number, totalOvers: number, totalUnders: number, counts: number }`);

code = code.replace(/stats\[tv\.cashierId\] = \{ name: tv\.cashierName \|\| 'Unknown', sales: 0, cash: 0, variance: 0, counts: 0 \};/g,
`stats[tv.cashierId] = { name: tv.cashierName || 'Unknown', sales: 0, cash: 0, variance: 0, totalOvers: 0, totalUnders: 0, counts: 0 };`);

code = code.replace(/stats\[tv\.cashierId\]\.variance \+= \(tv\.variance \|\| 0\);/g,
`const v = tv.variance || 0;
          stats[tv.cashierId].variance += v;
          if (v > 0) stats[tv.cashierId].totalOvers += v;
          if (v < 0) stats[tv.cashierId].totalUnders += v;`);

code = code.replace(/<th className="px-6 py-4 font-medium text-right">Total Expected Sales \(USD\)<\/th>\n\s*<th className="px-6 py-4 font-medium text-right">Total Actual Cash \(USD\)<\/th>\n\s*<th className="px-6 py-4 font-medium text-right">Total Variance \(USD\)<\/th>/g,
`<th className="px-6 py-4 font-medium text-right">Total Expected Sales (USD)</th>
                <th className="px-6 py-4 font-medium text-right">Total Actual Cash (USD)</th>
                <th className="px-6 py-4 font-medium text-right text-emerald-400">Total Overs (USD)</th>
                <th className="px-6 py-4 font-medium text-right text-rose-400">Total Unders (USD)</th>
                <th className="px-6 py-4 font-medium text-right">Net Variance (USD)</th>`);

code = code.replace(/<td className="px-6 py-4 text-right font-mono text-slate-300">\$c\.cash\.toFixed\(2\)<\/td>\n\s*<td className=\{clsx\("px-6 py-4 text-right font-bold font-mono", c\.variance < 0 \? "text-rose-400" : c\.variance > 0 \? "text-emerald-400" : "text-slate-400"\)\}>\n\s*\{c\.variance > 0 \? "\+" : ""\}\{c\.variance\.toFixed\(2\)\}\n\s*<\/td>/g,
`<td className="px-6 py-4 text-right font-mono text-slate-300">\${c.cash.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400">
                    {c.totalOvers > 0 ? "+" : ""}{c.totalOvers.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-rose-400">
                    {c.totalUnders.toFixed(2)}
                  </td>
                  <td className={clsx("px-6 py-4 text-right font-bold font-mono", c.variance < 0 ? "text-rose-400" : c.variance > 0 ? "text-emerald-400" : "text-slate-400")}>
                    {c.variance > 0 ? "+" : ""}{c.variance.toFixed(2)}
                  </td>`);

fs.writeFileSync('src/components/CashierPerformance.tsx', code);
