const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

content = content.replace(
  "{u.branchId && <span className=\"px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px] font-medium\">{u.branchId}</span>}",
  "{u.branchId && <span className=\"px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px] font-medium\">{branches.find(b => b.id === u.branchId)?.name || u.branchId}</span>}"
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
console.log('Patched AdminDashboard.tsx!');
