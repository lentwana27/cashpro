const fs = require('fs');
let content = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');

// 1. Update cashTillNames to include Ecocash and Bank Transfer
const oldCashTillNames = `  const cashTillNames =
    branch?.hasTills && branch.tills?.length > 0
      ? branch.tills.map((t: any) => \`Cash: \${t.name}\`)
      : ["End of Day Physical Cash Counted"];`;

const newCashTillNames = `  const cashTillNames =
    branch?.hasTills && branch.tills?.length > 0
      ? [...branch.tills.map((t: any) => \`Cash: \${t.name}\`), "Ecocash", "Bank Transfer"]
      : ["End of Day Physical Cash Counted", "Ecocash", "Bank Transfer"];`;

content = content.replace(oldCashTillNames, newCashTillNames);

// 2. Hide Clear Past Data for non-ADMIN
const oldClearBtn = `        <div className="flex items-center gap-3">
          <button 
            onClick={handleClearPastData}
            className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Clear Past Data
          </button>`;

const newClearBtn = `        <div className="flex items-center gap-3">
          {user?.role === 'ADMIN' && (
            <button 
              onClick={handleClearPastData}
              className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Clear Past Data
            </button>
          )}`;

content = content.replace(oldClearBtn, newClearBtn);

fs.writeFileSync('src/pages/SupervisorDashboard.tsx', content);
console.log('Patched SupervisorDashboard.tsx!');
