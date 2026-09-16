import { safeFormat } from '../lib/formatDate';
import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { DailyReconciliation, Branch } from '../lib/types';
import { CashierShortageChart } from '../components/CashierShortageChart';
import { Search, ShieldAlert, Download, Building2, Calendar, FileText, ChevronDown, ChevronUp, AlertTriangle, AlertOctagon } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import { useAuth } from '../components/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { ReconModal } from '../components/ReconModal';

export function AuditorDashboard() {
  const [reconciliations, setReconciliations] = useState<DailyReconciliation[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [showExportModal, setShowExportModal] = useState(false);
  const [viewingRecon, setViewingRecon] = useState<any>(null);
  const [rates, setRates] = useState<any[]>([]);
  const [editingSalesId, setEditingSalesId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
            const [rtData, recData, brData] = await Promise.all([
        api.get('/rates'),
        api.get('/reconciliations'),
        api.get('/branches')
      ]);
      setRates(rtData);
      setReconciliations(recData);
      setBranches(brData);
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


  const markAsFlagged = async (id: string) => {
    try {
      await api.put(`/reconciliations/${id}`, { status: 'FLAGGED' });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const updateStatus = async (id: string, status: string, recon?: any) => {
    if (status === 'AMENDMENT_APPROVED' && recon) {
      const updates: any = { auditorAmendmentApproval: true };
      if (recon.accountantAmendmentApproval) {
        updates.status = 'AMENDMENT_APPROVED';
      }
      await api.put(`/reconciliations/${id}`, updates);
    } else {
      await api.put(`/reconciliations/${id}`, { status });
    }
    loadData();
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
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-sm font-medium text-white shadow-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Advanced Export
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
                  <tr className={clsx("hover:bg-[#112240]/50 transition-colors cursor-pointer")} onClick={() => setViewingRecon(r)}>
                    
                    <td className="px-6 py-4 font-medium text-white">{(branches || []).find(b => b.id === r.branchId)?.name || r.branchId}</td>
                    <td className="px-6 py-4 text-slate-300">
                      <div>{safeFormat(r.date || new Date(), 'MMM d, yyyy')}</div>
                      {r.salesInputtedByName && <div className="text-[10px] text-emerald-400 font-bold mt-1">Sales by: {r.salesInputtedByName}</div>}
                    </td>
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
                          Flag
                        </button>
                      )}
                      <button 
                          disabled={r.salesConfirmed}
                           onClick={(e) => { e.stopPropagation(); setEditingSalesId(r.id) }}
                          className={`px-3 py-1.5 ml-2 rounded transition-colors text-xs font-bold ${r.salesConfirmed ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400"}`}
                        >
                          {r.salesConfirmed ? 'Sales Locked' : 'Input Sales'}
                        </button>
                      {r.status === 'UNLOCK_REQUESTED' && (
                        <div className="flex gap-2 ml-2">
                          <button 
                             onClick={(e) => { e.stopPropagation(); updateStatus(r.id, 'UNLOCK_APPROVED')  }}
                            className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 rounded transition-colors text-xs font-bold"
                          >
                            Approve
                          </button>
                          <button 
                             onClick={(e) => { e.stopPropagation(); updateStatus(r.id, 'UNLOCK_DECLINED')  }}
                            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded transition-colors text-xs font-bold"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                      {r.status === 'AMENDMENT_REQUESTED' && !r.auditorAmendmentApproval && (
                        <button 
                           onClick={(e) => { e.stopPropagation(); updateStatus(r.id, 'AMENDMENT_APPROVED', r)  }}
                          className="px-3 py-1.5 ml-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded transition-colors text-xs font-bold"
                        >
                          Approve Amendment
                        </button>
                      )}
                    </td>
                  </tr>
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
      <CashierShortageChart reconciliations={filteredRecon} branches={branches} />
      {viewingRecon && <ReconModal recon={viewingRecon} onClose={() => setViewingRecon(null)} />}
        {editingSalesId && (
        <InputSalesModal 
          currentUser={user}
          reconciliation={(reconciliations || []).find(r => r.id === editingSalesId)} 
          rates={rates} 
          onClose={() => setEditingSalesId(null)}
          onUpdate={() => {
            setEditingSalesId(null);
            loadData();
          }}
        />
      )}
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

const BreakdownSection = ({ title, items }: { title: string, items: any }) => {
  const arr = Array.isArray(items) ? items : items ? [items] : [];
  if (arr.length === 0) return null;
  const total = arr.reduce((a:number,b:any)=>a+(b.usdEquivalent||0), 0);
  
  return (
    <div className="mb-4">
      <div className="flex justify-between font-medium text-slate-300 text-sm mb-2">
        <span>{title}</span>
        <span className="font-mono text-white">$${total.toFixed(2)}</span>
      </div>
      <div className="space-y-1.5 border-l-2 border-[#1e345e] ml-1 pl-3">
        {arr.map((item: any, idx: number) => (
          <div key={idx} className="flex justify-between text-xs">
            <span className="text-slate-400">
              {item.description || 'Unnamed'}{item.date ? ` [${item.date}]` : ""} {item.cashierName ? `(Cashier: ${item.cashierName})` : ""} 
              {(item.amount || item.amount === 0) && <span className="text-slate-500 ml-1">({item.amount} {item.currencyCode})</span>}
            </span>
            <span className="text-slate-300 font-mono">$${(item.usdEquivalent||0).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
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
      const totalSalesUsd = salesItems.reduce((acc, curr) => acc + (curr.usdEquivalent || 0), 0);
      
      const tDeductions = (Array.isArray(reconciliation.debtors) ? reconciliation.debtors.reduce((a:number,b:any)=>a+(b.usdEquivalent||0),0) : reconciliation.debtors?.usdEquivalent || 0) +
                          (Array.isArray(reconciliation.depositClaims) ? reconciliation.depositClaims.reduce((a:number,b:any)=>a+(b.usdEquivalent||0),0) : reconciliation.depositClaims?.usdEquivalent || 0) +
                          (Array.isArray(reconciliation.returnsRefunds) ? reconciliation.returnsRefunds.reduce((a:number,b:any)=>a+(b.usdEquivalent||0),0) : reconciliation.returnsRefunds?.usdEquivalent || 0) +
                          (Array.isArray(reconciliation.expenses) ? reconciliation.expenses.reduce((a:number,b:any)=>a+(b.usdEquivalent||0),0) : reconciliation.expenses?.usdEquivalent || 0) +
                          (Array.isArray(reconciliation.purchases) ? reconciliation.purchases.reduce((a:number,b:any)=>a+(b.usdEquivalent||0),0) : reconciliation.purchases?.usdEquivalent || 0);

      const totalDeposits = Array.isArray(reconciliation.depositsReceived) ? reconciliation.depositsReceived.reduce((a:number,b:any)=>a+(b.usdEquivalent||0),0) : reconciliation.depositsReceived?.usdEquivalent || 0;

      const expected = totalSalesUsd + totalDeposits - tDeductions;
      const actCash = reconciliation.endOfDayCash.usdEquivalent || 0;
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
