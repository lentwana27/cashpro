import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { DailyReconciliation, Branch } from '../lib/types';
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
                    <tr>
                      <td colSpan={8} className="p-0 border-b border-[#1e345e]">
                        <div className="bg-[#061121] p-4 sm:p-6 shadow-inner border-y border-[#0a192f]">
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            <PreviewSection title="Income" items={[
                              { label: 'Total Sales', value: getSum(r.totalSales) },
                              { label: 'Deposits Received', value: getSum(r.depositsReceived) }
                            ]} />
                            <PreviewSection title="Deductions" items={[
                              { label: 'Debtors', value: getSum(r.debtors) },
                              { label: 'Returns', value: getSum(r.returnsRefunds) },
                              { label: 'Purchases', value: getSum(r.purchases) },
                              { label: 'Expenses', value: getSum(r.expenses) }
                            ]} />
                            <div className="col-span-2 lg:col-span-4 mt-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Line Item Notes</h4>
                                  <div className="space-y-4">
                                    {['expenses', 'purchases', 'totalSales'].map(category => {
                                      // @ts-ignore
                                      const items = Array.isArray(r[category]) ? r[category] : [r[category]].filter(Boolean);
                                      const describedItems = items.filter((i: any) => i && i.description);
                                      if (describedItems.length === 0) return null;
                                      return (
                                        <div key={category} className="bg-[#112240] p-3 rounded-lg border border-[#1e345e]">
                                          <div className="text-xs font-bold text-white capitalize mb-2">{category.replace(/([A-Z])/g, ' $1').trim()}</div>
                                          <ul className="space-y-1">
                                            {describedItems.map((i: any, idx: number) => (
                                              <li key={idx} className="flex justify-between text-xs">
                                                <span className="text-slate-400">{i.description} {i.invoiceNumber && `(Inv: ${i.invoiceNumber})`}</span>
                                                <span className="text-white">${(i.usdEquivalent || 0).toFixed(2)}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                                <div>
                                  {(r.notes || r.amendmentNotes) && (
                                    <>
                                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Logs & Verification</h4>
                                      {r.amendmentNotes && r.amendmentNotes.length > 0 && (
                                        <div className="mb-4 space-y-2">
                                          <div className="text-xs text-slate-500 mb-1">Amendment History</div>
                                          {r.amendmentNotes.map((note: string, idx: number) => (
                                            <div key={idx} className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500/90 p-3 rounded-lg text-sm leading-relaxed font-medium">
                                              {note}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      {r.notes && (
                                        <div className="mb-4">
                                          <div className="text-xs text-slate-500 mb-1">Supervisor Notes</div>
                                          <div className="bg-[#112240] p-3 rounded-lg border border-[#1e345e] text-sm text-slate-300">
                                            {r.notes}
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
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
