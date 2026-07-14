const fs = require('fs');
let code = fs.readFileSync('src/pages/SystemBranches.tsx', 'utf8');

// Insert the state for Operator Assignment
if (!code.includes('isAssigningOperator')) {
  code = code.replace(/const \[viewReconId, setViewReconId\] = useState<string \| null>\(null\);/, 
  `const [viewReconId, setViewReconId] = useState<string | null>(null);
  const [isAssigningOperator, setIsAssigningOperator] = useState(false);
  const [selectedOperatorId, setSelectedOperatorId] = useState('');`);
}

// Ensure icons are imported
if (!code.includes('UserSquare')) {
  code = code.replace(/import \{ Users, Building2, CheckCircle, ShieldCheck, MapPin, Edit3, X, Download, Database, Activity, Plus, Send, MessageCircle \} from 'lucide-react';/,
  "import { Users, Building2, CheckCircle, ShieldCheck, MapPin, Edit3, X, Download, Database, Activity, Plus, Send, MessageCircle, UserSquare, UserPlus, ArrowRightLeft } from 'lucide-react';");
}

// Add handleAssignOperator
if (!code.includes('handleAssignOperator')) {
  code = code.replace(/const handleSendAlert = async \(\) => \{/g, 
  `const handleAssignOperator = async () => {
    if (!selectedOperatorId || !selectedBranch) return;
    try {
      await api.put(\`/users/\${selectedOperatorId}\`, { branchId: selectedBranch.id });
      setIsAssigningOperator(false);
      setSelectedOperatorId('');
      loadData();
    } catch (e) {
      alert("Failed to assign operator.");
    }
  };

  const handleSendAlert = async () => {`);
}

// Insert UI into selectedBranch view
// Find: <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8">
let split = code.split('<div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8">');
if (split.length === 2) {
  let rest = split[1];
  
  // Find where supervisors section starts
  rest = `
                <div className="flex items-center justify-between mb-4 mt-2">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" /> Supervisors
                  </h3>
                </div>
` + rest;

  // Find where it ends (right before closing div of flex-1)
  let supervisorsEndIdx = rest.lastIndexOf('              </div>\n            </>');
  let part1 = rest.substring(0, supervisorsEndIdx);
  let part2 = rest.substring(supervisorsEndIdx);

  let newUI = `
                <div className="mt-12 mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <UserSquare className="w-5 h-5 text-indigo-400" /> Till Operators (Cashiers)
                  </h3>
                  {currentUser?.role === 'ADMIN' && (
                    <button 
                      onClick={() => setIsAssigningOperator(true)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded font-medium text-xs transition-colors"
                    >
                      <UserPlus className="w-4 h-4" /> Add / Transfer Operator
                    </button>
                  )}
                </div>
                
                {getTillOperatorsForBranch(selectedBranch.id).length === 0 ? (
                  <div className="text-center py-8 text-slate-500 bg-[#0a192f] rounded-xl border border-[#1e345e]">
                    No till operators assigned to this branch.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {getTillOperatorsForBranch(selectedBranch.id).map(op => {
                      const opVars = getTillVariancesForOperatorAndBranch(op.id, selectedBranch.id);
                      const totalOpVariance = opVars.reduce((acc, v) => acc + (v.varianceUsd || 0), 0);
                      const isCurrent = op.branchId === selectedBranch.id;
                      
                      return (
                        <div key={op.id} className="bg-[#0a192f] border border-[#1e345e] rounded-xl overflow-hidden shadow-sm">
                          <div className="p-4 border-b border-[#1e345e] flex items-center justify-between bg-[#112240]">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#1e345e] text-slate-300 flex items-center justify-center font-bold text-sm">
                                {op.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-white flex items-center gap-2">
                                  {op.name}
                                  {!isCurrent && <span className="text-[10px] uppercase bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">Transferred</span>}
                                </div>
                                <div className="text-xs text-slate-400">{op.email}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-slate-400 mb-0.5">Net Variance</div>
                              <div className={clsx("font-bold text-sm", totalOpVariance > 0 ? "text-emerald-400" : totalOpVariance < 0 ? "text-rose-400" : "text-white")}>
                                {totalOpVariance > 0 ? '+' : ''}{totalOpVariance.toFixed(2)} USD
                              </div>
                            </div>
                          </div>
                          
                          {opVars.length > 0 ? (
                            <div className="overflow-x-auto p-0">
                              <table className="w-full text-left text-xs whitespace-nowrap">
                                <thead className="bg-[#061121] text-slate-400 border-b border-[#1e345e]">
                                  <tr>
                                    <th className="px-4 py-2 font-medium">Date</th>
                                    <th className="px-4 py-2 font-medium">Till Name</th>
                                    <th className="px-4 py-2 font-medium">Expected</th>
                                    <th className="px-4 py-2 font-medium">Actual</th>
                                    <th className="px-4 py-2 font-medium">Variance</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1e345e]">
                                  {opVars.map((v, idx) => (
                                    <tr key={idx} className="hover:bg-[#112240]/50">
                                      <td className="px-4 py-2 text-slate-300 font-mono">{format(new Date(v.date), 'MMM dd, yyyy')}</td>
                                      <td className="px-4 py-2 text-slate-300">{v.tillName}</td>
                                      <td className="px-4 py-2 text-slate-400 font-mono">\${v.expected.toFixed(2)}</td>
                                      <td className="px-4 py-2 text-slate-400 font-mono">\${v.actual.toFixed(2)}</td>
                                      <td className={clsx("px-4 py-2 font-bold font-mono", v.varianceUsd > 0 ? "text-emerald-400" : v.varianceUsd < 0 ? "text-rose-400" : "text-slate-300")}>
                                        {v.varianceUsd > 0 ? '+' : ''}{v.varianceUsd.toFixed(2)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="p-3 text-center text-xs text-slate-500">
                              No till variances recorded.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
`;

  code = split[0] + '<div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8">' + part1 + newUI + part2;
}

// Inject Assignment Modal at the end
let modalUI = `
      {isAssigningOperator && selectedBranch && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl shadow-2xl p-6 w-full max-w-md relative">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-indigo-400" /> Assign Operator to Branch
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              Select an existing Cashier / Till Operator to transfer them to <strong>{selectedBranch.name}</strong>. Their past history remains intact.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Select Till Operator</label>
                <select 
                  value={selectedOperatorId}
                  onChange={e => setSelectedOperatorId(e.target.value)}
                  className="w-full bg-[#061121] border border-[#1e345e] text-white p-3 rounded-lg focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Choose an operator --</option>
                  {users.filter(u => u.role === 'CASHIER' && u.branchId !== selectedBranch.id).map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-[#1e345e]">
                <button 
                  onClick={() => setIsAssigningOperator(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAssignOperator}
                  disabled={!selectedOperatorId}
                  className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold rounded-lg text-sm transition-colors"
                >
                  Assign Operator
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(/\{viewReconId && \(/, modalUI + "\n      {viewReconId && (");

fs.writeFileSync('src/pages/SystemBranches.tsx', code);
