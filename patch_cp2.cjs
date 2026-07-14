const fs = require('fs');
let code = fs.readFileSync('src/components/CashierPerformance.tsx', 'utf8');

code = code.replace(/<td className="px-6 py-4 text-right font-mono text-slate-300">\\$\{c\.cash\.toFixed\(2\)\}<\/td>\n\s*<td className=\{clsx\("px-6 py-4 text-right font-bold font-mono", c\.variance < 0 \? "text-rose-400" : c\.variance > 0 \? "text-emerald-400" : "text-slate-400"\)\}>\n\s*\{c\.variance > 0 \? "\+" : ""\}\{c\.variance\.toFixed\(2\)\}\n\s*<\/td>/g,
`<td className="px-6 py-4 text-right font-mono text-slate-300">\${c.cash.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400">
                    {c.totalOvers > 0 ? "+" : ""}{c.totalOvers.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-rose-400">
                    {c.totalUnders < 0 ? c.totalUnders.toFixed(2) : "0.00"}
                  </td>
                  <td className={clsx("px-6 py-4 text-right font-bold font-mono", c.variance < 0 ? "text-rose-400" : c.variance > 0 ? "text-emerald-400" : "text-slate-400")}>
                    {c.variance > 0 ? "+" : ""}{c.variance.toFixed(2)}
                  </td>`);

fs.writeFileSync('src/components/CashierPerformance.tsx', code);
