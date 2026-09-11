const fs = require('fs');
let content = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');

// MissingSalesForm
content = content.replace(
  `function MissingSalesForm({ recon, rates, branch, cashiers, onCancel, onSuccess }: any)`,
  `function MissingSalesForm({ currentUser, recon, rates, branch, cashiers, onCancel, onSuccess }: any)`
);

content = content.replace(
  `<MissingSalesForm`,
  `<MissingSalesForm currentUser={user}`
);

const oldMissingSalesPut = `        salesConfirmed: true,
      });`;

const newMissingSalesPut = `        salesConfirmed: true,
        salesInputtedBy: recon.salesInputtedBy || currentUser?.id,
        salesInputtedByName: recon.salesInputtedByName || currentUser?.name,
      });`;

content = content.replace(oldMissingSalesPut, newMissingSalesPut);

// CashUpForm - initial submission
const oldCashupSubmit = `      salesConfirmed: existingData?.salesConfirmed || false,
    };`;

const newCashupSubmit = `      salesConfirmed: existingData?.salesConfirmed || false,
      salesInputtedBy: existingData?.salesInputtedBy || user?.id,
      salesInputtedByName: existingData?.salesInputtedByName || user?.name,
    };`;

content = content.replace(oldCashupSubmit, newCashupSubmit);

// Display sales inputter in Supervisor history
const oldDateDisplay = `<td className="px-6 py-4 text-slate-300">{format(new Date(r.date), 'MMM d, yyyy')}</td>`;
const newDateDisplay = `<td className="px-6 py-4 text-slate-300">
                      <div>{format(new Date(r.date), 'MMM d, yyyy')}</div>
                      {r.salesInputtedByName && <div className="text-[10px] text-emerald-400 font-bold mt-1">Sales by: {r.salesInputtedByName}</div>}
                    </td>`;
content = content.replace(oldDateDisplay, newDateDisplay);

fs.writeFileSync('src/pages/SupervisorDashboard.tsx', content);
console.log("Patched SupervisorDashboard");
