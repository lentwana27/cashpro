import { safeFormat } from '../lib/formatDate';
import React, { useMemo, useState } from 'react';
import { DailyReconciliation } from '../lib/types';
import { CalendarRange, Search } from 'lucide-react';
import { CashierHistoryModal } from './CashierHistoryModal';
import { Branch } from '../lib/types';
import clsx from 'clsx';
import { format, parseISO } from 'date-fns';

export function CashierMonthlyPerformance({ reconciliations, branches }: { reconciliations: DailyReconciliation[], branches: Branch[] }) {
  const [selectedCashier, setSelectedCashier] = useState<{id: string, name: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>(safeFormat(new Date(), 'yyyy-MM'));

  const monthlyStats = useMemo(() => {
    const stats: Record<string, { id: string, name: string, branchName: string, overUSD: number, underUSD: number, overZAR: number, underZAR: number }> = {};
    
    reconciliations.forEach(r => {
      const rMonth = r.date.substring(0, 7); // yyyy-MM
      if (rMonth !== selectedMonth) return;

      if (r.tillVariances && Array.isArray(r.tillVariances)) {
        r.tillVariances.forEach(tv => {
          if (!tv.cashierId) return;
          const b = (branches || []).find(b => b.id === r.branchId);
          const bName = b ? b.name : 'Unknown';
          if (!stats[tv.cashierId]) {
            stats[tv.cashierId] = { id: tv.cashierId, name: tv.cashierName || 'Unknown', branchName: bName, overUSD: 0, underUSD: 0, overZAR: 0, underZAR: 0 };
          }
          
          const v = tv.variance || 0;
          if (v > 0) stats[tv.cashierId].overUSD += v;
          if (v < 0) stats[tv.cashierId].underUSD += v;

          // If we had ZAR variance separately, we could compute it here. For now, estimate or zero it.
          // Since it wasn't captured independently per till in earlier steps, we just set ZAR to 0 or derive from exchange rate.
          // Let's assume ZAR is 0 for now as it's not present in tillVariances.
        });
      }
    });
    
    return Object.values(stats).sort((a, b) => a.underUSD - b.underUSD);
  }, [reconciliations, selectedMonth]);

  const availableMonths = useMemo(() => {
    const m = new Set<string>();
    reconciliations.forEach(r => m.add(r.date.substring(0, 7)));
    return Array.from(m).sort((a, b) => b.localeCompare(a));
  }, [reconciliations]);

  return (
    <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl shadow-xl overflow-hidden mt-6">
      <div className="p-4 sm:p-6 border-b border-[#1e345e] bg-[#061121] flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <CalendarRange className="w-5 h-5 text-indigo-400" /> Monthly Variance Aggregation
        </h2>
        <div className="flex items-center gap-3 w-full sm:w-auto mt-3 sm:mt-0">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search operator..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#112240] border border-[#1e345e] rounded-lg py-1.5 pl-9 pr-4 text-white text-sm focus:outline-none focus:border-blue-500 sm:w-64"
            />
          </div>
          <select 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-[#112240] border border-[#1e345e] text-white rounded py-1.5 px-3 text-sm focus:outline-none flex-1 sm:flex-none"
          >
            {availableMonths.map(m => (
              <option key={m} value={m}>{safeFormat(parseISO(m + "-01"), "MMMM yyyy")}</option>
            ))}
            {availableMonths.length === 0 && <option value={selectedMonth}>{safeFormat(parseISO(selectedMonth + "-01"), "MMMM yyyy")}</option>}
          </select>
        </div>
      </div>
      <div className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#112240] text-slate-400 border-b border-[#1e345e]">
              <tr>
                <th className="px-6 py-4 font-medium" rowSpan={2}>Cashier Name</th>
                <th className="px-6 py-4 font-medium" rowSpan={2}>Branch</th>
                <th className="px-6 py-2 font-medium text-center border-b border-[#1e345e]" colSpan={2}>USD Variances</th>
                <th className="px-6 py-2 font-medium text-center border-b border-[#1e345e] border-l" colSpan={2}>ZAR Variances</th>
              </tr>
              <tr>
                <th className="px-6 py-2 font-medium text-right text-emerald-400">Total Overs</th>
                <th className="px-6 py-2 font-medium text-right text-rose-400">Total Unders</th>
                <th className="px-6 py-2 font-medium text-right text-emerald-400 border-l border-[#1e345e]">Total Overs</th>
                <th className="px-6 py-2 font-medium text-right text-rose-400">Total Unders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e345e]">
              {monthlyStats.length === 0 ? (
                 <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      No records for this month.
                    </td>
                  </tr>
              ) : monthlyStats.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map((c, idx) => (
                <tr key={idx} className="hover:bg-[#1e345e] transition-colors cursor-pointer" onClick={() => setSelectedCashier({ id: c.id, name: c.name })}>

                  <td className="px-6 py-4 font-bold text-white">{c.name}</td>
                  <td className="px-6 py-4 text-slate-300">{c.branchName}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400">
                    {c.overUSD > 0 ? "+" : ""}{c.overUSD.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-rose-400">
                    {c.underUSD < 0 ? c.underUSD.toFixed(2) : "0.00"}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400 border-l border-[#1e345e]">
                    {c.overZAR > 0 ? "+" : ""}{c.overZAR.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-rose-400">
                    {c.underZAR < 0 ? c.underZAR.toFixed(2) : "0.00"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {selectedCashier && (
        <CashierHistoryModal
          cashierId={selectedCashier.id}
          cashierName={selectedCashier.name}
          reconciliations={reconciliations}
          branches={branches}
          onClose={() => setSelectedCashier(null)}
        />
      )}
    </div>
  );
}
