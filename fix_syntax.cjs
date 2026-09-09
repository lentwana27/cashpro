const fs = require('fs');
['src/pages/SupervisorDashboard.tsx', 'src/pages/AuditorDashboard.tsx'].forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // find the start of the return (
    const startRegex = /return \(\s*<>\s*<div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-8">/;
    const startIndex = content.search(startRegex);
    
    // find the end of the IIFE
    const endRegex = / \)\(\)\}\s*<\/td>/;
    const endIndex = content.search(endRegex);
    
    if (startIndex !== -1 && endIndex !== -1) {
        const replacement = `return (
                                    <>
                                      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-4 border-b-2 border-double border-[#1e345e] pb-2">Income breakdown</h4>
                                          <div className="space-y-4">
                                            <BreakdownSection title="Total Sales" items={r.totalSales} />
                                            <BreakdownSection title="Deposits Received" items={r.depositsReceived} />
                                          </div>
                                          <div className="mt-4 pt-3 border-t-2 border-double border-emerald-500/30 flex justify-between font-bold text-sm text-emerald-400">
                                            <span>Total Income</span>
                                            <span className="font-mono">\${totalIncome.toFixed(2)}</span>
                                          </div>
                                        </div>
                                        
                                        <div>
                                          <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-4 border-b-2 border-double border-[#1e345e] pb-2">Deductions breakdown</h4>
                                          <div className="space-y-4">
                                            <BreakdownSection title="Debtors (Credit Sales)" items={r.debtors} />
                                            <BreakdownSection title="Deposit Claims" items={r.depositClaims} />
                                            <BreakdownSection title="Returns / Refunds" items={r.returnsRefunds} />
                                            <BreakdownSection title="Operational Expenses" items={r.expenses} />
                                            <BreakdownSection title="Purchases" items={r.purchases} />
                                          </div>
                                          <div className="mt-4 pt-3 border-t-2 border-double border-rose-500/30 flex justify-between font-bold text-sm text-rose-400">
                                            <span>Total Deductions</span>
                                            <span className="font-mono">\${totalDeductions.toFixed(2)}</span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="bg-[#0a192f] p-4 sm:p-6 border-t border-[#1e345e] grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                                        <div>
                                          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Expected Cash</div>
                                          <div className="text-2xl font-mono text-white">\${expected.toFixed(2)}</div>
                                        </div>
                                        <div>
                                          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Physical Cash Counted</div>
                                          <div className="text-2xl font-mono text-white">\${actualCash.toFixed(2)}</div>
                                        </div>
                                        <div>
                                          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Variance</div>
                                          <div className={clsx("text-2xl font-mono font-bold", variance > 0 ? "text-emerald-400" : variance < 0 ? "text-rose-400" : "text-slate-300")}>
                                            {variance > 0 ? '+' : ''}{variance.toFixed(2)}
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {(r.notes || r.signature || (r.amendmentNotes && r.amendmentNotes.length > 0)) && (
                                        <div className="px-6 pb-6 mt-2 border-t border-[#1e345e] pt-6">
                                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-[#1e345e] pb-2">Notes & Verification</h4>
                                          {r.amendmentNotes && r.amendmentNotes.length > 0 && (
                                            <div className="mb-4 space-y-2">
                                              <p className="text-xs text-slate-500 mb-1">Amendment History</p>
                                              {r.amendmentNotes.map((note: string, i: number) => (
                                                <div key={i} className="text-sm text-yellow-500/90 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20 leading-relaxed font-medium">
                                                  {note}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          {r.notes && (
                                            <div className="mb-4">
                                              <p className="text-xs text-slate-500 mb-1">Additional Notes</p>
                                              <p className="text-sm text-slate-300 bg-[#061121] p-3 rounded-lg border border-[#1e345e]">{r.notes}</p>
                                            </div>
                                          )}
                                          {r.signature && (
                                            <div>
                                              <p className="text-xs text-slate-500 mb-1">Digitally Signed By</p>
                                              <p className="text-lg text-emerald-400 font-serif italic">{r.signature}</p>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                        </td>`;
        
        content = content.substring(0, startIndex) + replacement + content.substring(endIndex + 14);
        fs.writeFileSync(file, content);
        console.log("Fixed " + file);
    } else {
        console.log("Could not find bounds in " + file);
    }
});
