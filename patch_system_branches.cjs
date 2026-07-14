const fs = require('fs');
let code = fs.readFileSync('src/pages/SystemBranches.tsx', 'utf8');

// Add import
code = code.replace(
`import { ReconModal } from '../components/ReconModal';`,
`import { ReconModal } from '../components/ReconModal';\nimport { BranchHistoryModal } from '../components/BranchHistoryModal';\nimport { CashierHistoryModal } from '../components/CashierHistoryModal';`
);

// Add states
code = code.replace(
`  const [editTillName, setEditTillName] = useState('');`,
`  const [editTillName, setEditTillName] = useState('');\n  const [showBranchHistory, setShowBranchHistory] = useState(false);\n  const [selectedCashierForHistory, setSelectedCashierForHistory] = useState<{id: string, name: string} | null>(null);`
);

// Add View History button
const branchHeaderBefore = `{currentUser?.role === 'ADMIN' && (
                  <button onClick={() => { setEditForm({...selectedBranch}); setIsAddingBranch(true); }} className="text-sm px-4 py-2 bg-[#112240] border border-[#1e345e] text-slate-300 rounded hover:text-white transition-colors">
                    Configure Branch
                  </button>
                )}`;
const branchHeaderAfter = `<div className="flex gap-2">
                  <button onClick={() => setShowBranchHistory(true)} className="text-sm px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded hover:bg-blue-500/20 transition-colors">
                    View Branch History
                  </button>
                  {currentUser?.role === 'ADMIN' && (
                    <button onClick={() => { setEditForm({...selectedBranch}); setIsAddingBranch(true); }} className="text-sm px-4 py-2 bg-[#112240] border border-[#1e345e] text-slate-300 rounded hover:text-white transition-colors">
                      Configure Branch
                    </button>
                  )}
                </div>`;
code = code.replace(branchHeaderBefore, branchHeaderAfter);

// Make operator row clickable to open CashierHistoryModal
code = code.replace(
`                        <div key={op.id} className="bg-[#0a192f] border border-[#1e345e] rounded-xl overflow-hidden shadow-sm">
                          <div className="p-4 border-b border-[#1e345e] flex items-center justify-between bg-[#112240]">`,
`                        <div key={op.id} className="bg-[#0a192f] border border-[#1e345e] rounded-xl overflow-hidden shadow-sm hover:border-blue-500/30 transition-colors cursor-pointer" onClick={() => setSelectedCashierForHistory({ id: op.id, name: op.name })}>
                          <div className="p-4 border-b border-[#1e345e] flex items-center justify-between bg-[#112240]">`
);

// Add modals at the bottom
code = code.replace(
`      {viewReconId && (`,
`      {showBranchHistory && selectedBranch && (
        <BranchHistoryModal
          branch={selectedBranch}
          reconciliations={reconciliations}
          onClose={() => setShowBranchHistory(false)}
        />
      )}
      {selectedCashierForHistory && selectedBranch && (
        <CashierHistoryModal
          cashierId={selectedCashierForHistory.id}
          cashierName={selectedCashierForHistory.name}
          reconciliations={reconciliations}
          branches={branches}
          onClose={() => setSelectedCashierForHistory(null)}
        />
      )}
      {viewReconId && (`
);

fs.writeFileSync('src/pages/SystemBranches.tsx', code);
