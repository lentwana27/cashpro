import React, { useEffect, useState } from 'react';
import { FileText, Search } from 'lucide-react';
import clsx from 'clsx';
import { safeFormat } from '../lib/formatDate';
import { AmendmentStagePills, isAmendmentStatus } from './AmendmentStagePills';
import { PaginationBar, paginate } from './PaginationBar';
import { Period, PERIOD_OPTIONS, getPeriodRange, inRange } from '../lib/period';

const STAGES: { value: string; label: string; tone: string }[] = [
  { value: 'AMENDMENT_REQUESTED', label: 'Awaiting Auditor', tone: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  { value: 'AMENDMENT_PENDING_HEAD_ACCOUNTANT', label: 'Awaiting Head Accountant', tone: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  { value: 'AMENDMENT_PENDING_DIRECTOR', label: 'Awaiting Director', tone: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10' },
  { value: 'AMENDMENT_APPROVED', label: 'Approved', tone: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
];

const selectCls = 'bg-[#112240] border border-[#1e345e] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500';
const labelCls = 'block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1';

// Notes are stored as "[<timestamp>] Amendment Requested: <reason>"; use the most recent one.
function parseRequest(recon: any): { reason: string; requestedAt: string } {
  const notes: string[] = Array.isArray(recon.amendmentNotes) ? recon.amendmentNotes : [];
  for (let i = notes.length - 1; i >= 0; i--) {
    const m = /^\[(.*?)\]\s*Amendment Requested:\s*([\s\S]*)$/.exec(notes[i] || '');
    if (m) return { requestedAt: m[1], reason: m[2] };
  }
  return { reason: notes.length ? notes[notes.length - 1] : '', requestedAt: '' };
}

export function AmendmentRequestsTable({
  reconciliations,
  branches,
  users,
  onView,
  onApprove,
  approvableStatus = 'AMENDMENT_REQUESTED',
}: {
  reconciliations: any[];
  branches: any[];
  users: any[];
  onView: (recon: any) => void;
  onApprove: (id: string) => void;
  /** The stage(s) the current role can approve; the Approve button only shows on rows at these stages. */
  approvableStatus?: string | string[];
}) {
  const [stage, setStage] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [supervisorFilter, setSupervisorFilter] = useState('ALL');
  const [period, setPeriod] = useState<Period>('ALL');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [stage, branchFilter, supervisorFilter, period, from, to, search, pageSize]);

  const branchName = (id: string) => (branches || []).find(b => b.id === id)?.name || id;
  const supervisorName = (id: string) => (users || []).find(u => u.id === id)?.name || (id ? 'Unknown' : '—');

  const all = (reconciliations || []).filter(r => isAmendmentStatus(r.status));
  const counts = STAGES.reduce<Record<string, number>>((acc, s) => ({ ...acc, [s.value]: all.filter(r => r.status === s.value).length }), {});
  const range = getPeriodRange(period, from, to);
  const q = search.trim().toLowerCase();
  const supervisorIds = Array.from(new Set<string>(all.map(r => r.supervisorId).filter(Boolean)));

  const filtered = all
    .filter(r => stage === 'ALL' || r.status === stage)
    .filter(r => branchFilter === 'ALL' || r.branchId === branchFilter)
    .filter(r => supervisorFilter === 'ALL' || r.supervisorId === supervisorFilter)
    .filter(r => inRange(String(r.date || '').substring(0, 10), range))
    .filter(r => !q || `${branchName(r.branchId)} ${supervisorName(r.supervisorId)} ${parseRequest(r).reason}`.toLowerCase().includes(q))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const view = paginate<any>(filtered, page, pageSize);
  const filtersActive = stage !== 'ALL' || branchFilter !== 'ALL' || supervisorFilter !== 'ALL' || period !== 'ALL' || !!q;
  const clear = () => { setStage('ALL'); setBranchFilter('ALL'); setSupervisorFilter('ALL'); setPeriod('ALL'); setFrom(''); setTo(''); setSearch(''); };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAGES.map(s => (
          <button
            key={s.value}
            onClick={() => setStage(stage === s.value ? 'ALL' : s.value)}
            className={clsx(
              'text-left rounded-xl p-4 border transition-colors bg-[#0a192f] hover:bg-[#112240]',
              stage === s.value ? s.tone : 'border-[#1e345e]'
            )}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.label}</div>
            <div className={clsx('text-3xl font-black mt-1', stage === s.value ? '' : 'text-white')}>{counts[s.value] || 0}</div>
          </button>
        ))}
      </div>

      <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-[#1e345e] bg-[#061121] flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-400" /> Amendment Requests</h2>
          <span className="text-xs font-mono text-slate-400">{filtered.length} of {all.length}</span>
        </div>

        <div className="px-4 py-3 border-b border-[#1e345e] bg-[#061121]/60 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[12rem]">
            <label className={labelCls}>Search</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Branch, supervisor or reason..." className={clsx('w-full pl-9 placeholder:text-slate-500', selectCls)} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Stage</label>
            <select value={stage} onChange={e => setStage(e.target.value)} className={selectCls}>
              <option value="ALL">All Stages</option>
              {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Branch</label>
            <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className={selectCls}>
              <option value="ALL">All Branches</option>
              {(branches || []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Supervisor</label>
            <select value={supervisorFilter} onChange={e => setSupervisorFilter(e.target.value)} className={selectCls}>
              <option value="ALL">All Supervisors</option>
              {supervisorIds.map(id => <option key={id} value={id}>{supervisorName(id)}</option>)}
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
          <div>
            <label className={labelCls}>Rows</label>
            <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className={selectCls}>
              {[5, 10, 25, 50].map(n => <option key={n} value={n}>{n} / page</option>)}
            </select>
          </div>
          {filtersActive && (
            <button onClick={clear} className="text-xs text-slate-400 hover:text-white px-3 py-2 border border-[#1e345e] rounded-lg transition-colors">Clear filters</button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#112240] text-slate-400 border-b border-[#1e345e]">
              <tr>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Cash-up Date</th>
                <th className="px-4 py-3 font-medium">Branch</th>
                <th className="px-4 py-3 font-medium">Supervisor</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Requested</th>
                <th className="px-4 py-3 font-medium text-center">Stage</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e345e]">
              {view.pageItems.map(r => {
                const req = parseRequest(r);
                return (
                  <tr key={r.id} onClick={() => onView(r)} className="hover:bg-[#112240]/50 transition-colors cursor-pointer">
                    <td className="px-4 py-3 font-mono text-slate-300 whitespace-nowrap">{safeFormat(r.date || new Date(), 'MMM d, yyyy')}</td>
                    <td className="px-4 py-3 font-medium text-white">{branchName(r.branchId)}</td>
                    <td className="px-4 py-3 text-slate-300">{supervisorName(r.supervisorId)}</td>
                    <td className="px-4 py-3 text-slate-300 max-w-sm"><div className="line-clamp-2" title={req.reason}>{req.reason || <span className="text-slate-500 italic">No reason recorded</span>}</div></td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{req.requestedAt || '—'}</td>
                    <td className="px-4 py-3 text-center"><AmendmentStagePills status={r.status} className="justify-center" /></td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={e => { e.stopPropagation(); onView(r); }} className="px-3 py-1.5 bg-[#112240] border border-[#1e345e] text-slate-300 hover:text-white rounded text-xs font-bold transition-colors">Review</button>
                      {(Array.isArray(approvableStatus) ? approvableStatus : [approvableStatus]).includes(r.status) && (
                        <button onClick={e => { e.stopPropagation(); onApprove(r.id); }} className="ml-2 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded text-xs font-bold transition-colors">Approve</button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-slate-500">{all.length === 0 ? 'No amendment requests yet.' : 'No amendment requests match the filters.'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4">
          <PaginationBar page={view.currentPage} totalPages={view.totalPages} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
