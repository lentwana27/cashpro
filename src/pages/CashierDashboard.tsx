import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../components/AuthProvider';
import { Activity, FileText } from 'lucide-react';
import clsx from 'clsx';
import { safeFormat } from '../lib/formatDate';
import { AmendmentStagePills, isAmendmentStatus } from '../components/AmendmentStagePills';
import { PaginationBar, paginate } from '../components/PaginationBar';
import { Period, PERIOD_OPTIONS, getPeriodRange, inRange } from '../lib/period';

const STAGE_OPTIONS = [
  { value: 'AMENDMENT_REQUESTED', label: 'Awaiting Auditor' },
  { value: 'AMENDMENT_PENDING_HEAD_ACCOUNTANT', label: 'Awaiting Head Accountant' },
  { value: 'AMENDMENT_PENDING_DIRECTOR', label: 'Awaiting Director' },
  { value: 'AMENDMENT_APPROVED', label: 'Approved' },
];
const selectCls = 'bg-[#112240] border border-[#1e345e] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500';
const labelCls = 'block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1';
const PAGE_SIZE = 5;

type MyAmendment = { id: string; date: string; branchId: string; status: string; tills: string; variance: number };

export function CashierDashboard() {
  const { user } = useAuth();
  const [branchName, setBranchName] = useState<string>('');
  const [branches, setBranches] = useState<any[]>([]);
  const [recons, setRecons] = useState<any[]>([]);
  const [stage, setStage] = useState('ALL');
  const [period, setPeriod] = useState<Period>('ALL');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [stage, period, from, to]);

  useEffect(() => {
    if (!user) return;
    const load = () => {
      api.get('/branches').then(brs => {
        setBranches(brs || []);
        const b = (brs || []).find((x: any) => x.id === user.branchId);
        if (b) setBranchName(b.name);
      }).catch(console.error);
      api.get('/reconciliations').then(rs => setRecons(rs || [])).catch(() => {});
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Read-only and scoped to this cashier: only amendments on cash-ups that include one of their own tills.
  // Only the cashier's own till figures are kept; the reason, supervisor and other staff's figures are not used.
  const mine: MyAmendment[] = recons
    .filter(r => isAmendmentStatus(r.status))
    .map((r): MyAmendment | null => {
      const own = (Array.isArray(r.tillVariances) ? r.tillVariances : []).filter((tv: any) => tv.cashierId === user?.id);
      if (own.length === 0) return null;
      return {
        id: r.id,
        date: r.date,
        branchId: r.branchId,
        status: r.status,
        tills: own.map((tv: any) => tv.tillName).filter(Boolean).join(', '),
        variance: own.reduce((a: number, tv: any) => a + (tv.variance || 0), 0),
      };
    })
    .filter((m): m is MyAmendment => m !== null);

  const range = getPeriodRange(period, from, to);
  const filtered = mine
    .filter(m => stage === 'ALL' || m.status === stage)
    .filter(m => inRange(String(m.date || '').substring(0, 10), range))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const view = paginate<MyAmendment>(filtered, page, PAGE_SIZE);
  const inProgress = mine.filter(m => m.status !== 'AMENDMENT_APPROVED').length;
  const filtersActive = stage !== 'ALL' || period !== 'ALL';
  const branchLabel = (id: string) => (branches || []).find((b: any) => b.id === id)?.name || id;

  return (
    <div className="space-y-6">
      <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl p-8 text-center max-w-2xl mx-auto mt-10">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Activity className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Welcome, {user?.name}</h1>
        <p className="text-slate-400 mb-6">
          You are logged in as a Till Operator (Cashier). Your reconciliations and till variances are managed by your Branch Supervisor.
        </p>
        <div className="bg-[#061121] rounded-lg p-6 border border-[#1e345e] inline-block text-left w-full">
          <h3 className="text-lg font-semibold text-white mb-4">Your Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between border-b border-[#1e345e] pb-2">
              <span className="text-slate-400">Name:</span>
              <span className="text-white font-medium">{user?.name}</span>
            </div>
            <div className="flex justify-between border-b border-[#1e345e] pb-2">
              <span className="text-slate-400">Email:</span>
              <span className="text-white font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-slate-400">Role:</span>
              <span className="text-emerald-400 font-medium">Cashier / Till Operator</span>
            </div>
            <div className="flex justify-between pb-2 mt-2">
              <span className="text-slate-400">Allocated Branch:</span>
              <span className="text-blue-400 font-medium">{branchName || user?.branchId || 'Not Assigned'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl shadow-xl overflow-hidden max-w-2xl mx-auto">
        <div className="p-4 border-b border-[#1e345e] bg-[#061121] flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" /> My amendments
            {inProgress > 0 && (
              <span className="text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-full px-2 py-0.5">{inProgress} in progress</span>
            )}
          </h2>
          <span className="text-xs text-slate-500">Read-only</span>
        </div>
        <p className="px-4 pt-3 text-xs text-slate-400">Cash-ups that include one of your tills and are being amended. Your Supervisor requests amendments, so there is nothing you need to do here.</p>

        {mine.length > 0 && (
          <div className="px-4 py-3 flex flex-wrap items-end gap-3">
            <div>
              <label className={labelCls}>Stage</label>
              <select value={stage} onChange={e => setStage(e.target.value)} className={selectCls}>
                <option value="ALL">All Stages</option>
                {STAGE_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
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
                <div><label className={labelCls}>From</label><input type="date" value={from} onChange={e => setFrom(e.target.value)} className={selectCls} /></div>
                <div><label className={labelCls}>To</label><input type="date" value={to} onChange={e => setTo(e.target.value)} className={selectCls} /></div>
              </>
            )}
            {filtersActive && (
              <button onClick={() => { setStage('ALL'); setPeriod('ALL'); setFrom(''); setTo(''); }} className="text-xs text-slate-400 hover:text-white px-3 py-2 border border-[#1e345e] rounded-lg transition-colors">Clear filters</button>
            )}
          </div>
        )}

        <div className="p-4 pt-1 space-y-3">
          {mine.length === 0 && <div className="text-center text-sm text-slate-500 py-6">None of your cash-ups are being amended.</div>}
          {mine.length > 0 && filtered.length === 0 && <div className="text-center text-sm text-slate-500 py-6">No amendments match the filters.</div>}
          {view.pageItems.map(m => (
            <div key={m.id} className="bg-[#112240] border border-[#1e345e] rounded-lg p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-bold text-white">{safeFormat(m.date || new Date(), 'MMM d, yyyy')}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{branchLabel(m.branchId)}{m.tills ? ` · ${m.tills}` : ''}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">Your till variance</div>
                  <div className={clsx('font-mono font-bold', m.variance > 0 ? 'text-emerald-400' : m.variance < 0 ? 'text-rose-400' : 'text-blue-400')}>
                    {m.variance > 0 ? '+' : ''}{m.variance.toFixed(2)} USD
                  </div>
                </div>
              </div>
              <div className="mt-3"><AmendmentStagePills status={m.status} /></div>
            </div>
          ))}
        </div>
        <div className="px-4 pb-4">
          <PaginationBar page={view.currentPage} totalPages={view.totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
