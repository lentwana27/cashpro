import React, { useState, useMemo } from 'react';
import { DailyReconciliation, Branch } from '../lib/types';
import { X, Search } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

export function CashierHistoryModal({
  cashierId,
  cashierName,
  reconciliations,
  branches,
  onClose
}: {
  cashierId: string;
  cashierName: string;
  reconciliations: DailyReconciliation[];
  branches: Branch[];
  onClose: () => void;
}) {
  const [searchDate, setSearchDate] = useState('');

  const history = useMemo(() => {
    const records: Array<{ date: string, branchName: string, variance: number, over: number, under: number, zarVariance: number }> = [];

    reconciliations.forEach(r => {
      if (r.tillVariances && Array.isArray(r.tillVariances)) {
        r.tillVariances.forEach(tv => {
          if (tv.cashierId === cashierId) {
            const b = (branches || []).find(b => b.id === r.branchId);
            records.push({
              date: r.date,
              branchName: b ? b.name : 'Unknown',
              variance: tv.variance || 0,
              over: (tv.variance || 0) > 0 ? tv.variance : 0,
              under: (tv.variance || 0) < 0 ? tv.variance : 0,
              zarVariance: 0 // ZAR logic can be added here if needed
            });
          }
        });
      }
    });

    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [reconciliations, cashierId, branches]);

  
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

  const filtered = searchDate ? history.filter(h => h.date.includes(searchDate)) : history;


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0a192f] border border-[#1e345e] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-[#1e345e] flex justify-between items-center bg-[#112240] rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">{cashierName}</h2>
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
                  title={`${format(new Date(d.date), 'MMM dd')}: ${d.variance === null ? 'No Data' : (d.variance > 0 ? '+' : '') + (d.variance !== null ? d.variance.toFixed(2) : '')}`}
                  className={clsx(
                    "w-6 h-6 rounded-sm cursor-pointer hover:ring-2 hover:ring-white transition-all",
                    d.variance === null ? "bg-[#1e345e]" : 
                    d.variance === 0 ? "bg-slate-500" :
                    d.variance > 0 ? "bg-emerald-500" : "bg-rose-500"
                  )}
                  onClick={() => setSearchDate(d.date)}
                />
              ))}
            </div>
          </div>

          <div className="mb-6 relative">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="date"
              value={searchDate}
              onChange={e => setSearchDate(e.target.value)}
              className="w-full bg-[#061121] border border-[#1e345e] rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          <div className="overflow-x-auto border border-[#1e345e] rounded-xl">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#112240] text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Branch</th>
                  <th className="px-6 py-4 font-medium text-right text-emerald-400">Over (USD)</th>
                  <th className="px-6 py-4 font-medium text-right text-rose-400">Under (USD)</th>
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
                  filtered.map((r, i) => (
                    <tr key={i} className="hover:bg-[#112240]/50 transition-colors">
                      <td className="px-6 py-4 text-slate-300">
                        {format(new Date(r.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 text-white font-medium">{r.branchName}</td>
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
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
