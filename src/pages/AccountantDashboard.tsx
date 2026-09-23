import { safeFormat } from '../lib/formatDate';
import { ExportReportModal } from "../components/ExportReportModal";
import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { DailyReconciliation, ExchangeRate } from '../lib/types';
import { format } from 'date-fns';
import { CheckCircle, AlertOctagon, Settings, Search, ArrowUpDown, ChevronDown, ChevronUp, Download } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { ReconModal } from '../components/ReconModal';
import { ExchangeRatesModal } from '../components/ExchangeRatesModal';
import * as XLSX from 'xlsx';
import { useAuth } from '../components/AuthProvider';

export function AccountantDashboard() {
  const [reconciliations, setReconciliations] = useState<DailyReconciliation[]>([]);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [showRates, setShowRates] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchBranch, setSearchBranch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  
  const [sortField, setSortField] = useState<'branchId' | 'date'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const [viewingRecon, setViewingRecon] = useState<any>(null);

  const [editingSalesId, setEditingSalesId] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [recs, rts, brs] = await Promise.all([
        api.get('/reconciliations'),
        api.get('/rates'),
        api.get('/branches')
      ]);
      setReconciliations(recs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setRates(rts);
      setBranches(brs);
    } catch (e) {
      // Ignore network errors during polling
    }
  };

  const updateStatus = async (id: string, status: string, recon?: any) => {
    if (status === 'AMENDMENT_APPROVED' && recon) {
      // The server decides whether both parties have now approved and flips
      // the status itself, against the current DB row - not this possibly
      // stale `recon` snapshot - so two near-simultaneous approvals can't
      // race and leave the status stuck behind two true flags.
      await api.put(`/reconciliations/${id}`, { accountantAmendmentApproval: true });
    } else {
      await api.put(`/reconciliations/${id}`, { status });
    }
    loadData();
  };

  const handleSort = (field: 'branchId' | 'date') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredRecon = reconciliations
    .filter(r => filterStatus === 'ALL' || r.status === filterStatus)
    .filter(r => {
      if (!searchBranch) return true;
      const b = (branches || []).find(b => b.id === r.branchId);
      const bName = b?.name?.toLowerCase() || '';
      const bId = r.branchId.toLowerCase();
      const s = searchBranch.toLowerCase();
      return bId.includes(s) || bName.includes(s);
    })
    .filter(r => !filterDate || r.date === filterDate)
    .sort((a, b) => {
      if (sortField === 'date') {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
      } else {
        return sortDirection === 'asc' 
          ? a.branchId.localeCompare(b.branchId)
          : b.branchId.localeCompare(a.branchId);
      }
    });
  const missingReconciliations = React.useMemo(() => {
    const missing: { branchName: string; date: string }[] = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    
    branches.forEach(b => {
      if (b.status !== 'ACTIVE') return;
      for (let i = 1; i <= 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dStr = format(d, 'yyyy-MM-dd');
        
        const hasRecon = reconciliations.some(r => r.branchId === b.id && r.date === dStr);
        if (!hasRecon) {
          missing.push({ branchName: b.name || b.id, date: dStr });
        }
      }
    });
    
    return missing.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [branches, reconciliations]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">Reconciliation Review</h1>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-sm font-medium text-white shadow-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Advanced Export
          </button>
          <button 
            onClick={() => setShowRates(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#112240] hover:bg-[#1a2d53] border border-[#1e345e] rounded-lg text-sm font-medium transition-colors"
          >
            <Settings className="w-4 h-4 text-emerald-400" />
            Manage Exchange Rates
          </button>
        </div>
      </div>

      {missingReconciliations.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 sm:p-6 shadow-inner">
          <div className="flex items-center gap-3 mb-4">
            <AlertOctagon className="w-6 h-6 text-rose-400" />
            <h3 className="text-lg font-bold text-rose-400">Missing Reconciliations Alert</h3>
          </div>
          <p className="text-sm text-rose-300 mb-4">The following branches have missed their daily reconciliations in the last 7 days. They must request an unlock to fill these in.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {missingReconciliations.slice(0, 9).map((m, idx) => (
              <div key={idx} className="bg-rose-500/5 p-3 rounded-lg border border-rose-500/10 flex justify-between items-center text-sm">
                <span className="font-semibold text-rose-200">{m.branchName}</span>
                <span className="text-rose-400/80 font-mono">{safeFormat(m.date || new Date(), 'MMM d, yyyy')}</span>
              </div>
            ))}
            {missingReconciliations.length > 9 && (
              <div className="bg-rose-500/5 p-3 rounded-lg border border-rose-500/10 flex justify-center items-center text-sm text-rose-300">
                + {missingReconciliations.length - 9} more missing
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl shadow-xl flex flex-col">
        <div className="p-4 border-b border-[#1e345e] flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search branches..." 
              value={searchBranch}
              onChange={(e) => setSearchBranch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#061121] border border-[#1e345e] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 text-white"
            />
          </div>
          
          <input 
            type="date" 
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-2 bg-[#061121] border border-[#1e345e] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 text-white"
          />

          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-[#061121] border border-[#1e345e] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 text-white appearance-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="AMENDMENT_REQUESTED">Amendment Requested</option>
            <option value="APPROVED">Approved</option>
            <option value="FLAGGED">Flagged</option>
          </select>
          
          {(searchBranch || filterDate !== safeFormat(new Date(), 'yyyy-MM-dd') || filterStatus !== 'ALL') && (
            <button 
              onClick={() => { setSearchBranch(''); setFilterDate(safeFormat(new Date(), 'yyyy-MM-dd')); setFilterStatus('ALL'); }}
              className="px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#061121] text-slate-400">
              <tr>
                
                <th className="px-6 py-4 font-medium transition-colors hover:text-white cursor-pointer select-none" onClick={() => handleSort('branchId')}>
                  <div className="flex items-center gap-2">Branch <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-4 font-medium transition-colors hover:text-white cursor-pointer select-none" onClick={() => handleSort('date')}>
                  <div className="flex items-center gap-2">Date <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-4 text-right font-medium">Total Sales (USD)</th>
                <th className="px-6 py-4 text-right font-medium">End Cash (USD)</th>
                <th className="px-6 py-4 text-right font-medium">Variance (USD)</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e345e]">
              {filteredRecon.map(r => (
                <React.Fragment key={r.id}>
                  <tr className={clsx("transition-colors cursor-pointer hover:bg-[#112240]/50")} onClick={() => setViewingRecon(r)}>
                    
                    <td className="px-6 py-4 font-medium text-white">{(branches || []).find(b => b.id === r.branchId)?.name || r.branchId}</td>
                    <td className="px-6 py-4 text-slate-300">
                      <div>{safeFormat(r.date || new Date(), 'MMM d, yyyy')}</div>
                      {r.salesInputtedByName && <div className="text-[10px] text-emerald-400 font-bold mt-1">Sales by: {r.salesInputtedByName}</div>}
                    </td>
                    <td className="px-6 py-4 text-right font-mono">${(Array.isArray(r.totalSales) ? r.totalSales.reduce((a:number,b:any)=>a+(b.usdEquivalent||0),0) : (r.totalSales?.usdEquivalent || 0)).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-mono">${(r.endOfDayCash?.usdEquivalent || 0).toFixed(2)}</td>
                    <td className={clsx("px-6 py-4 text-right font-mono font-bold", 
                      (r.varianceUsd || 0) > 0 ? "text-emerald-400" :
                      (r.varianceUsd || 0) < 0 ? "text-rose-400" : "text-blue-400"
                    )}>
                      {(r.varianceUsd || 0) > 0 ? '+' : ''}{(r.varianceUsd || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={clsx("px-2 py-1 rounded text-xs font-semibold", 
                        r.status === 'APPROVED' ? "bg-emerald-500/20 text-emerald-400" :
                        r.status === 'FLAGGED' ? "bg-rose-500/20 text-rose-400" :
                        "bg-amber-500/20 text-amber-400"
                      )}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 flex justify-end">
                      <button disabled={r.salesConfirmed}  onClick={(e) => { e.stopPropagation(); setEditingSalesId(r.id) }} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${r.salesConfirmed ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"}`}>
                          {r.salesConfirmed ? 'Sales Locked' : 'Input Sales'}
                        </button>
                      {r.status === 'PENDING' && (
                        <>
                          <button  onClick={(e) => { e.stopPropagation(); updateStatus(r.id, 'APPROVED')  }} className="p-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-md transition-colors" title="Approve">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button  onClick={(e) => { e.stopPropagation(); updateStatus(r.id, 'FLAGGED')  }} className="p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-md transition-colors" title="Flag Setup">
                            <AlertOctagon className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {r.status === 'UNLOCK_REQUESTED' && (
                        <div className="flex gap-2">
                          <button  onClick={(e) => { e.stopPropagation(); updateStatus(r.id, 'UNLOCK_APPROVED')  }} className="px-3 py-1 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 rounded text-xs font-bold transition-colors">
                            Approve
                          </button>
                          <button  onClick={(e) => { e.stopPropagation(); updateStatus(r.id, 'UNLOCK_DECLINED')  }} className="px-3 py-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 rounded text-xs font-bold transition-colors">
                            Decline
                          </button>
                        </div>
                      )}
                      {r.status === 'AMENDMENT_REQUESTED' && !r.accountantAmendmentApproval && (
                        <button  onClick={(e) => { e.stopPropagation(); updateStatus(r.id, 'AMENDMENT_APPROVED', r)  }} className="px-3 py-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 rounded text-xs font-bold transition-colors">
                          Approve Amendment
                        </button>
                      )}
                      {r.status === 'AMENDMENT_REQUESTED' && r.accountantAmendmentApproval && (
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs font-bold">
                          Approved &middot; awaiting Auditor
                        </span>
                      )}
                    </td>
                  </tr>
                  
                  {/* Expanded View */}
                  
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {filteredRecon.length === 0 && (
            <div className="p-4 sm:p-6 md:p-8 text-center text-slate-500">
              No reconciliations found matching filters.
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showRates && (
          <ExchangeRatesModal rates={rates} onClose={() => setShowRates(false)} onUpdate={loadData} />
        )}
        <ExportReportModal 
          isOpen={showExportModal} 
          onClose={() => setShowExportModal(false)} 
          reconciliations={reconciliations} 
          branches={branches} 
        />
        {viewingRecon && <ReconModal recon={viewingRecon} onClose={() => setViewingRecon(null)} />}
        {editingSalesId && (
          <InputSalesModal 
            reconciliation={(reconciliations || []).find(r => r.id === editingSalesId)} 
            rates={rates} 
            onClose={() => setEditingSalesId(null)} 
            onUpdate={() => { setEditingSalesId(null); loadData(); }} 
          />
        )}
      </AnimatePresence>
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
        <span className="font-mono text-white">${total.toFixed(2)}</span>
      </div>
      <div className="space-y-1.5 border-l-2 border-[#1e345e] ml-1 pl-3">
        {arr.map((item: any, idx: number) => (
          <div key={idx} className="flex justify-between text-xs">
            <span className="text-slate-400">
              {item.description || 'Unnamed'}{item.date ? ` [${item.date}]` : ""} {item.cashierName ? `(Cashier: ${item.cashierName})` : ""} 
              {(item.amount || item.amount === 0) && <span className="text-slate-500 ml-1">({item.amount} {item.currencyCode})</span>}
            </span>
            <span className="text-slate-300 font-mono">${(item.usdEquivalent||0).toFixed(2)}</span>
          </div>
        ))}
      
        
      </div>
    </div>
  );
}

function InputSalesModal({ currentUser, reconciliation, rates, onClose, onUpdate }: any) {
  const [salesItems, setSalesItems] = useState<any[]>(
    Array.isArray(reconciliation.totalSales) && reconciliation.totalSales.length > 0 
      ? JSON.parse(JSON.stringify(reconciliation.totalSales))
      : [{ id: Math.random().toString(), reconciliationId: reconciliation.id, description: 'Total Sales', amount: 0, currencyCode: 'USD', usdEquivalent: 0 }]
  );
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const currencies = rates.map((r: any) => r.currencyCode);

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...salesItems];
    newItems[index][field] = value;
    if (field === 'amount' || field === 'currencyCode') {
      const code = field === 'currencyCode' ? value : newItems[index].currencyCode;
      const amt = field === 'amount' ? value : newItems[index].amount;
      const rate = (rates || []).find((r: any) => r.currencyCode === code)?.rateToUsd || 1;
      newItems[index].usdEquivalent = parseFloat(amt) * rate;
    }
    setSalesItems(newItems);
  };

  const addItem = () => {
    setSalesItems([...salesItems, { id: Math.random().toString(), reconciliationId: reconciliation.id, description: 'Sales Entry', amount: 0, currencyCode: 'USD', usdEquivalent: 0 }]);
  };

  const removeItem = (idx: number) => {
    setSalesItems(salesItems.filter((_, i) => i !== idx));
  };

  const handleSave = async (confirmEntry: boolean = false) => {
    if (confirmEntry && !showConfirm) {
      setShowConfirm(true);
      return;
    }
    setLoading(true);
    try {
      const sumUsd = (val: any): number => {
        if (!val) return 0;
        if (Array.isArray(val)) return val.reduce((a: number, b: any) => a + (b.usdEquivalent || 0), 0);
        return val.usdEquivalent || 0;
      };

      const totalSalesUsd = salesItems.reduce((acc, curr) => acc + (curr.usdEquivalent || 0), 0);
      const totalIncome = totalSalesUsd + sumUsd(reconciliation.depositsReceived) + sumUsd(reconciliation.manualSalesToday);
      const tDeductions = sumUsd(reconciliation.debtors) + sumUsd(reconciliation.depositClaims) + sumUsd(reconciliation.returnsRefunds) +
                          sumUsd(reconciliation.expenses) + sumUsd(reconciliation.purchases) + sumUsd(reconciliation.manualSalesPrevious);

      const expected = totalIncome - tDeductions;
      const actCash = reconciliation.endOfDayCash?.usdEquivalent || 0;
      const variance = actCash - expected;

      await api.put(`/reconciliations/${reconciliation.id}`, { 
        totalSales: salesItems,
        expectedCashUsd: expected,
        varianceUsd: variance,
        ...(confirmEntry ? { salesConfirmed: true } : {}),
        salesInputtedBy: currentUser?.id,
        salesInputtedByName: currentUser?.name,
      });
      onUpdate();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="bg-[#0a192f] border border-[#1e345e] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
      >
        <div className="px-6 py-4 border-b border-[#1e345e] flex justify-between items-center bg-[#112240]">
          <h2 className="text-lg font-bold text-white tracking-tight">Input Total Sales (For Next Day)</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
        </div>
        
        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto space-y-4">
          <div className="bg-[#061121] p-3 rounded-lg border border-emerald-500/20 text-emerald-400 text-sm mb-4">
            Inputting total sales for reconciliation on <strong>{reconciliation.date}</strong>.
          </div>
          
          {salesItems.map((item, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row items-center gap-3">
              <input 
                type="text" 
                value={item.description} 
                onChange={e => handleItemChange(idx, 'description', e.target.value)}
                className="w-full sm:w-1/3 bg-[#061121] border border-[#1e345e] rounded-lg p-2 text-white text-sm"
                placeholder="Description (e.g. Sales)" 
              />
              <div className="flex gap-2 w-full sm:w-2/3">
                <input 
                  type="number" step="0.01" min="0"
                  value={item.amount === 0 && item.description === '' ? '' : item.amount} 
                  onChange={e => handleItemChange(idx, 'amount', e.target.value.replace(/^0+(?=\d)/, ''))}
                  className="w-full bg-[#061121] border border-[#1e345e] rounded-lg p-2 text-white text-sm text-right font-mono"
                  placeholder="Amount" 
                />
                <select 
                  value={item.currencyCode} 
                  onChange={e => handleItemChange(idx, 'currencyCode', e.target.value)}
                  className="w-24 bg-[#112240] border border-[#1e345e] rounded-lg p-2 text-white text-sm"
                >
                  {currencies.map((c: string) => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="w-24 text-right pt-2 text-slate-400 font-mono text-sm self-center">
                  ${(item.usdEquivalent || 0).toFixed(2)}
                </div>
                <button type="button" onClick={() => removeItem(idx)} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg shrink-0">
                  <AlertOctagon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addItem} className="text-emerald-400 text-sm font-bold mt-2 hover:underline">
            + Add Line Item
          </button>
        </div>

        <div className="p-4 border-t border-[#1e345e] bg-[#112240] flex justify-end gap-3 items-center">
          {showConfirm ? (
            <>
              <span className="text-rose-400 text-sm font-bold mr-auto">Are you sure? This action is permanent.</span>
              <button disabled={loading} onClick={() => setShowConfirm(false)} className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium transition-colors">Cancel</button>
              <button 
                disabled={loading}
                onClick={() => handleSave(true)} 
                className="px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Yes, Lock Sales
              </button>
            </>
          ) : (
            <>
              <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium transition-colors">Cancel</button>
              <button 
                disabled={loading}
                onClick={() => handleSave(false)} 
                className="px-6 py-2 bg-[#1e345e] hover:bg-[#2a457e] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Save Draft
              </button>
              <button 
                disabled={loading}
                onClick={() => handleSave(true)} 
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-[#0a192f] rounded-lg text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Confirm & Lock Sales
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
