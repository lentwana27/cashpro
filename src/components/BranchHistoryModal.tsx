import { safeFormat } from '../lib/formatDate';
import React, { useState, useMemo } from 'react';
import { DailyReconciliation, Branch, User } from '../lib/types';
import { X } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import { PaginationBar, paginate } from './PaginationBar';
import { Period, PERIOD_OPTIONS, getPeriodRange, inRange } from '../lib/period';

export function BranchHistoryModal({
  branch,
  reconciliations,
  users,
  onClose
}: {
  branch: Branch;
  reconciliations: DailyReconciliation[];
  users?: User[];
  onClose: () => void;
}) {
  const [period, setPeriod] = useState<Period>('ALL');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [supervisorFilter, setSupervisorFilter] = useState('ALL');
  const [resultFilter, setResultFilter] = useState<'ALL' | 'SHORT' | 'OVER' | 'BALANCED'>('ALL');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  React.useEffect(() => { setPage(1); }, [period, from, to, supervisorFilter, resultFilter, pageSize]);
  const pickDay = (d: string) => { setPeriod('CUSTOM'); setFrom(d); setTo(d); };
  const clearFilters = () => { setPeriod('ALL'); setFrom(''); setTo(''); setSupervisorFilter('ALL'); setResultFilter('ALL'); };
  const supervisorName = (id?: string) => (users || []).find(u => u.id === id)?.name || (id ? 'Unknown' : '—');

  const history = useMemo(() => {
    const branchRecons = reconciliations.filter(r => r.branchId === branch.id);
    return branchRecons.map(r => ({
      date: r.date,
      supervisorId: r.supervisorId as string | undefined,
      variance: r.varianceUsd || 0,
      over: (r.varianceUsd || 0) > 0 ? r.varianceUsd : 0,
      under: (r.varianceUsd || 0) < 0 ? r.varianceUsd : 0
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [reconciliations, branch]);

  const range = getPeriodRange(period, from, to);
  const supervisorIds = Array.from(new Set<string>(history.map(h => h.supervisorId).filter(Boolean) as string[]));
  const filtered = history
    .filter(h => inRange(h.date.substring(0, 10), range))
    .filter(h => supervisorFilter === 'ALL' || h.supervisorId === supervisorFilter)
    .filter(h => resultFilter === 'ALL' || (resultFilter === 'SHORT' ? h.variance < 0 : resultFilter === 'OVER' ? h.variance > 0 : h.variance === 0));
  const view = paginate<typeof history[number]>(filtered, page, pageSize);
  const totals = filtered.reduce((a, h) => ({ over: a.over + h.over, under: a.under + h.under, net: a.net + h.variance }), { over: 0, under: 0, net: 0 });
  const filtersActive = period !== 'ALL' || supervisorFilter !== 'ALL' || resultFilter !== 'ALL';


  const heatmapData = useMemo(() => {
    const days = 30;
    const end = new Date();
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(end.getDate() - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      
      const dayRecords = history.filter(h => h.date.startsWith(dateStr));
      const totalVar = dayRecords.reduce((acc, curr) => acc + curr.variance, 0);
      
      data.push({
        date: dateStr,
        variance: dayRecords.length > 0 ? totalVar : null
      });
    }
    return data;
  }, [history]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0a192f] border border-[#1e345e] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-[#1e345e] flex justify-between items-center bg-[#112240] rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">{branch.name}</h2>
            <p className="text-slate-400 text-sm mt-1">Past Performance History</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-400 mb-2">Last 30 Days Variance</h3>
            <div className="flex flex-wrap gap-1">
              {heatmapData.map(d => (
                <div 
                  key={d.date} 
                  title={`${safeFormat(d.date || new Date(), 'MMM dd')}: ${d.variance === null ? 'No Data' : (d.variance > 0 ? '+' : '') + d.variance.toFixed(2)}`}
                  className={clsx(
                    "w-6 h-6 rounded-sm cursor-pointer hover:ring-2 hover:ring-white transition-all",
                    d.variance === null ? "bg-[#1e345e]" : 
                    d.variance === 0 ? "bg-slate-500" :
                    d.variance > 0 ? "bg-emerald-500" : "bg-rose-500"
                  )}
                  onClick={() => pickDay(d.date)}
                />
              ))}
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Period</label>
              <select value={period} onChange={e => setPeriod(e.target.value as Period)} className="bg-[#061121] border border-[#1e345e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                {PERIOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            {period === 'CUSTOM' && (
              <>
                <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">From</label><input type="date" value={from} onChange={e => setFrom(e.target.value)} className="bg-[#061121] border border-[#1e345e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" style={{ colorScheme: 'dark' }} /></div>
                <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">To</label><input type="date" value={to} onChange={e => setTo(e.target.value)} className="bg-[#061121] border border-[#1e345e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" style={{ colorScheme: 'dark' }} /></div>
              </>
            )}
            {supervisorIds.length > 0 && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Supervisor</label>
                <select value={supervisorFilter} onChange={e => setSupervisorFilter(e.target.value)} className="bg-[#061121] border border-[#1e345e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                  <option value="ALL">All Supervisors</option>
                  {supervisorIds.map(id => <option key={id} value={id}>{supervisorName(id)}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Result</label>
              <select value={resultFilter} onChange={e => setResultFilter(e.target.value as any)} className="bg-[#061121] border border-[#1e345e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                <option value="ALL">All Results</option>
                <option value="SHORT">Shortages</option>
                <option value="OVER">Overs</option>
                <option value="BALANCED">Balanced</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Rows</label>
              <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="bg-[#061121] border border-[#1e345e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                {[5, 10, 25, 50].map(n => <option key={n} value={n}>{n} / page</option>)}
              </select>
            </div>
            {filtersActive && (
              <button onClick={clearFilters} className="text-xs text-slate-400 hover:text-white px-3 py-2.5 border border-[#1e345e] rounded-lg transition-colors">Clear filters</button>
            )}
          </div>

          <div className="overflow-x-auto border border-[#1e345e] rounded-xl">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#112240] text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Supervisor</th>
                  <th className="px-6 py-4 font-medium text-right text-emerald-400">Total Overs (USD)</th>
                  <th className="px-6 py-4 font-medium text-right text-rose-400">Total Unders (USD)</th>
                  <th className="px-6 py-4 font-medium text-right">Net Variance (USD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e345e] bg-[#061121]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  view.pageItems.map((r, i) => (
                    <tr key={i} className="hover:bg-[#112240]/50 transition-colors">
                      <td className="px-6 py-4 text-slate-300">
                        {safeFormat(r.date || new Date(), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 text-white">{supervisorName(r.supervisorId)}</td>
                      <td className="px-6 py-4 text-right font-mono text-emerald-400">
                        {r.over > 0 ? '+' : ''}{r.over.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-rose-400">
                        {r.under < 0 ? r.under.toFixed(2) : '0.00'}
                      </td>
                      <td className={clsx(
                        "px-6 py-4 text-right font-mono font-bold",
                        r.variance > 0 ? "text-emerald-400" : r.variance < 0 ? "text-rose-400" : "text-slate-500"
                      )}>
                        {r.variance > 0 ? '+' : ''}{r.variance.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot className="bg-[#112240] text-sm font-bold">
                  <tr>
                    <td className="px-6 py-3 text-slate-300" colSpan={2}>Total ({filtered.length} record{filtered.length === 1 ? '' : 's'})</td>
                    <td className="px-6 py-3 text-right font-mono text-emerald-400">{totals.over > 0 ? '+' : ''}{totals.over.toFixed(2)}</td>
                    <td className="px-6 py-3 text-right font-mono text-rose-400">{totals.under < 0 ? totals.under.toFixed(2) : '0.00'}</td>
                    <td className={clsx('px-6 py-3 text-right font-mono', totals.net > 0 ? 'text-emerald-400' : totals.net < 0 ? 'text-rose-400' : 'text-slate-400')}>{totals.net > 0 ? '+' : ''}{totals.net.toFixed(2)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <PaginationBar page={view.currentPage} totalPages={view.totalPages} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
