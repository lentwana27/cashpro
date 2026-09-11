const fs = require('fs');
let content = fs.readFileSync('src/pages/DirectorDashboard.tsx', 'utf8');

const oldDateDisplay = `<td className="px-4 py-3 text-slate-300">{r.date}</td>`;
const newDateDisplay = `<td className="px-4 py-3 text-slate-300">
                      <div>{r.date}</div>
                      {r.salesInputtedByName && <div className="text-[10px] text-emerald-400 font-bold mt-1">Sales by: {r.salesInputtedByName}</div>}
                    </td>`;

content = content.replace(oldDateDisplay, newDateDisplay);
fs.writeFileSync('src/pages/DirectorDashboard.tsx', content);
console.log("Patched Director");
