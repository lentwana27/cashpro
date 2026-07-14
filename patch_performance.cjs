const fs = require('fs');
let code = fs.readFileSync('src/components/CashierPerformance.tsx', 'utf8');

// Change sorting to totalUnders
code = code.replace(
`return Object.values(stats).sort((a, b) => a.variance - b.variance); // Sort by highest shortage first`,
`return Object.values(stats).sort((a, b) => a.totalUnders - b.totalUnders); // Sort by highest shortage first`
);

// Remove Net Variance column header
code = code.replace(
`<th className="px-6 py-4 font-medium text-right">Net Variance (USD)</th>`,
``
);

// Remove Net Variance cell
code = code.replace(
`<td className={clsx("px-6 py-4 text-right font-bold font-mono", c.variance < 0 ? "text-rose-400" : c.variance > 0 ? "text-emerald-400" : "text-slate-400")}>
                    {c.variance > 0 ? "+" : ""}{c.variance.toFixed(2)}
                  </td>`,
``
);

fs.writeFileSync('src/components/CashierPerformance.tsx', code);
