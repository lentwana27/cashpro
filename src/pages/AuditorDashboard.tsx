import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { DailyReconciliation, Branch } from '../lib/types';
import { CashierShortageChart } from '../components/CashierShortageChart';
import { Search, ShieldAlert, Download, Building2, Calendar, FileText, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

export function AuditorDashboard() {
  const [reconciliations, setReconciliations] = useState<DailyReconciliation[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [recons, brs] = await Promise.all([
        api.get('/reconciliations'),
        api.get('/branches')
      ]);
      setReconciliations(recons);
      setBranches(brs);
    } catch (e) {
      // Ignore network errors during polling
    }
  };

  const getSum = (val: any) => {
    if (!val) return 0;
    if (Array.isArray(val)) return val.reduce((a, b) => a + (b.usdEquivalent || 0), 0);
    return val.usdEquivalent || 0;
  };

  const flaggedCashUps = reconciliations.filter(r => r.status === 'FLAGGED' || Math.abs(r.varianceUsd) > 50);

  const filteredRecon = reconciliations
    .filter(r => filterStatus === 'ALL' ? true : r.status === filterStatus)
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const exportToExcel = () => {
    const headers = [
      'Branch', 'Date', 'Total Sales (USD)', 'Deposits Received (USD)', 
      'Debtors (USD)', 'Returns (USD)', 'Expenses (USD)', 'Purchases (USD)', 
      'Expected Cash (USD)', 'End Cash (USD)', 'Variance (USD)', 'Status', 'Notes', 'Amendment History'
    ];
    
    const rows = filteredRecon.map(r => [
      branches.find(b => b.id === r.branchId)?.name || r.branchId,
      r.date,
      parseFloat(getSum(r.totalSales).toFixed(2)),
      parseFloat(getSum(r.depositsReceived).toFixed(2)),
      parseFloat(getSum(r.debtors).toFixed(2)),
      parseFloat(getSum(r.returnsRefunds).toFixed(2)),
      parseFloat(getSum(r.expenses).toFixed(2)),
      parseFloat(getSum(r.purchases).toFixed(2)),
      parseFloat((r.expectedCashUsd || 0).toFixed(2)),
      parseFloat((r.endOfDayCash?.usdEquivalent || 0).toFixed(2)),
      parseFloat((r.varianceUsd || 0).toFixed(2)),
      r.status,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
      `"${(r.amendmentNotes?.join(' | ') || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `audit_report_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const markAsFlagged = async (id: string) => {
    try {
      await api.put(`/reconciliations/${id}`, { status: 'FLAGGED' });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-emerald-400" /> Audit Center
          </h1>
          <p className="text-slate-400 mt-1">Review operations, detect anomalies, and export compliance reports.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-[#112240] hover:bg-[#1a2d53] border border-[#1e345e] rounded-lg text-sm font-medium transition-colors text-white"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Export Full Log
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 sm:p-6 opacity-10"><ShieldAlert className="w-16 h-16" /></div>
          <div className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Total Reconciliations</div>
          <div className="text-4xl font-black text-white">{reconciliations.length}</div>
        </div>
        <div className="bg-[#0a192f] border border-rose-500/20 rounded-xl p-4 sm:p-6 shadow-[0_0_15px_rgba(244,63,94,0.05)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 sm:p-6 opacity-10 text-rose-500"><AlertTriangle className="w-16 h-16" /></div>
          <div className="text-sm font-bold text-rose-400 mb-2 uppercase tracking-wider">Flagged & High Risk</div>
          <div className="text-4xl font-black text-white">{flaggedCashUps.length}</div>
        </div>
      </div>

      <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-[#1e345e] bg-[#061121] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Reconciliation Audit Log</h2>
          </div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#112240] border border-[#1e345e] text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500 text-sm"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Approval</option>
            <option value="AMENDMENT_REQUESTED">Amendment Requested</option>
            <option value="AMENDMENT_APPROVED">Amendment Approved</option>
            <option value="APPROVED">Approved</option>
            <option value="FLAGGED">Flagged for Audit</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#112240] text-slate-400 border-b border-[#1e345e]">
              <tr>
                <th className="px-6 py-4 w-10"></th>
                <th className="px-6 py-4 font-medium">Branch</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 text-right font-medium">Actual Cash</th>
                <th className="px-6 py-4 text-right font-medium">Expected Cash</th>
                <th className="px-6 py-4 text-right font-medium">Variance</th>
                <th className="px-6 py-4 text-center font-medium">Review Status</th>
                <th className="px-6 py-4 text-right font-medium">Audit Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e345e]">
              {filteredRecon.map(r => (
                <React.Fragment key={r.id}>
                  <tr className={clsx("hover:bg-[#112240]/50 transition-colors", expandedId === r.id && "bg-[#112240]/30")}>
                    <td className="px-6 py-4">
                      <button onClick={() => setExpandedId(expandedId === r.id ? null : r.id)} className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#1e345e]">
                        {expandedId === r.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-6 py-4 font-medium text-white">{branches.find(b => b.id === r.branchId)?.name || r.branchId}</td>
                    <td className="px-6 py-4 text-slate-300">{format(new Date(r.date), 'MMM d, yyyy')}</td>
                    <td className="px-6 py-4 text-right font-mono">${(r.endOfDayCash?.usdEquivalent || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-mono">${(r.expectedCashUsd || 0).toFixed(2)}</td>
                    <td className={clsx("px-6 py-4 text-right font-mono font-bold", 
                      (r.varianceUsd || 0) < 0 ? "text-rose-400" : (r.varianceUsd || 0) > 0 ? "text-emerald-400" : "text-slate-400"
                    )}>
                      {(r.varianceUsd || 0) > 0 ? '+' : ''}{(r.varianceUsd || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={clsx(
                        "px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border",
                        r.status === 'APPROVED' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        r.status === 'FLAGGED' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                        "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      )}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {r.status !== 'FLAGGED' && (
                        <button 
                          onClick={() => markAsFlagged(r.id)}
                          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded transition-colors text-xs font-bold"
                        >
                          Flag Issue
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandedId === r.id && (
                    <tr className="bg-[#061121]/50 shadow-inner">
                      <td colSpan={8} className="p-0 border-b border-[#1e345e]">
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
                                            <span className="font-mono">${totalIncome.toFixed(2)}</span>
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
                                            <span className="font-mono">${totalDeductions.toFixed(2)}</span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="bg-[#0a192f] p-4 sm:p-6 border-t border-[#1e345e] grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                                        <div>
                                          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Expected Cash</div>
                                          <div className="text-2xl font-mono text-white">${expected.toFixed(2)}</div>
                                        </div>
                                        <div>
                                          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Physical Cash Counted</div>
                                          <div className="text-2xl font-mono text-white">${actualCash.toFixed(2)}</div>
                                        </div>
                                        <div>
                                          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Variance</div>
                                          <div className={"text-2xl font-mono font-bold " + (variance > 0 ? "text-emerald-400" : variance < 0 ? "text-rose-400" : "text-slate-300")}>
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
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filteredRecon.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                    No records found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      
        
      </div>
      <CashierShortageChart reconciliations={filteredRecon} branches={branches} />
    </div>
  );
}

function PreviewSection({ title, items }: { title: string, items: {label: string, value: number}[] }) {
  return (
    <div>
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{title}</h4>
      <div className="space-y-2">
        {items.map((i, idx) => (
          <div key={idx} className="flex justify-between items-center text-sm">
            <span className="text-slate-300">{i.label}</span>
            <span className="font-mono text-white">${i.value.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const BreakdownSection = ({ title, items }: { title: string, items: any }) => {
  const arr = Array.isArray(items) ? items : items ? [items] : [];
  if (arr.length === 0) return null;
  const total = arr.reduce((a:number,b:any)=>a+(b.usdEquivalent||0), 0);
  
  return (
    <div className="mb-4">
      <div className="flex justify-between font-medium text-slate-300 text-sm mb-2">
        <span>{title}</span>
        <span className="font-mono text-white">$${total.toFixed(2)}</span>
      </div>
      <div className="space-y-1.5 border-l-2 border-[#1e345e] ml-1 pl-3">
        {arr.map((item: any, idx: number) => (
          <div key={idx} className="flex justify-between text-xs">
            <span className="text-slate-400">
              {item.description || 'Unnamed'} 
              {(item.amount || item.amount === 0) && <span className="text-slate-500 ml-1">({item.amount} {item.currencyCode})</span>}
            </span>
            <span className="text-slate-300 font-mono">$${(item.usdEquivalent||0).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
