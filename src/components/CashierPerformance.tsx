import React, { useMemo } from 'react';
import { DailyReconciliation } from '../lib/types';
import { Users, Search } from 'lucide-react';
import { CashierHistoryModal } from './CashierHistoryModal';
import { Branch } from '../lib/types';
import { useState } from 'react';
import clsx from 'clsx';

export function CashierPerformance({ reconciliations, branches }: { reconciliations: DailyReconciliation[], branches: Branch[] }) {
  const [selectedCashier, setSelectedCashier] = useState<{id: string, name: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const cashierStats = useMemo(() => {
    const stats: Record<string, { id: string, name: string, sales: number, cash: number, variance: number, totalOvers: number, totalUnders: number, counts: number }> = {};
    
    reconciliations.forEach(r => {
      if (r.tillVariances && Array.isArray(r.tillVariances)) {
        r.tillVariances.forEach(tv => {
          if (!tv.cashierId) return;
          if (!stats[tv.cashierId]) {
            stats[tv.cashierId] = { id: tv.cashierId, name: tv.cashierName || 'Unknown', sales: 0, cash: 0, variance: 0, totalOvers: 0, totalUnders: 0, counts: 0 };
          }
          stats[tv.cashierId].sales += (tv.expected || 0);
          stats[tv.cashierId].cash += (tv.actual || 0);
          const v = tv.variance || 0;
          stats[tv.cashierId].variance += v;
          if (v > 0) stats[tv.cashierId].totalOvers += v;
          if (v < 0) stats[tv.cashierId].totalUnders += v;
          stats[tv.cashierId].counts += 1;
        });
      }
    });
    
    return Object.values(stats).sort((a, b) => a.totalUnders - b.totalUnders); // Sort by highest shortage first
  }, [reconciliations]);

  if (cashierStats.length === 0) return null;

  return (
    <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl shadow-xl overflow-hidden mt-6">
      <div className="p-4 sm:p-6 border-b border-[#1e345e] bg-[#061121] flex justify-between items-center">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-400" /> Cashier Performance (Shortages per Till Operator)
        </h2>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search operator..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-[#112240] border border-[#1e345e] rounded-lg py-1.5 pl-9 pr-4 text-white text-sm focus:outline-none focus:border-blue-500 w-48 sm:w-64"
          />
        </div>
      </div>
      <div className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#112240] text-slate-400 border-b border-[#1e345e]">
              <tr>
                <th className="px-6 py-4 font-medium">Cashier Name</th>
                <th className="px-6 py-4 font-medium text-right">Shifts/Tills Manned</th>
                <th className="px-6 py-4 font-medium text-right">Total Expected Sales (USD)</th>
                <th className="px-6 py-4 font-medium text-right">Total Actual Cash (USD)</th>
                <th className="px-6 py-4 font-medium text-right text-emerald-400">Total Overs (USD)</th>
                <th className="px-6 py-4 font-medium text-right text-rose-400">Total Unders (USD)</th>
                
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e345e]">
              {cashierStats.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map((c, idx) => (
                <tr key={idx} className="hover:bg-[#1e345e] transition-colors cursor-pointer" onClick={() => setSelectedCashier({ id: c.id, name: c.name })}>

                  <td className="px-6 py-4 font-bold text-white">{c.name}</td>
                  <td className="px-6 py-4 text-right text-slate-400">{c.counts}</td>
                  <td className="px-6 py-4 text-right font-mono text-slate-300">${c.sales.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-mono text-slate-300">${c.cash.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400">
                    {c.totalOvers > 0 ? "+" : ""}{c.totalOvers.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-rose-400">
                    {c.totalUnders < 0 ? c.totalUnders.toFixed(2) : "0.00"}
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
