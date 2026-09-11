const fs = require('fs');

// 1. Update AccountantDashboard.tsx
let acc = fs.readFileSync('src/pages/AccountantDashboard.tsx', 'utf8');
acc = acc.replace(
  'salesInputtedBy: reconciliation.salesInputtedBy || currentUser?.id,',
  'salesInputtedBy: currentUser?.id,'
);
acc = acc.replace(
  'salesInputtedByName: reconciliation.salesInputtedByName || currentUser?.name,',
  'salesInputtedByName: currentUser?.name,'
);
// Always show the button for Accountant, or change text based on salesConfirmed
acc = acc.replace(
  `{!r.salesConfirmed && (
                        <button onClick={() => setEditingSalesId(r.id)} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 rounded text-xs font-bold transition-colors">
                          Input Sales
                        </button>
                      )}`,
  `<button onClick={() => setEditingSalesId(r.id)} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 rounded text-xs font-bold transition-colors">
                          {r.salesConfirmed ? 'Edit Sales' : 'Input Sales'}
                        </button>`
);
fs.writeFileSync('src/pages/AccountantDashboard.tsx', acc);

// 2. Update AuditorDashboard.tsx
let aud = fs.readFileSync('src/pages/AuditorDashboard.tsx', 'utf8');
aud = aud.replace(
  'salesInputtedBy: reconciliation.salesInputtedBy || currentUser?.id,',
  'salesInputtedBy: currentUser?.id,'
);
aud = aud.replace(
  'salesInputtedByName: reconciliation.salesInputtedByName || currentUser?.name,',
  'salesInputtedByName: currentUser?.name,'
);
aud = aud.replace(
  `{!r.salesConfirmed && (
                        <button 
                          onClick={() => setEditingSalesId(r.id)}
                          className="px-3 py-1.5 ml-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded transition-colors text-xs font-bold"
                        >
                          Input Sales
                        </button>
                      )}`,
  `<button 
                          onClick={() => setEditingSalesId(r.id)}
                          className="px-3 py-1.5 ml-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded transition-colors text-xs font-bold"
                        >
                          {r.salesConfirmed ? 'Edit Sales' : 'Input Sales'}
                        </button>`
);
fs.writeFileSync('src/pages/AuditorDashboard.tsx', aud);

console.log("Patched sales entry logic");
