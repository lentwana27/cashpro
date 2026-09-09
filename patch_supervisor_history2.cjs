const fs = require('fs');
let content = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');

const replacement = `                    </div>
                  </td>
                </tr>
                <AnimatePresence>
                    {expandedId === r.id && (
                      <motion.tr 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-[#061121]/50 shadow-inner"
                      >
                        <td colSpan={5} className="p-0 border-b border-[#1e345e]">
                                  {(() => {
                                  const getSum = (arr: any) => {
                                    if (!arr) return 0;
                                    if (Array.isArray(arr)) return arr.reduce((a,b)=>a+(b.usdEquivalent||0),0);
                                    return arr.usdEquivalent||0;
                                  };
                                  const tSales = getSum(r.totalSales);
                                  const tDeps = getSum(r.depositsReceived);
                                  const totalIncome = tSales + tDeps;
                                  
                                  const tDebtors = getSum(r.debtors);
                                  const tDepClaims = getSum(r.depositClaims);
                                  const tRet = getSum(r.returnsRefunds);
                                  const tExp = getSum(r.expenses);
                                  const tPur = getSum(r.purchases);
                                  const totalDeductions = tDebtors + tDepClaims + tRet + tExp + tPur;
                                  
                                  const expected = totalIncome - totalDeductions;
                                  const actualCash = getSum(r.tillCashBreakdown);
                                  const variance = actualCash - expected;
                                  
                                  return (
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
                                    </>
                                  );
                                })()}
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
              ))}
              {history.length === 0 && (`;

content = content.replace(/                    <\/div>\n                  <\/td>\n                <\/tr>\n              \)\)}\n              \{history\.length === 0 && \(/, replacement);

fs.writeFileSync('src/pages/SupervisorDashboard.tsx', content);
console.log("Patched SupervisorDashboard Part 2");
