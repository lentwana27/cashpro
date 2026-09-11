const fs = require('fs');
let content = fs.readFileSync('src/pages/AuditorDashboard.tsx', 'utf8');

const markFlagged = `  const markAsFlagged = async (id: string) => {
    try {
      await api.put(\`/reconciliations/\${id}\`, { status: 'FLAGGED' });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };`;

const updateStatus = `  const updateStatus = async (id: string, status: string, recon?: any) => {
    if (status === 'AMENDMENT_APPROVED' && recon) {
      const updates = { auditorAmendmentApproval: true };
      if (recon.accountantAmendmentApproval) {
        updates.status = 'AMENDMENT_APPROVED';
      }
      await api.put(\`/reconciliations/\${id}\`, updates);
    } else {
      await api.put(\`/reconciliations/\${id}\`, { status });
    }
    loadData();
  };
`;

content = content.replace(markFlagged, markFlagged + '\n\n' + updateStatus);

// In the row mapping, add Edit Sales and Approve Amendment buttons
const actionsOld = `{r.status !== 'FLAGGED' && (
                        <button 
                          onClick={() => markAsFlagged(r.id)}
                          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded transition-colors text-xs font-bold"
                        >
                          Flag Issue
                        </button>
                      )}`;

const actionsNew = `{r.status !== 'FLAGGED' && (
                        <button 
                          onClick={() => markAsFlagged(r.id)}
                          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded transition-colors text-xs font-bold"
                        >
                          Flag
                        </button>
                      )}
                      {!r.salesConfirmed && (
                        <button 
                          onClick={() => setEditingSalesId(r.id)}
                          className="px-3 py-1.5 ml-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded transition-colors text-xs font-bold"
                        >
                          Input Sales
                        </button>
                      )}
                      {r.status === 'AMENDMENT_REQUESTED' && !r.auditorAmendmentApproval && (
                        <button 
                          onClick={() => updateStatus(r.id, 'AMENDMENT_APPROVED', r)}
                          className="px-3 py-1.5 ml-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded transition-colors text-xs font-bold"
                        >
                          Approve Amendment
                        </button>
                      )}`;

content = content.replace(actionsOld, actionsNew);

// Add salesInputtedByName display
const oldDateDisplay = `<td className="px-6 py-4 text-slate-300">{format(new Date(r.date), 'MMM d, yyyy')}</td>`;
const newDateDisplay = `<td className="px-6 py-4 text-slate-300">
                      <div>{format(new Date(r.date), 'MMM d, yyyy')}</div>
                      {r.salesInputtedByName && <div className="text-[10px] text-emerald-400 font-bold mt-1">Sales by: {r.salesInputtedByName}</div>}
                    </td>`;
content = content.replace(oldDateDisplay, newDateDisplay);

// Add modal logic at the bottom before last </div>
const modalLogic = `
      {editingSalesId && (
        <InputSalesModal 
          currentUser={user}
          reconciliation={reconciliations.find(r => r.id === editingSalesId)} 
          rates={rates} 
          onClose={() => setEditingSalesId(null)}
          onUpdate={() => {
            setEditingSalesId(null);
            loadData();
          }}
        />
      )}
`;

const lastDivIndex = content.lastIndexOf('</div>');
content = content.substring(0, lastDivIndex) + modalLogic + content.substring(lastDivIndex);

fs.writeFileSync('src/pages/AuditorDashboard.tsx', content);
console.log("Patched Auditor");
