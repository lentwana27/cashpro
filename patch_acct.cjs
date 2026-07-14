const fs = require('fs');
let code = fs.readFileSync('src/pages/AccountantDashboard.tsx', 'utf8');

// Find where income and deductions are rendered
let incomeSearch = `<h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-[#1e345e] pb-2">Income breakdown</h4>`;
let deductionsSearch = `<h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-[#1e345e] pb-2">Deductions breakdown</h4>`;

let getSumFn = `
                                {(() => {
                                  const getSum = (arr) => {
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
                                            <BreakdownSection title="Debtors" items={r.debtors} />
                                            <BreakdownSection title="Deposit Claims" items={r.depositClaims} />
                                            <BreakdownSection title="Returns / Refunds" items={r.returnsRefunds} />
                                            <BreakdownSection title="Expenses" items={r.expenses} />
                                            <BreakdownSection title="Purchases" items={r.purchases} />
                                          </div>
                                          <div className="mt-4 pt-3 border-t-2 border-double border-rose-500/30 flex justify-between font-bold text-sm text-rose-400">
                                            <span>Total Deductions</span>
                                            <span className="font-mono">\${totalDeductions.toFixed(2)}</span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="px-6 pb-6">
                                        <div className="bg-[#112240] border border-[#1e345e] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center divide-y sm:divide-y-0 sm:divide-x divide-[#1e345e]">
                                          <div className="p-2">
                                            <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Expected Cash</div>
                                            <div className="text-xl font-mono font-bold text-white">\${expected.toFixed(2)}</div>
                                            <div className="text-[10px] text-slate-500 mt-1">(Income - Deductions)</div>
                                          </div>
                                          <div className="p-2">
                                            <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Actual Cash</div>
                                            <div className="text-xl font-mono font-bold text-white">\${actualCash.toFixed(2)}</div>
                                          </div>
                                          <div className="p-2">
                                            <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Variance</div>
                                            <div className={\`text-2xl font-mono font-bold \${variance > 0 ? 'text-emerald-400' : variance < 0 ? 'text-rose-400' : 'text-blue-400'}\`}>
                                              {variance > 0 ? '+' : ''}{variance.toFixed(2)}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </>
                                  );
                                })()}
`;

let targetBlock = `<div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-[#1e345e] pb-2">Income breakdown</h4>
                              <div className="space-y-4">
                                <BreakdownSection title="Total Sales" items={r.totalSales} />
                                <BreakdownSection title="Deposits Received" items={r.depositsReceived} />
                              </div>
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-[#1e345e] pb-2">Deductions breakdown</h4>
                              <div className="space-y-4">
                                <BreakdownSection title="Debtors" items={r.debtors} />
                                <BreakdownSection title="Deposit Claims" items={r.depositClaims} />
                                <BreakdownSection title="Returns / Refunds" items={r.returnsRefunds} />
                                <BreakdownSection title="Expenses" items={r.expenses} />
                                <BreakdownSection title="Purchases" items={r.purchases} />
                              </div>
                            </div>
                          </div>`;

if (code.includes('Income breakdown')) {
  let startIndex = code.indexOf('<div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-8">');
  let endIndex = code.indexOf('{r.tillCashBreakdown && r.tillCashBreakdown.length > 0 && (');
  
  if (startIndex !== -1 && endIndex !== -1) {
    code = code.substring(0, startIndex) + getSumFn + code.substring(endIndex);
    fs.writeFileSync('src/pages/AccountantDashboard.tsx', code);
  }
}
