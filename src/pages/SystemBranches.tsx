import { safeFormat } from '../lib/formatDate';
import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Branch, User, DailyReconciliation } from '../lib/types';
import { Building2, X, CheckCircle, Activity, Search, Target, MessageCircle, AlertTriangle, Send, ShieldCheck, Plus, UserSquare, UserPlus, ArrowRightLeft, FileText, DollarSign, TrendingUp, Users, History, Settings, MapPin } from 'lucide-react';
import clsx from 'clsx';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuth } from '../components/AuthProvider';
import { ReconModal } from '../components/ReconModal';
import { AmendmentStagePills, isAmendmentStatus } from '../components/AmendmentStagePills';
import { BranchHistoryModal } from '../components/BranchHistoryModal';
import { CashierHistoryModal } from '../components/CashierHistoryModal';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { PaginationBar, paginate } from '../components/PaginationBar';
import { Period, PERIOD_OPTIONS, getPeriodRange, inRange } from '../lib/period';

const BRANCH_LIST_PAGE_SIZE = 8;
const OPERATOR_PAGE_SIZE = 5;
const selectCls = 'bg-[#0a192f] border border-[#1e345e] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500';
const labelCls = 'block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1';

const totalSalesOf = (c: any) => Array.isArray(c.totalSales) ? c.totalSales.reduce((a: number, b: any) => a + (b.usdEquivalent || 0), 0) : (c.totalSales?.usdEquivalent || 0);
const money = (n: number) => `$${n.toFixed(2)}`;
const signed = (n: number) => `${n > 0 ? '+' : ''}${n.toFixed(2)}`;
const varianceColor = (n: number) => n > 0 ? 'text-emerald-400' : n < 0 ? 'text-rose-400' : 'text-blue-400';

function StatusBadge({ status }: { status: string }) {
  if (isAmendmentStatus(status)) return <AmendmentStagePills status={status} />;
  return (
    <span className={clsx(
      'px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border',
      status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
      status === 'FLAGGED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
      'bg-blue-500/10 text-blue-400 border-blue-500/20'
    )}>{status}</span>
  );
}

export function SystemBranches() {
  const { user: currentUser } = useAuth();
  const [alertTarget, setAlertTarget] = useState<User | null>(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reconciliations, setReconciliations] = useState<DailyReconciliation[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [viewReconId, setViewReconId] = useState<string | null>(null);
  const [isAssigningOperator, setIsAssigningOperator] = useState(false);
  const [selectedOperatorId, setSelectedOperatorId] = useState('');

  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Branch>>({ active: true, tills: [], hasTills: false });
  const [editTillName, setEditTillName] = useState('');
  const [showBranchHistory, setShowBranchHistory] = useState(false);
  const [selectedCashierForHistory, setSelectedCashierForHistory] = useState<{id: string, name: string} | null>(null);

  const [branchSearch, setBranchSearch] = useState('');
  const [branchStatusFilter, setBranchStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [branchListPage, setBranchListPage] = useState(1);

  const [detailTab, setDetailTab] = useState<'cashups' | 'supervisors' | 'operators'>('cashups');
  const [supervisorFilter, setSupervisorFilter] = useState('ALL');
  const [period, setPeriod] = useState<Period>('ALL');
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [cashupPage, setCashupPage] = useState(1);
  const [operatorPage, setOperatorPage] = useState(1);

  const resetDetailFilters = () => {
    setSupervisorFilter('ALL');
    setPeriod('ALL');
    setPeriodFrom('');
    setPeriodTo('');
    setCashupPage(1);
    setOperatorPage(1);
  };
  const resetPages = () => { setCashupPage(1); setOperatorPage(1); };

  const loadData = () => {
    Promise.all([
      api.get('/branches'),
      api.get('/users'),
      api.get('/reconciliations')
    ]).then(([brs, usrs, recons]) => {
      setBranches(brs);
      setUsers(usrs);
      setReconciliations(recons);
    }).catch(console.error);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const getSupervisorsForBranch = (bId: string) => {
    const currentAssigned = (users || []).filter(u => u.branchId === bId && u.role === 'SUPERVISOR');
    const branchRecons = reconciliations.filter(r => r.branchId === bId);
    const pastUserIds = Array.from(new Set(branchRecons.map(r => r.supervisorId)));
    
    const allRelated = [...currentAssigned];
    pastUserIds.forEach(uid => {
      if (uid && !allRelated.some(u => u.id === uid)) {
        const u = (users || []).find(x => x.id === uid);
        if (u) allRelated.push(u);
      }
    });
    return allRelated;
  };

  const handleAssignOperator = async () => {
    if (!selectedOperatorId || !selectedBranch) return;
    try {
      await api.put(`/users/${selectedOperatorId}`, { branchId: selectedBranch.id });
      setIsAssigningOperator(false);
      setSelectedOperatorId('');
      loadData();
    } catch (e) {
      alert("Failed to assign operator.");
    }
  };

  const handleSendAlert = async () => {
    if (!alertTarget || !currentUser || !alertMessage.trim()) return;
    setSending(true);
    setSuccess(false);
    try {
      await api.post('/messages', {
        fromId: currentUser.id,
        toId: alertTarget.id,
        content: `🚨 ALERT: ${alertMessage}`
      });
      setSuccess(true);
      setAlertMessage('');
      setTimeout(() => {
        setAlertTarget(null);
        setSuccess(false);
      }, 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const saveBranch = async () => {
    try {
      if (editForm.id) {
        await api.put(`/branches/${editForm.id}`, editForm);
      } else {
        await api.post('/branches', editForm);
      }
      setIsAddingBranch(false);
      setEditForm({ active: true, tills: [], hasTills: false });
      loadData();
    } catch (e) {
      alert("Error saving branch. Make sure the code is unique.");
    }
  };

  const getTillOperatorsForBranch = (bId: string) => {
    const currentAssigned = (users || []).filter(u => u.branchId === bId && u.role === 'CASHIER');
    const branchRecons = reconciliations.filter(r => r.branchId === bId);
    
    const pastOperatorIds = new Set<string>();
    branchRecons.forEach(r => {
      r.tillVariances?.forEach(tv => {
        if (tv.cashierId) pastOperatorIds.add(tv.cashierId);
      });
    });

    const allRelated = [...currentAssigned];
    pastOperatorIds.forEach(uid => {
      if (uid && !allRelated.some(u => u.id === uid)) {
        const u = (users || []).find(x => x.id === uid);
        if (u) allRelated.push(u);
      }
    });

    return allRelated;
  };

  const getTillVariancesForOperatorAndBranch = (operatorId: string, bId: string) => {
    const branchRecons = reconciliations.filter(r => r.branchId === bId);
    let operatorRecords: any[] = [];
    
    branchRecons.forEach(r => {
      const tvs = r.tillVariances?.filter(tv => tv.cashierId === operatorId) || [];
      tvs.forEach(tv => {
        operatorRecords.push({
          date: r.date,
          status: r.status,
          reconId: r.id,
          varianceUsd: tv.variance,
          expected: tv.expected,
          actual: tv.actual,
          tillName: tv.tillName
        });
      });
    });
    
    return operatorRecords.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getCashUpsForSupervisorAndBranch = (supId: string, bId: string) => {
    return reconciliations.filter(r => r.supervisorId === supId && r.branchId === bId);
  };

  const filteredBranches = [...branches]
    .filter(b => branchStatusFilter === 'ALL' || (branchStatusFilter === 'ACTIVE' ? b.active !== false : b.active === false))
    .filter(b => {
      const q = branchSearch.trim().toLowerCase();
      return !q || b.name.toLowerCase().includes(q) || (b.code || '').toLowerCase().includes(q) || (b.location || '').toLowerCase().includes(q);
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  const branchListView = paginate(filteredBranches, branchListPage, BRANCH_LIST_PAGE_SIZE);

  const periodRange = getPeriodRange(period, periodFrom, periodTo);
  const detailFiltersActive = supervisorFilter !== 'ALL' || period !== 'ALL';
  const branchSupervisors = selectedBranch ? getSupervisorsForBranch(selectedBranch.id) : [];
  const branchPeriodRecons = selectedBranch ? reconciliations.filter(r => r.branchId === selectedBranch.id && inRange(r.date, periodRange)) : [] as DailyReconciliation[];
  const filteredCashUps = branchPeriodRecons
    .filter(r => supervisorFilter === 'ALL' || r.supervisorId === supervisorFilter)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const cashUpView = paginate<DailyReconciliation>(filteredCashUps, cashupPage, pageSize);
  const kpiSales = filteredCashUps.reduce((acc, c) => acc + totalSalesOf(c), 0);
  const kpiVariance = filteredCashUps.reduce((acc, c) => acc + (c.varianceUsd || 0), 0);
  const supervisorCards = branchSupervisors.filter(s => supervisorFilter === 'ALL' || s.id === supervisorFilter);
  const supervisorName = (id: string) => (users || []).find(u => u.id === id)?.name || 'Unknown';

  const operatorRows = selectedBranch
    ? getTillOperatorsForBranch(selectedBranch.id)
        .map(op => {
          const vars = getTillVariancesForOperatorAndBranch(op.id, selectedBranch.id).filter(v => inRange(v.date, periodRange));
          return { op, vars, total: vars.reduce((acc, v) => acc + (v.varianceUsd || 0), 0) };
        })
        .filter(row => period === 'ALL' || row.vars.length > 0)
    : [];
  const operatorView = paginate(operatorRows, operatorPage, OPERATOR_PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">System Branches</h1>
          <p className="text-slate-400 mt-1">Select a branch to view supervisors and performance.</p>
        </div>
        {currentUser?.role === 'ADMIN' && (
          <button 
            onClick={() => {
              setEditForm({ active: true, tills: [], hasTills: false });
              setIsAddingBranch(true);
              setSelectedBranch(null);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" /> Add New Branch
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 border border-[#1e345e] bg-[#0a192f] rounded-xl shadow-xl flex flex-col min-h-[500px] lg:h-[700px]">
          <div className="p-4 border-b border-[#1e345e] bg-[#061121] rounded-t-xl space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" /> All Branches
              <span className="ml-auto text-xs font-mono text-slate-400 bg-[#112240] border border-[#1e345e] px-2 py-0.5 rounded-full">{filteredBranches.length}</span>
            </h2>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={branchSearch}
                onChange={e => { setBranchSearch(e.target.value); setBranchListPage(1); }}
                placeholder="Search name, code or location..."
                className="w-full bg-[#0a192f] border border-[#1e345e] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex gap-1">
              {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => { setBranchStatusFilter(s); setBranchListPage(1); }}
                  className={clsx(
                    'flex-1 text-[11px] font-bold uppercase tracking-wider py-1.5 rounded border transition-colors',
                    branchStatusFilter === s ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-[#0a192f] text-slate-400 border-[#1e345e] hover:text-white'
                  )}
                >{s === 'ALL' ? 'All' : s === 'ACTIVE' ? 'Active' : 'Inactive'}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {branchListView.pageItems.length === 0 && (
              <div className="text-center text-sm text-slate-500 py-10">No branches match your search.</div>
            )}
            {branchListView.pageItems.map(b => (
              <button
                key={b.id}
                onClick={() => { setSelectedBranch(b); resetDetailFilters(); setDetailTab('cashups'); setIsAddingBranch(false); setEditForm({}); }}
                className={clsx(
                  "w-full text-left p-4 border rounded-xl transition-all shadow-md group",
                  selectedBranch?.id === b.id
                    ? "bg-[#112240] border-emerald-500 shadow-[0_0_15px_rgba(52,211,153,0.1)]"
                    : "bg-[#061121] border-[#1e345e] hover:border-[#2a457e] hover:bg-[#112240]"
                )}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-white text-base group-hover:text-emerald-400 transition-colors truncate">{b.name}</div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1"><MapPinIcon className="w-3 h-3 shrink-0"/> <span className="truncate">{b.location}</span></div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-xs border border-emerald-500/20">{b.code}</span>
                    {b.active === false && <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">Inactive</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="px-4 pb-4 border-t border-[#1e345e]">
            <PaginationBar page={branchListView.currentPage} totalPages={branchListView.totalPages} totalItems={filteredBranches.length} pageSize={BRANCH_LIST_PAGE_SIZE} onPageChange={setBranchListPage} />
          </div>
        </div>

        <div className="lg:col-span-2 border border-[#1e345e] bg-[#0a192f] rounded-xl shadow-xl flex flex-col min-h-[500px] lg:h-[700px]">
          {isAddingBranch || (selectedBranch && editForm.id === selectedBranch.id) ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-[#1e345e] flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {editForm.id ? 'Edit Branch Options' : 'Register New Branch'}
                </h2>
                <button onClick={() => { setIsAddingBranch(false); setEditForm({}); }} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Branch Name</label>
                    <input type="text" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-[#061121] border border-[#1e345e] text-white p-2 rounded focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Branch Code (Unique)</label>
                    <input type="text" value={editForm.code || ''} onChange={e => setEditForm({...editForm, code: e.target.value.toUpperCase()})} className="w-full bg-[#061121] border border-[#1e345e] text-white p-2 rounded focus:outline-none focus:border-emerald-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Location Address</label>
                  <input type="text" value={editForm.location || ''} onChange={e => setEditForm({...editForm, location: e.target.value})} className="w-full bg-[#061121] border border-[#1e345e] text-white p-2 rounded focus:outline-none focus:border-emerald-500" />
                </div>
                
                {/* Tills */}
                <div className="border border-[#1e345e] rounded-lg p-4 bg-[#061121]/50">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white transition-colors mb-3">
                    <input 
                      type="checkbox" 
                      checked={editForm.hasTills || false}
                      onChange={e => setEditForm({...editForm, hasTills: e.target.checked})}
                      className="w-4 h-4 text-emerald-500 bg-[#061121] border-[#1e345e] rounded focus:ring-emerald-500"
                    />
                    Branch has separate tills
                  </label>
                  {editForm.hasTills && (
                    <div className="space-y-3 pl-6 border-l-2 border-[#1e345e]">
                      <div className="flex gap-2">
                         <input 
                           type="text" 
                           value={editTillName}
                           onChange={e => setEditTillName(e.target.value)}
                           placeholder="e.g. Till 1"
                           className="flex-1 bg-[#061121] border border-[#1e345e] text-white p-1.5 text-sm rounded focus:outline-none focus:border-emerald-500"
                         />
                         <button 
                           onClick={() => {
                             if (!editTillName) return;
                             const t = [...(editForm.tills || []), { id: `till-${Date.now()}`, name: editTillName }];
                             setEditForm({ ...editForm, tills: t });
                             setEditTillName('');
                           }}
                           className="px-3 py-1.5 bg-[#1d2d4a] text-emerald-400 text-xs rounded border border-[#1e345e]"
                         >Add</button>
                      </div>
                      {editForm.tills && editForm.tills.map((t: any) => (
                        <div key={t.id} className="flex justify-between items-center bg-[#112240] p-2 rounded border border-[#1e345e] text-sm text-white">
                          <span>{t.name}</span>
                          <button onClick={() => setEditForm({...editForm, tills: editForm.tills?.filter((x:any) => x.id !== t.id)})} className="text-slate-400 hover:text-rose-400"><X className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <button onClick={saveBranch} className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors">
                    Save Branch Configuration
                  </button>
                </div>
              </div>
            </div>
          ) : selectedBranch ? (
            <>
              <div className="p-4 sm:p-6 border-b border-[#1e345e] bg-gradient-to-r from-[#061121] to-[#0a192f] rounded-t-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl shrink-0 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-bold text-white truncate">{selectedBranch.name}</h2>
                        <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-xs border border-emerald-500/20">{selectedBranch.code}</span>
                        <span className={clsx('text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border', selectedBranch.active === false ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20')}>
                          {selectedBranch.active === false ? 'Inactive' : 'Active'}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm mt-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{selectedBranch.location}</span></p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setShowBranchHistory(true)} className="text-sm px-3 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors flex items-center gap-2">
                      <History className="w-4 h-4" /> History
                    </button>
                    {currentUser?.role === 'ADMIN' && (
                      <button onClick={() => { setEditForm({...selectedBranch}); setIsAddingBranch(true); }} className="text-sm px-3 py-2 bg-[#112240] border border-[#1e345e] text-slate-300 rounded-lg hover:text-white transition-colors flex items-center gap-2">
                        <Settings className="w-4 h-4" /> Configure
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
                  <div className="bg-[#0a192f] border border-[#1e345e] rounded-lg p-3">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><FileText className="w-3 h-3" /> Cash-ups</div>
                    <div className="text-xl font-bold text-white mt-1">{filteredCashUps.length}</div>
                  </div>
                  <div className="bg-[#0a192f] border border-[#1e345e] rounded-lg p-3">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><DollarSign className="w-3 h-3" /> Total Sales</div>
                    <div className="text-xl font-bold text-white mt-1">{money(kpiSales)}</div>
                  </div>
                  <div className="bg-[#0a192f] border border-[#1e345e] rounded-lg p-3">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Net Variance</div>
                    <div className={clsx('text-xl font-bold mt-1', varianceColor(kpiVariance))}>{signed(kpiVariance)}</div>
                  </div>
                  <div className="bg-[#0a192f] border border-[#1e345e] rounded-lg p-3">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><Users className="w-3 h-3" /> Team</div>
                    <div className="text-xl font-bold text-white mt-1">{branchSupervisors.length} <span className="text-xs font-normal text-slate-400">sup.</span> / {operatorRows.length} <span className="text-xs font-normal text-slate-400">ops.</span></div>
                  </div>
                </div>
              </div>

              <div className="px-4 sm:px-6 py-3 border-b border-[#1e345e] bg-[#061121]/60 flex flex-wrap items-end gap-3">
                <div>
                  <label className={labelCls}>Supervisor</label>
                  <select value={supervisorFilter} onChange={e => { setSupervisorFilter(e.target.value); resetPages(); }} className={selectCls}>
                    <option value="ALL">All Supervisors</option>
                    {branchSupervisors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Period</label>
                  <select value={period} onChange={e => { setPeriod(e.target.value as Period); resetPages(); }} className={selectCls}>
                    {PERIOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                {period === 'CUSTOM' && (
                  <>
                    <div>
                      <label className={labelCls}>From</label>
                      <input type="date" value={periodFrom} onChange={e => { setPeriodFrom(e.target.value); resetPages(); }} className={selectCls} />
                    </div>
                    <div>
                      <label className={labelCls}>To</label>
                      <input type="date" value={periodTo} onChange={e => { setPeriodTo(e.target.value); resetPages(); }} className={selectCls} />
                    </div>
                  </>
                )}
                <div>
                  <label className={labelCls}>Rows</label>
                  <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); resetPages(); }} className={selectCls}>
                    {[5, 10, 25, 50].map(n => <option key={n} value={n}>{n} / page</option>)}
                  </select>
                </div>
                {detailFiltersActive && (
                  <button onClick={resetDetailFilters} className="text-xs text-slate-400 hover:text-white px-3 py-2 border border-[#1e345e] rounded-lg transition-colors">Clear filters</button>
                )}
              </div>

              <div className="px-4 sm:px-6 pt-3 flex gap-1 border-b border-[#1e345e]">
                {([
                  { id: 'cashups', label: 'Cash-ups', icon: FileText, count: filteredCashUps.length },
                  { id: 'supervisors', label: 'Supervisors', icon: ShieldCheck, count: supervisorCards.length },
                  { id: 'operators', label: 'Till Operators', icon: UserSquare, count: operatorRows.length },
                ] as const).map(t => (
                  <button
                    key={t.id}
                    onClick={() => setDetailTab(t.id)}
                    className={clsx(
                      'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                      detailTab === t.id ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'
                    )}
                  >
                    <t.icon className="w-4 h-4" /> {t.label}
                    <span className="text-[10px] font-mono bg-[#112240] border border-[#1e345e] px-1.5 py-0.5 rounded-full">{t.count}</span>
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {detailTab === 'cashups' && (
                  filteredCashUps.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">No cash-ups match the selected filters.</div>
                  ) : (
                    <>
                      <div className="overflow-x-auto border border-[#1e345e] rounded-xl">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-[#112240] text-slate-400">
                            <tr>
                              <th className="px-4 py-2 font-medium">Date</th>
                              <th className="px-4 py-2 font-medium">Supervisor</th>
                              <th className="px-4 py-2 font-medium">Sales (USD)</th>
                              <th className="px-4 py-2 font-medium">Variance (USD)</th>
                              <th className="px-4 py-2 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1e345e] bg-[#061121]">
                            {cashUpView.pageItems.map(c => (
                              <tr key={c.id} onClick={() => setViewReconId(c.id)} className="hover:bg-[#112240] transition-colors cursor-pointer">
                                <td className="px-4 py-3 font-mono text-slate-300">{safeFormat(c.date || new Date(), 'MMM dd, yyyy')}</td>
                                <td className="px-4 py-3 text-slate-300">{supervisorName(c.supervisorId)}</td>
                                <td className="px-4 py-3 font-medium text-white">{money(totalSalesOf(c))}</td>
                                <td className={clsx('px-4 py-3 font-medium', varianceColor(c.varianceUsd || 0))}>{signed(c.varianceUsd || 0)}</td>
                                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <PaginationBar page={cashUpView.currentPage} totalPages={cashUpView.totalPages} totalItems={filteredCashUps.length} pageSize={pageSize} onPageChange={setCashupPage} />
                    </>
                  )
                )}

                {detailTab === 'supervisors' && (
                  supervisorCards.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">No supervisors or cash-up history for this branch.</div>
                  ) : (
                    <div className="space-y-4">
                      {supervisorCards.map(sup => {
                        const cashUps = branchPeriodRecons.filter(r => r.supervisorId === sup.id);
                        const totalVariance = cashUps.reduce((acc, c) => acc + (c.varianceUsd || 0), 0);
                        const chartData = [...cashUps]
                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                          .map(c => ({ date: safeFormat(c.date || new Date(), 'MMM dd'), variance: c.varianceUsd || 0 }));
                        return (
                          <div key={sup.id} className="bg-[#061121] border border-[#1e345e] rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full shrink-0 bg-[#112240] border border-[#1e345e] flex items-center justify-center text-white font-bold">{sup.name.charAt(0)}</div>
                              <div>
                                <div className="font-bold text-white flex flex-wrap items-center gap-2">
                                  {sup.name}
                                  <div className={clsx("w-2 h-2 rounded-full", sup.isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-slate-500")} title={sup.isOnline ? "Online" : "Offline"} />
                                  {sup.branchId !== selectedBranch.id && (
                                    <span className="text-[10px] uppercase bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">Past Assigned</span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5">
                                  {sup.isOnline ? 'Online now' : (sup.lastSeen ? `Last seen ${formatDistanceToNow(new Date(sup.lastSeen))} ago` : 'Never logged in')}
                                </div>
                              </div>
                            </div>
                            <div className="flex-1 lg:max-w-xs h-14">
                              {chartData.length > 0 && (
                                <ResponsiveContainer minWidth={0} minHeight={0} width="100%" height="100%">
                                  <BarChart data={chartData}>
                                    <Tooltip
                                      contentStyle={{ backgroundColor: '#0a192f', border: '1px solid #1e345e', fontSize: '10px' }}
                                      cursor={{ fill: '#1e345e', opacity: 0.4 }}
                                      formatter={(value: number) => [money(value), 'Variance']}
                                      labelStyle={{ color: '#94a3b8' }}
                                    />
                                    <Bar dataKey="variance">
                                      {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.variance > 0 ? '#34d399' : entry.variance < 0 ? '#fb7185' : '#60a5fa'} />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm whitespace-nowrap">
                              <div className="text-right">
                                <div className="text-slate-400 text-xs">Total Variances</div>
                                <div className={clsx('font-bold text-sm', varianceColor(totalVariance))}>{signed(totalVariance)} USD</div>
                              </div>
                              <div className="border-l border-[#1e345e] h-8" />
                              <div><span className="text-slate-400">Cash-ups: </span><span className="text-white font-bold">{cashUps.length}</span></div>
                              <button
                                onClick={() => setAlertTarget(sup)}
                                className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded flex items-center gap-2 transition-colors font-medium text-xs"
                                title="Send Message"
                              >
                                <MessageCircle className="w-4 h-4" /> Message
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}

                {detailTab === 'operators' && (
                  <>
                    {currentUser?.role === 'ADMIN' && (
                      <div className="flex justify-end mb-4">
                        <button
                          onClick={() => setIsAssigningOperator(true)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded font-medium text-xs transition-colors"
                        >
                          <UserPlus className="w-4 h-4" /> Add / Transfer Operator
                        </button>
                      </div>
                    )}
                    {operatorRows.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 bg-[#0a192f] rounded-xl border border-[#1e345e]">
                        No till operators found for this branch and period.
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 gap-4">
                          {operatorView.pageItems.map(({ op, vars, total }) => {
                            const isCurrent = op.branchId === selectedBranch.id;
                            return (
                              <div key={op.id} className="bg-[#0a192f] border border-[#1e345e] rounded-xl overflow-hidden shadow-sm hover:border-blue-500/30 transition-colors cursor-pointer" onClick={() => setSelectedCashierForHistory({ id: op.id, name: op.name })}>
                                <div className="p-4 border-b border-[#1e345e] flex items-center justify-between bg-[#112240]">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#1e345e] text-slate-300 flex items-center justify-center font-bold text-sm">{op.name.charAt(0)}</div>
                                    <div>
                                      <div className="font-bold text-white flex items-center gap-2">
                                        {op.name}
                                        {!isCurrent && <span className="text-[10px] uppercase bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">Transferred</span>}
                                      </div>
                                      <div className="text-xs text-slate-400">{op.email}</div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs text-slate-400 mb-0.5">Net Variance</div>
                                    <div className={clsx('font-bold text-sm', varianceColor(total))}>{signed(total)} USD</div>
                                  </div>
                                </div>
                                {vars.length > 0 ? (
                                  <div className="overflow-x-auto p-0">
                                    <table className="w-full text-left text-xs whitespace-nowrap">
                                      <thead className="bg-[#061121] text-slate-400 border-b border-[#1e345e]">
                                        <tr>
                                          <th className="px-4 py-2 font-medium">Date</th>
                                          <th className="px-4 py-2 font-medium">Till Name</th>
                                          <th className="px-4 py-2 font-medium">Expected</th>
                                          <th className="px-4 py-2 font-medium">Actual</th>
                                          <th className="px-4 py-2 font-medium">Variance</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-[#1e345e]">
                                        {vars.map((v, idx) => (
                                          <tr key={idx} className="hover:bg-[#112240]/50">
                                            <td className="px-4 py-2 text-slate-300 font-mono">{safeFormat(v.date || new Date(), 'MMM dd, yyyy')}</td>
                                            <td className="px-4 py-2 text-slate-300">{v.tillName}</td>
                                            <td className="px-4 py-2 text-slate-400 font-mono">{money(v.expected)}</td>
                                            <td className="px-4 py-2 text-slate-400 font-mono">{money(v.actual)}</td>
                                            <td className={clsx('px-4 py-2 font-bold font-mono', v.varianceUsd > 0 ? 'text-emerald-400' : v.varianceUsd < 0 ? 'text-rose-400' : 'text-slate-300')}>{signed(v.varianceUsd)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div className="p-3 text-center text-xs text-slate-500">No till variances recorded.</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <PaginationBar page={operatorView.currentPage} totalPages={operatorView.totalPages} totalItems={operatorRows.length} pageSize={OPERATOR_PAGE_SIZE} onPageChange={setOperatorPage} />
                      </>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 h-full p-4 sm:p-6 text-center">
              <Building2 className="w-16 h-16 opacity-30 mb-4" />
              <p>Select a branch to view its supervisors and their posted cash-ups.</p>
            </div>
          )}
        </div>
      </div>

      {alertTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#0a192f] border border-blue-500/30 rounded-xl shadow-[0_0_50px_rgba(59,130,246,0.1)] p-4 sm:p-6 w-full max-w-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-500" />
            
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-400" /> 
                Message to {alertTarget.name}
              </h3>
              <button onClick={() => setAlertTarget(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {success ? (
                <div className="flex flex-col items-center justify-center py-6 text-emerald-400">
                  <ShieldCheck className="w-12 h-12 mb-3" />
                  <p className="font-bold">Message Sent Successfully!</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">Message Content</label>
                    <textarea 
                      value={alertMessage}
                      onChange={e => setAlertMessage(e.target.value)}
                      placeholder="Type your message here..."
                      className="w-full bg-[#061121] border border-[#1e345e] text-white p-3 rounded-lg focus:outline-none focus:border-blue-500 h-32 resize-none"
                      autoFocus
                    />
                  </div>
                  <div className="pt-2 flex justify-end gap-3">
                    <button onClick={() => setAlertTarget(null)} className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium">Cancel</button>
                    <button 
                      onClick={handleSendAlert} 
                      disabled={sending || !alertMessage.trim()}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium rounded-lg shadow-lg text-sm flex items-center gap-2 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      {sending ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      
      {isAssigningOperator && selectedBranch && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl shadow-2xl p-6 w-full max-w-md relative">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-indigo-400" /> Assign Operator to Branch
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Select an existing Cashier / Till Operator to transfer them to <strong>{selectedBranch.name}</strong>. Their past history remains intact.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs p-3 rounded-lg mb-6 flex items-start gap-2">
              <span className="shrink-0 mt-0.5">ℹ️</span>
              <span>Need to add a completely new operator? Go to the <strong><Link to="/users" className="underline hover:text-white">Users</Link></strong> tab to register them first.</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Select Till Operator</label>
                <select 
                  value={selectedOperatorId}
                  onChange={e => setSelectedOperatorId(e.target.value)}
                  className="w-full bg-[#061121] border border-[#1e345e] text-white p-3 rounded-lg focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Choose an operator --</option>
                  {(users || []).filter(u => u.role === 'CASHIER' && u.branchId !== selectedBranch.id).map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-[#1e345e]">
                <button 
                  onClick={() => setIsAssigningOperator(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAssignOperator}
                  disabled={!selectedOperatorId}
                  className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold rounded-lg text-sm transition-colors"
                >
                  Assign Operator
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBranchHistory && selectedBranch && (
        <BranchHistoryModal
          branch={selectedBranch}
          reconciliations={reconciliations}
          onClose={() => setShowBranchHistory(false)}
        />
      )}
      {selectedCashierForHistory && selectedBranch && (
        <CashierHistoryModal
          cashierId={selectedCashierForHistory.id}
          cashierName={selectedCashierForHistory.name}
          reconciliations={reconciliations}
          branches={branches}
          onClose={() => setSelectedCashierForHistory(null)}
        />
      )}
      {viewReconId && (
        <ReconModal 
          recon={(reconciliations || []).find(r => r.id === viewReconId)}
          onClose={() => setViewReconId(null)}
        />
      )}
    </div>
  );
}

function MapPinIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  );
}
