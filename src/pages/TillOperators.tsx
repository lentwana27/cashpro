import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { api } from '../lib/api';
import { DailyReconciliation, Branch } from '../lib/types';
import { CashierPerformance } from '../components/CashierPerformance';
import { CashierShortageChart } from '../components/CashierShortageChart';
import { CashierMonthlyPerformance } from '../components/CashierMonthlyPerformance';
import { Users, AlertTriangle } from 'lucide-react';
import { Period, PERIOD_OPTIONS, getPeriodRange, inRange } from '../lib/period';

const selectCls = 'bg-[#112240] border border-[#1e345e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500';
const labelCls = 'block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1';

export function TillOperators() {
  const { user } = useAuth();
  const [reconciliations, setReconciliations] = useState<DailyReconciliation[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [period, setPeriod] = useState<Period>('ALL');
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [reconData, branchData] = await Promise.all([
        api.get('/reconciliations'),
        api.get('/branches')
      ]);
      
      let filteredRecon = reconData;
      if (user?.role === 'SUPERVISOR') {
        filteredRecon = (reconData || []).filter((r: any) => r.branchId === user.branchId);
      }
      
      setReconciliations(filteredRecon);
      setBranches(branchData);
    } catch (error) {
      console.error(error);
    }
  };

  const range = getPeriodRange(period, periodFrom, periodTo);
  const visibleBranches = user?.role === 'SUPERVISOR' ? branches.filter(b => b.id === user.branchId) : branches;
  const filteredRecons = reconciliations.filter(r =>
    (branchFilter === 'ALL' || r.branchId === branchFilter) && inRange(r.date, range)
  );
  const filtersActive = branchFilter !== 'ALL' || period !== 'ALL';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Users className="w-8 h-8 text-indigo-400" /> Till Operators Performance
        </h1>
        <p className="text-slate-400 mt-1">Compare cashier variances and cash shortages across your branches.</p>
      </div>

      <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl px-4 sm:px-6 py-3 flex flex-wrap items-end gap-3">
        <div>
          <label className={labelCls}>Branch</label>
          <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className={selectCls}>
            <option value="ALL">All Branches</option>
            {visibleBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Period</label>
          <select value={period} onChange={e => setPeriod(e.target.value as Period)} className={selectCls}>
            {PERIOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {period === 'CUSTOM' && (
          <>
            <div>
              <label className={labelCls}>From</label>
              <input type="date" value={periodFrom} onChange={e => setPeriodFrom(e.target.value)} className={selectCls} />
            </div>
            <div>
              <label className={labelCls}>To</label>
              <input type="date" value={periodTo} onChange={e => setPeriodTo(e.target.value)} className={selectCls} />
            </div>
          </>
        )}
        {filtersActive && (
          <button onClick={() => { setBranchFilter('ALL'); setPeriod('ALL'); setPeriodFrom(''); setPeriodTo(''); }} className="text-xs text-slate-400 hover:text-white px-3 py-2 border border-[#1e345e] rounded-lg transition-colors">Clear filters</button>
        )}
        <span className="ml-auto text-xs text-slate-500">{filteredRecons.length} reconciliation{filteredRecons.length === 1 ? '' : 's'} in view</span>
      </div>

      {filteredRecons.length === 0 && (
        <div className="text-center py-12 text-slate-500 bg-[#0a192f] border border-[#1e345e] rounded-xl">No reconciliations match the selected filters.</div>
      )}
      <CashierShortageChart reconciliations={filteredRecons} branches={branches} />
      <CashierMonthlyPerformance reconciliations={filteredRecons} branches={branches} />
      <CashierPerformance reconciliations={filteredRecons} branches={branches} />
    </div>
  );
}
