const fs = require('fs');
let content = fs.readFileSync('src/pages/AccountantDashboard.tsx', 'utf8');

// 1. Update `updateStatus` logic
const oldUpdateStatus = `  const updateStatus = async (id: string, status: string) => {
    await api.put(\`/reconciliations/\${id}\`, { status });
    loadData();
  };`;

const newUpdateStatus = `  const updateStatus = async (id: string, status: string, recon?: any) => {
    if (status === 'AMENDMENT_APPROVED' && recon) {
      const updates = { accountantAmendmentApproval: true };
      if (recon.auditorAmendmentApproval) {
        updates.status = 'AMENDMENT_APPROVED';
      }
      await api.put(\`/reconciliations/\${id}\`, updates);
    } else {
      await api.put(\`/reconciliations/\${id}\`, { status });
    }
    loadData();
  };`;

content = content.replace(oldUpdateStatus, newUpdateStatus);

// 2. Change the button click for amendment approval
content = content.replace(
  `onClick={() => updateStatus(r.id, 'AMENDMENT_APPROVED')}`,
  `onClick={() => updateStatus(r.id, 'AMENDMENT_APPROVED', r)}`
);

content = content.replace(
  `{r.status === 'AMENDMENT_REQUESTED' && (`,
  `{r.status === 'AMENDMENT_REQUESTED' && !r.accountantAmendmentApproval && (`
);

// 3. Add `salesInputtedByName` logic
const saveSalesOld = `        ...(confirmEntry ? { salesConfirmed: true } : {})
      });`;

const saveSalesNew = `        ...(confirmEntry ? { salesConfirmed: true } : {}),
        salesInputtedBy: reconciliation.salesInputtedBy || currentUser?.id,
        salesInputtedByName: reconciliation.salesInputtedByName || currentUser?.name,
      });`;

content = content.replace(saveSalesOld, saveSalesNew);
// we need to get currentUser into InputSalesModal. 
// wait, InputSalesModal doesn't have currentUser in scope! 
// Let's pass it as a prop.

content = content.replace(
  `<InputSalesModal reconciliation={reconciliations.find`,
  `<InputSalesModal currentUser={user} reconciliation={reconciliations.find`
);

content = content.replace(
  `function InputSalesModal({ reconciliation, rates, onClose, onUpdate }: any)`,
  `function InputSalesModal({ currentUser, reconciliation, rates, onClose, onUpdate }: any)`
);

// Display sales inputter
const oldDateDisplay = `<td className="px-6 py-4 text-slate-300">{format(new Date(r.date), 'MMM d, yyyy')}</td>`;
const newDateDisplay = `<td className="px-6 py-4 text-slate-300">
                      <div>{format(new Date(r.date), 'MMM d, yyyy')}</div>
                      {r.salesInputtedByName && <div className="text-[10px] text-emerald-400 font-bold mt-1">Sales by: {r.salesInputtedByName}</div>}
                    </td>`;
content = content.replace(oldDateDisplay, newDateDisplay);

fs.writeFileSync('src/pages/AccountantDashboard.tsx', content);
console.log("Patched AccountantDashboard");
