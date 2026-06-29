import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../components/AuthProvider';
import { api } from '../lib/api';
import { ExchangeRate, DailyReconciliation, ReconLineItem } from '../lib/types';
import { DollarSign, CheckCircle2, RotateCcw, AlertCircle, Plus, Trash2, X, PlusCircle, Activity } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

export function SupervisorDashboard() {
  const { user } = useAuth();
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [submitted, setSubmitted] = useState<DailyReconciliation | null>(null);
  const [history, setHistory] = useState<DailyReconciliation[]>([]);
  const [branch, setBranch] = useState<any>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isCashUpMode, setIsCashUpMode] = useState(false);
  const [showQuickLog, setShowQuickLog] = useState(false);

  const [qlCategory, setQlCategory] = useState('totalSales');
  const [qlDesc, setQlDesc] = useState('');
  const [qlInvoice, setQlInvoice] = useState('');
  const [qlAmount, setQlAmount] = useState('');
  const [qlCurr, setQlCurr] = useState('USD');

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const quickLogKey = `quick_logs_${user?.branchId}_${todayStr}`;
  const [quickLogs, setQuickLogs] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem(quickLogKey) || '[]'); } catch { return []; }
  });

  useEffect(() => {
    if (quickLogs.length > 0) {
      localStorage.setItem(quickLogKey, JSON.stringify(quickLogs));
    } else {
      localStorage.removeItem(quickLogKey);
    }
  }, [quickLogs, quickLogKey]);

  const loadData = async () => {
    try {
      const [ratesData, recsData, locsData] = await Promise.all([
        api.get('/rates'),
        api.get('/reconciliations'),
        user?.branchId ? api.get('/branches') : Promise.resolve([])
      ]);
      setRates(ratesData);
      if (user?.branchId && locsData) setBranch(locsData.find((b:any) => b.id === user.branchId));

      const branchRecs = recsData.filter((r: any) => r.branchId === user?.branchId);
      const todayRec = branchRecs.find((r: any) => r.date === date);
      setHistory(branchRecs.sort((a:any, b:any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      if (todayRec) setSubmitted(todayRec);
      else setSubmitted(null);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [date, user?.branchId]);

  if (!user?.branchId) return <div>No branch assigned. Please contact Administrator.</div>;

  const handleEditClick = () => {
    setIsEditing(true);
    setIsCashUpMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setIsCashUpMode(false);
  };

  const handleSaveQuickLog = () => {
    const amountNum = parseFloat(qlAmount) || 0;
    if (amountNum > 0 || qlDesc) {
      const rate = rates.find((r:any) => r.currencyCode === qlCurr)?.rateToUsd || 1;
      const newLog = {
        id: Math.random().toString(),
        category: qlCategory,
        description: qlDesc,
        invoiceNumber: qlInvoice,
        amount: qlAmount,
        currencyCode: qlCurr,
        usdEquivalent: amountNum * rate
      };
      setQuickLogs([...quickLogs, newLog]);
    }
    setShowQuickLog(false);
    setQlDesc('');
    setQlInvoice('');
    setQlAmount('');
  };

  const missingSalesRecs = history.filter(r => !r.salesConfirmed && r.date !== todayStr && r.status !== 'UNLOCK_REQUESTED' && r.status !== 'UNLOCK_APPROVED');
  const currentMissingSales = submitted && !submitted.salesConfirmed;
  const preventNewCashUp = !submitted && missingSalesRecs.length > 0;
  
  const completelyMissingDates = useMemo(() => {
    if (!history) return [];
    const missing = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dStr = format(d, 'yyyy-MM-dd');
      if (!history.some(r => r.date === dStr)) {
        missing.push(dStr);
      }
    }
    return missing;
  }, [history]);

  const requestUnlock = async (dStr: string) => {
    try {
      await api.post('/reconciliations', {
        branchId: user?.branchId,
        supervisorId: user?.id,
        date: dStr,
        status: 'UNLOCK_REQUESTED',
        expectedCashUsd: 0,
        varianceUsd: 0,
        totalSales: [],
        depositsReceived: [],
        debtors: [],
        depositClaims: [],
        returnsRefunds: [],
        expenses: [],
        purchases: [],
        endOfDayCash: null,
        tillCashBreakdown: [],
        salesConfirmed: false
      });
      loadData();
    } catch (e) {
      console.error('Failed to request unlock', e);
    }
  };

  const unlockRequestedRecs = history.filter(r => r.status === 'UNLOCK_REQUESTED');
  const unlockApprovedRecs = history.filter(r => r.status === 'UNLOCK_APPROVED');
  
  const [isEnteringSalesFor, setIsEnteringSalesFor] = useState<DailyReconciliation | null>(null);

  const startSalesEntry = (rec: DailyReconciliation) => setIsEnteringSalesFor(rec);
  
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#0a192f] rounded-xl p-6 border border-[#1e345e] shadow-lg gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Daily Cash-Up</h1>
          <p className="text-slate-400 text-sm mt-1">Branch Code: {user?.branchId}</p>
        </div>
        <div>
          <input type="date" value={date} onChange={e => { setDate(e.target.value); setIsEditing(false); }} 
            className="px-4 py-2 bg-[#061121] border border-[#1e345e] rounded-lg text-white font-medium focus:ring-emerald-500 focus:border-emerald-500" />
        </div>
      </div>

      {isEnteringSalesFor ? (
        <MissingSalesForm 
           recon={isEnteringSalesFor} 
           rates={rates} 
           branch={branch}
           onCancel={() => setIsEnteringSalesFor(null)} 
           onSuccess={() => { setIsEnteringSalesFor(null); loadData(); }} 
        />
      ) : completelyMissingDates.includes(date) && date !== todayStr ? (
        <div className="bg-[#0a192f] border border-rose-500/50 shadow-2xl rounded-2xl p-8 text-center ring-1 ring-inset ring-rose-500/10">
          <div className="mx-auto w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mb-4 border border-rose-500/50">
            <AlertCircle className="w-8 h-8 text-rose-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Missing Reconciliation</h2>
          <p className="text-slate-400 mb-8">You skipped the daily cash-up for {format(new Date(date), 'MMMM do, yyyy')}. You must request permission from the accountant to unlock this date.</p>
          <button 
            onClick={() => requestUnlock(date)}
            className="px-8 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-lg transition-colors"
          >
            Request Unlock
          </button>
        </div>
      ) : submitted && submitted.status === 'UNLOCK_REQUESTED' ? (
        <div className="bg-[#0a192f] border border-amber-500/50 shadow-2xl rounded-2xl p-8 text-center ring-1 ring-inset ring-amber-500/10">
          <div className="mx-auto w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4 border border-amber-500/50">
            <RotateCcw className="w-8 h-8 text-amber-400" animate-spin />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Unlock Requested</h2>
          <p className="text-slate-400 mb-8">Your request to unlock {format(new Date(date), 'MMMM do, yyyy')} is pending approval from the accountant.</p>
        </div>
      ) : (submitted && !isEditing && submitted.status !== 'UNLOCK_APPROVED') ? (
        <div className="bg-[#0a192f] border border-[#1e345e] shadow-2xl rounded-2xl p-8 text-center ring-1 ring-inset ring-emerald-500/10">
          <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 border border-emerald-500/50">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Reconciliation Submitted</h2>
          <p className="text-slate-400 mb-8">Your daily cash-up for {format(new Date(submitted.date), 'MMMM do, yyyy')} has been submitted and is currently <span className="font-semibold text-emerald-400">{submitted.status}</span>.</p>
          
          {currentMissingSales && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 mb-8 mt-4 shadow-inner max-w-sm mx-auto">
              <h3 className="text-lg font-bold text-blue-400 mb-2">Action Required</h3>
              <p className="text-sm text-blue-300 mb-4">Please enter the final sales generated from the system for this specific cash-up.</p>
              <button 
                onClick={() => startSalesEntry(submitted)}
                className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow-lg transition-colors flex items-center justify-center gap-2"
              >
                Enter System Sales
              </button>
            </div>
          )}

          <div className="bg-[#061121] rounded-xl p-6 text-left border border-[#1e345e] shadow-inner font-mono text-sm mb-6">
            <div className="flex justify-between mb-2"><span className="text-slate-500">Physical Cash:</span> <span className="text-white">${(submitted.endOfDayCash?.usdEquivalent || 0).toFixed(2)}</span></div>
            <div className="flex justify-between mb-2"><span className="text-slate-500">Expected Cash:</span> <span className="text-white">${(submitted.expectedCashUsd || 0).toFixed(2)}</span></div>
            <div className="border-t border-[#1e345e] my-2 pt-2 flex justify-between">
              <span className="text-slate-500">Variance:</span> 
              <span className={clsx("font-bold", submitted.varianceUsd > 0 ? "text-emerald-400" : submitted.varianceUsd < 0 ? "text-rose-400" : "text-blue-400")}>
                ${(submitted.varianceUsd || 0).toFixed(2)}
              </span>
            </div>
          </div>
          
          {submitted.amendmentNotes && submitted.amendmentNotes.length > 0 && (
            <div className="bg-[#061121] rounded-xl p-6 mb-6 text-left border border-[#1e345e]">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-[#1e345e] pb-2">Amendment History</h3>
              <div className="space-y-3">
                {submitted.amendmentNotes.map((note: string, idx: number) => (
                  <div key={idx} className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500/90 p-3 rounded-lg text-sm leading-relaxed font-medium">
                    {note}
                  </div>
                ))}
              </div>
            </div>
          )}

          {submitted.status === 'AMENDMENT_APPROVED' ? (
            <button 
              onClick={handleEditClick}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
            >
              Edit Submission
            </button>
          ) : submitted.status === 'AMENDMENT_REQUESTED' ? (
            <div className="px-6 py-2 bg-slate-800 text-slate-400 border border-[#1e345e] rounded-lg font-medium inline-block mx-auto">
              Amendment Requested (Waiting for Approval)
            </div>
          ) : (
            <button 
              onClick={async () => {
                await api.put(`/reconciliations/${submitted.id}`, { status: 'AMENDMENT_REQUESTED' });
                loadData();
              }}
              className="px-6 py-2 bg-[#112240] hover:bg-[#1a2d53] text-white border border-[#1e345e] rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2 mx-auto"
            >
              Request to Amend
            </button>
          )}
        </div>
      ) : isCashUpMode ? (
        <CashUpForm 
          branch={branch}
          branchId={user.branchId} 
          supervisorId={user.id} 
          date={date} 
          rates={rates} 
          existingData={isEditing || submitted?.status === 'UNLOCK_APPROVED' ? submitted : null}
          quickLogs={quickLogs}
          onClearLogs={() => setQuickLogs([])}
          onCancel={isEditing || submitted?.status === 'UNLOCK_APPROVED' ? handleCancelEdit : () => setIsCashUpMode(false)}
          onSuccess={() => { setIsEditing(false); setIsCashUpMode(false); loadData(); }} 
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
           <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl p-8 flex flex-col justify-center items-center text-center shadow-xl">
             <div className="w-16 h-16 bg-[#112240] rounded-full flex items-center justify-center mb-4 border border-[#1e345e]">
                <Activity className="w-8 h-8 text-emerald-400" />
             </div>
             <h2 className="text-2xl font-bold text-white mb-2">
               {submitted?.status === 'UNLOCK_APPROVED' ? 'Unlock Approved' : 'Shift Open'}
             </h2>
             <p className="text-slate-400 mb-6 max-w-sm text-sm">
               {submitted?.status === 'UNLOCK_APPROVED' 
                 ? 'You can now enter the cash-up for this unlocked date.' 
                 : 'When your shift is over, proceed to the daily cash-up to reconcile all records.'}
             </p>
             {preventNewCashUp ? (
               <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-400 text-sm mb-4">
                 <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                 You cannot start a new cash-up until you have entered the system sales for previous cash-ups. Please review your Submission History below.
               </div>
             ) : (
               <button onClick={() => {
                 if (submitted?.status === 'UNLOCK_APPROVED') setIsEditing(true);
                 setIsCashUpMode(true);
               }} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl shadow-lg transition-colors w-full max-w-xs">
                  {submitted?.status === 'UNLOCK_APPROVED' ? 'Fill Missing Cash-Up' : 'Start End-of-Day Cash-Up'}
               </button>
             )}
           </div>
           
           <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl p-8 flex flex-col shadow-xl">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-bold text-white">Quick Logs</h2>
               <button onClick={() => setShowQuickLog(true)} className="flex items-center gap-2 px-3 py-1.5 bg-[#112240] hover:bg-[#1a2d53] border border-[#1e345e] rounded-lg text-emerald-400 text-sm font-medium transition-colors shadow-sm">
                  <PlusCircle className="w-4 h-4" /> Log Now
               </button>
             </div>
             {quickLogs.length > 0 ? (
               <div className="flex-1 overflow-y-auto space-y-2 pr-2" style={{maxHeight: '220px'}}>
                 {quickLogs.map((log: any, idx: number) => (
                   <div key={idx} className="flex justify-between items-center bg-[#061121] p-3 rounded-lg border border-[#1e345e] group hover:border-[#112240] transition-colors">
                     <div>
                       <div className="text-slate-200 text-sm font-medium">{log.description || log.category}{log.invoiceNumber && <span className="ml-2 text-xs font-normal text-slate-400">Inv: {log.invoiceNumber}</span>}</div>
                       <div className="text-slate-500 text-xs mt-0.5">{log.amount} {log.currencyCode}</div>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="text-emerald-400 font-mono text-sm">${(item.usdEquivalent || 0).toFixed(2)}</div>
                        <button onClick={() => setQuickLogs(quickLogs.filter((_, i) => i !== idx))} className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-[#1e345e] rounded-xl bg-[#061121]/50">
                  <DollarSign className="w-8 h-8 text-slate-600 mb-2" />
                  <p className="text-slate-400 text-sm">No items logged yet.</p>
                  <p className="text-slate-500 text-xs mt-1">Click "Log Now" to record expenses or deposits during the day safely before cash-up.</p>
               </div>
             )}
           </div>
        </div>
      )}

      {/* Historical Submissions */}
      <div className="bg-[#0a192f] border border-[#1e345e] shadow-xl rounded-2xl overflow-hidden mt-12">
        <div className="px-6 py-4 bg-[#112240]/80 border-b border-[#1e345e]">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">Submission History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#061121] text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 text-right font-medium">Total Sales (USD)</th>
                <th className="px-6 py-4 text-right font-medium">End Cash (USD)</th>
                <th className="px-6 py-4 text-right font-medium">Variance (USD)</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e345e]">
              {history.map(r => (
                <tr key={r.id} className="hover:bg-[#112240]/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{format(new Date(r.date), 'MMM d, yyyy')}</td>
                  <td className="px-6 py-4 text-right text-slate-300">
                    ${(Array.isArray(r.totalSales) ? r.totalSales.reduce((a:number,b:any)=>a+(b.usdEquivalent||0),0) : (r.totalSales?.usdEquivalent || 0)).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-300">${(r.endOfDayCash?.usdEquivalent || 0).toFixed(2)}</td>
                  <td className={clsx("px-6 py-4 text-right font-bold", 
                    r.varianceUsd > 0 ? "text-emerald-400" :
                    r.varianceUsd < 0 ? "text-rose-400" : "text-blue-400"
                  )}>
                    {r.varianceUsd > 0 ? '+' : ''}{(r.varianceUsd || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <span className={clsx("px-2 py-1 rounded text-xs font-semibold", 
                        r.status === 'APPROVED' ? "bg-emerald-500/20 text-emerald-400" :
                        r.status === 'FLAGGED' ? "bg-rose-500/20 text-rose-400" :
                        "bg-amber-500/20 text-amber-400"
                      )}>
                        {r.status}
                      </span>
                      {!r.salesConfirmed && (
                        <button 
                          onClick={() => { setDate(r.date); loadData(); }} 
                          className="mt-1 px-2 py-1 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 text-[10px] uppercase font-bold rounded"
                        >
                          Missing Sales
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No historical submissions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Quick Log Modal */}
      {showQuickLog && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-4">Log Transaction</h3>
            <div className="space-y-4">
               <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
                  <select value={qlCategory} onChange={e => setQlCategory(e.target.value)} className="w-full bg-[#061121] border border-[#1e345e] rounded-lg p-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500">
                     <option value="totalSales">Sale</option>
                     <option value="depositsReceived">Deposit Received</option>
                     <option value="debtors">Debtor (Credit Sale)</option>
                     <option value="expenses">Expense / Petty Cash</option>
                     <option value="purchases">Purchase</option>
                     <option value="depositClaims">Deposit Claim</option>
                     <option value="returnsRefunds">Return / Refund</option>
                  </select>
               </div>
               <div>
                 <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                 <input type="text" value={qlDesc} onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }} onChange={e => setQlDesc(e.target.value)} placeholder="E.g. Paid debtor invoice" className="w-full bg-[#061121] border border-[#1e345e] rounded-lg p-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
               </div>
               <div>
                 <label className="block text-xs font-medium text-slate-400 mb-1">Invoice Number (Optional)</label>
                 <input type="text" value={qlInvoice} onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }} onChange={e => setQlInvoice(e.target.value)} placeholder="E.g. INV-2023-001" className="w-full bg-[#061121] border border-[#1e345e] rounded-lg p-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
               </div>
               <div>
                 <label className="block text-xs font-medium text-slate-400 mb-1">Amount</label>
                 <div className="flex border border-[#1e345e] rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-emerald-500">
                   <select value={qlCurr} onChange={e => setQlCurr(e.target.value)} className="bg-[#061121] px-2 py-2 text-emerald-400 border-r border-[#1e345e] focus:outline-none text-sm">
                     {rates.map(r => <option key={r.currencyCode} value={r.currencyCode}>{r.currencyCode}</option>)}
                   </select>
                   <input type="number" step="0.01" min="0" value={qlAmount} onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }} onChange={e => setQlAmount(e.target.value.replace(/^0+(?=\d)/, ''))} className="flex-1 bg-[#061121] px-3 py-2 text-white text-sm focus:outline-none" placeholder="0.00" />
                 </div>
               </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowQuickLog(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
              <button onClick={handleSaveQuickLog} className="px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-md font-medium transition-colors">Log Now</button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING ACTION COMPONENT */}
      {!isCashUpMode && (
        <button
          onClick={() => setShowQuickLog(true)}
          className="fixed bottom-8 right-8 bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-full shadow-[0_8px_30px_rgba(52,211,153,0.3)] transition-transform hover:scale-105 group flex items-center justify-center z-40"
          title="Quick Log Transaction"
        >
          <PlusCircle className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap pl-0 group-hover:pl-2 font-medium">
            Quick Log
          </span>
        </button>
      )}
    </div>
  );
}

function CashUpForm({ branch, branchId, supervisorId, date, rates, existingData, quickLogs = [], onClearLogs, onCancel, onSuccess }: any) {
  const currencies = rates.map((r: any) => r.currencyCode);
  
  const createItem = (desc: string): ReconLineItem => ({ id: Math.random().toString(), reconciliationId: '', description: desc, amount: 0, currencyCode: 'USD', usdEquivalent: 0 });
  
  const ensureArray = (item: any, defaultDescs: string[]): ReconLineItem[] => {
    if (!item) return defaultDescs.map(createItem);
    if (Array.isArray(item)) return item.length > 0 ? item : defaultDescs.map(createItem);
    return [{ ...item, description: item.description || defaultDescs[0] }];
  };
  
  const tillNames = (branch?.hasTills && branch.tills?.length > 0) 
    ? branch.tills.map((t:any) => t.name) 
    : ['Total Sales'];

  const cashTillNames = (branch?.hasTills && branch.tills?.length > 0)
    ? branch.tills.map((t:any) => `Cash: ${t.name}`)
    : ['End of Day Physical Cash Counted'];

  const [sales, setSales] = useState<ReconLineItem[]>(ensureArray(existingData?.totalSales, tillNames));
  const [deposits, setDeposits] = useState<ReconLineItem[]>(ensureArray(existingData?.depositsReceived, ['Deposits Received']));
  const [debtors, setDebtors] = useState<ReconLineItem[]>(ensureArray(existingData?.debtors, ['Debtors (Credit Sales)']));
  const [depositClaims, setDepositClaims] = useState<ReconLineItem[]>(ensureArray(existingData?.depositClaims, ['Deposit Claims']));
  const [returns, setReturns] = useState<ReconLineItem[]>(ensureArray(existingData?.returnsRefunds, ['Returns / Refunds']));
  const [expenses, setExpenses] = useState<ReconLineItem[]>(existingData?.expenses?.length > 0 ? existingData.expenses : [createItem('')]);
  const [purchases, setPurchases] = useState<ReconLineItem[]>(existingData?.purchases?.length > 0 ? existingData.purchases : [createItem('')]);
  const [cashBreakdown, setCashBreakdown] = useState<ReconLineItem[]>(existingData?.tillCashBreakdown || ensureArray(undefined, cashTillNames));
  const [notes, setNotes] = useState(existingData?.notes || '');
  const [signature, setSignature] = useState(existingData?.signature || '');
  const [showPreview, setShowPreview] = useState(false);

  const [hasInitialized, setHasInitialized] = useState(false);
  const prevIdRef = useRef<string | undefined>(undefined);
  
  useEffect(() => {
    if (hasInitialized && existingData?.id === prevIdRef.current) return;

    if (existingData) {
      setSales(ensureArray(existingData.totalSales, tillNames));
      setDeposits(ensureArray(existingData.depositsReceived, ['Deposits Received']));
      setDebtors(ensureArray(existingData.debtors, ['Debtors (Credit Sales)']));
      setDepositClaims(ensureArray(existingData.depositClaims, ['Deposit Claims']));
      setReturns(ensureArray(existingData.returnsRefunds, ['Returns / Refunds']));
      setExpenses(existingData.expenses?.length > 0 ? existingData.expenses : [createItem('')]);
      setPurchases(existingData.purchases?.length > 0 ? existingData.purchases : [createItem('')]);
      setCashBreakdown(existingData.tillCashBreakdown || ensureArray(undefined, cashTillNames));
      setNotes(existingData.notes || '');
      setSignature(existingData.signature || '');
      prevIdRef.current = existingData.id;
      setHasInitialized(true);
    } else {
      const getLogs = (cat: string) => quickLogs.filter((l: any) => l.category === cat);
      
      const salesLog = getLogs('totalSales');
      setSales(salesLog.length > 0 ? salesLog : ensureArray(undefined, tillNames));
      
      const depsLog = getLogs('depositsReceived');
      setDeposits(depsLog.length > 0 ? depsLog : [createItem('Deposits Received')]);
      
      const debtLog = getLogs('debtors');
      setDebtors(debtLog.length > 0 ? debtLog : [createItem('Debtors (Credit Sales)')]);
      
      const depClLog = getLogs('depositClaims');
      setDepositClaims(depClLog.length > 0 ? depClLog : [createItem('Deposit Claims')]);
      
      const retLog = getLogs('returnsRefunds');
      setReturns(retLog.length > 0 ? retLog : [createItem('Returns / Refunds')]);
      
      const expLogs = getLogs('expenses');
      setExpenses(expLogs.length > 0 ? expLogs : [createItem('')]);

      const purLogs = getLogs('purchases');
      setPurchases(purLogs.length > 0 ? purLogs : [createItem('')]);

      setCashBreakdown(ensureArray(undefined, cashTillNames));
      setNotes('');
      setSignature('');
      prevIdRef.current = undefined;
      setHasInitialized(true);
    }
  }, [existingData?.id, hasInitialized]);

  const getUsd = (amount: number, code: string) => {
    const rate = rates.find((r: any) => r.currencyCode === code)?.rateToUsd || 1;
    return amount * rate;
  };

  const handleSingleItemChange = (setter: any, item: ReconLineItem, field: string, value: any) => {
    const updated = { ...item, [field]: value };
    if (field === 'amount') {
      updated.usdEquivalent = getUsd(parseFloat(value) || 0, updated.currencyCode);
    } else {
      updated.usdEquivalent = getUsd(parseFloat(item.amount as string) || 0, updated.currencyCode);
    }
    setter((prev: any[]) => prev.map(p => p.id === item.id ? updated : p));
  };

  const getSum = (arr: any) => {
    if (!arr) return 0;
    if (Array.isArray(arr)) return arr.reduce((a: number, b: any) => a + b.usdEquivalent, 0);
    return arr.usdEquivalent || 0;
  };

  const calcTotals = () => {
    const cashTotalUsd = getSum(cashBreakdown);
    const tSales = getSum(sales) + getSum(deposits);
    const tDeductions = getSum(debtors) + getSum(depositClaims) + getSum(returns) 
                      + getSum(expenses)
                      + getSum(purchases);
    const expected = tSales - tDeductions;
    const variance = cashTotalUsd - expected;
    return { expected, variance, cashTotalUsd };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPreview(true);
  };

  const handleConfirmSubmit = async () => {
    const { expected, variance, cashTotalUsd } = calcTotals();
    
    // Create an aggregate endOfDayCash item
    const endOfDayCash: ReconLineItem = {
      id: Math.random().toString(),
      reconciliationId: '',
      description: 'End of Day Physical Cash Total',
      amount: cashTotalUsd, // roughly
      currencyCode: 'USD',
      usdEquivalent: cashTotalUsd,
    };

    const payload: any = {
      branchId, supervisorId, date,
      totalSales: sales, depositsReceived: deposits,
      debtors, returnsRefunds: returns, depositClaims, 
      expenses: expenses.filter((e:any) => e.description || parseFloat(e.amount) > 0), 
      purchases: purchases.filter((e:any) => e.description || parseFloat(e.amount) > 0),
      endOfDayCash, 
      tillCashBreakdown: cashBreakdown,
      expectedCashUsd: expected, varianceUsd: variance, status: 'PENDING',
      notes, signature, salesConfirmed: existingData?.salesConfirmed || false
    };

    if (existingData?.id) {
      let diffLog = '';
      const compareSum = (name: string, oldVal: any, newVal: any) => {
        const o = getSum(oldVal);
        const n = getSum(newVal);
        if (Math.abs(o - n) > 0.01) {
          diffLog += `${name} from $${o.toFixed(2)} to $${n.toFixed(2)}. `;
        }
      };

      const oldCash = existingData.endOfDayCash?.usdEquivalent || 0;
      if (Math.abs(oldCash - cashTotalUsd) > 0.01) {
        diffLog += `Physical Cash from $${oldCash.toFixed(2)} to $${cashTotalUsd.toFixed(2)}. `;
      }
      compareSum('Sales', existingData.totalSales, sales);
      compareSum('Deposits', existingData.depositsReceived, deposits);
      compareSum('Expenses', existingData.expenses, expenses);
      compareSum('Returns', existingData.returnsRefunds, returns);
      compareSum('Debtors', existingData.debtors, debtors);
      compareSum('Deposit Claims', existingData.depositClaims, depositClaims);
      compareSum('Purchases', existingData.purchases, purchases);

      if (diffLog.length > 0) {
        payload.amendmentNotes = [...(existingData.amendmentNotes || []), `[${new Date().toLocaleString()}] Amendment: ${diffLog}`];
      } else {
        payload.amendmentNotes = existingData.amendmentNotes || [];
      }
    }

    try {
      if (existingData?.id) {
        await api.put(`/reconciliations/${existingData.id}`, payload);
      } else {
        await api.post('/reconciliations', payload);
      }
      onClearLogs?.();
      onSuccess();
    } catch (e) {
      console.error("Submission failed", e);
    }
  };

  const { expected, variance, cashTotalUsd } = calcTotals();

  if (showPreview) {
    return (
      <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl overflow-hidden shadow-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6 border-b border-[#1e345e] pb-4">Review Your Submission</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 text-sm">
            <div>
              <h3 className="text-emerald-400 font-bold mb-4 uppercase tracking-wider text-xs border-b border-[#1e345e] pb-2">Income Details</h3>
              <div className="space-y-4 pt-2">
                 <PreviewList title="Sales" items={sales} />
                 <PreviewList title="Deposits Received" items={deposits} />
              </div>
            </div>
            <div>
              <h3 className="text-rose-400 font-bold mb-4 uppercase tracking-wider text-xs border-b border-[#1e345e] pb-2">Deduction Details</h3>
              <div className="space-y-4 pt-2">
                 <PreviewList title="Debtors (Credit Sales)" items={debtors} />
                 <PreviewList title="Deposit Claims" items={depositClaims} />
                 <PreviewList title="Returns / Refunds" items={returns} />
                 <PreviewList title="Expenses" items={expenses} />
                 <PreviewList title="Purchases" items={purchases} />
              </div>
            </div>
          </div>
          
          <div className="mb-8">
              <h3 className="text-blue-400 font-bold mb-4 uppercase tracking-wider text-xs border-b border-[#1e345e] pb-2">Physical Cash Breakdown</h3>
              <div className="flex flex-col gap-4 pt-2">
                 <PreviewList title="Cash by Till" items={cashBreakdown} />
              </div>
          </div>

          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#1e345e] rounded-xl bg-[#061121] overflow-hidden divide-y md:divide-y-0 md:divide-x divide-[#1e345e]">
            <div className="p-4 text-center">
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Expected Cash</div>
              <div className="text-2xl font-mono text-white">${expected.toFixed(2)}</div>
            </div>
            <div className="p-4 text-center">
               <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Physical Cash Count</div>
               <div className="text-2xl font-mono text-white">${cashTotalUsd.toFixed(2)}</div>
            </div>
            <div className="p-4 text-center">
               <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Variance</div>
               <div className={clsx("text-2xl font-mono font-bold drop-shadow-md", variance > 0 ? "text-emerald-400" : variance < 0 ? "text-rose-400" : "text-blue-400")}>
                  {variance > 0 ? '+' : ''}{variance.toFixed(2)}
               </div>
            </div>
          </div>

          <div className="text-sm bg-[#112240] p-6 rounded-xl border border-[#1e345e] mb-8">
            <h3 className="text-slate-400 font-bold mb-4 uppercase tracking-wider text-xs">Verification Details</h3>
            <div className="mb-4">
              <div className="text-xs text-slate-500 mb-1">Additional Notes</div>
              <div className="text-slate-300 bg-[#061121] p-3 rounded-lg border border-[#1e345e] min-h-[3rem]">{notes || <span className="italic opacity-50">No notes provided</span>}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Digitally Signed By</div>
              <div className="text-2xl text-emerald-400 font-serif italic border-l-2 border-emerald-500/50 pl-3">{signature}</div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end gap-4 mt-8 pt-6 border-t border-[#1e345e]">
            <button 
              type="button" 
              onClick={() => setShowPreview(false)}
              className="px-8 py-3 bg-[#112240] hover:bg-[#1a2d53] text-white font-medium rounded-xl border border-[#1e345e] transition-all"
            >
              Back to Edit
            </button>
            <button 
              type="button"
              onClick={handleConfirmSubmit} 
              className="flex items-center justify-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:shadow-[0_0_30px_rgba(52,211,153,0.5)] transition-all"
            >
              <CheckCircle2 className="w-5 h-5" /> Confirm & Submit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 1. PHYSICAL CASH */}
      <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl overflow-hidden shadow-xl">
         <div className="px-6 py-4 bg-[#112240]/80 border-b border-[#1e345e] flex justify-between items-center">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2"><Activity className="text-blue-400 w-5 h-5"/> Physical Cash Count</h2>
          </div>
          <div className="p-6 space-y-4">
            <ReconListField title="Physical Cash Breakdown" items={cashBreakdown} setItems={setCashBreakdown} currencies={currencies} getUsd={getUsd} showCashierName={true} />
          </div>
      </div>

      {/* 2. INCOME */}
      <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 bg-[#112240]/80 border-b border-[#1e345e]">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2"><PlusCircle className="text-emerald-400 w-5 h-5"/> Income</h2>
        </div>
        <div className="p-6 space-y-8">
          <ReconListField title="Deposits Received" items={deposits} setItems={setDeposits} currencies={currencies} getUsd={getUsd} />
        </div>
      </div>

      {/* 3. DEDUCTIONS */}
      <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 bg-[#112240]/80 border-b border-[#1e345e]">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2"><DollarSign className="text-rose-400 w-5 h-5"/> Deductions</h2>
        </div>
        <div className="p-6 space-y-8">
          <ReconListField title="Debtors (Credit Sales)" items={debtors} setItems={setDebtors} currencies={currencies} getUsd={getUsd} />
          <ReconListField title="Deposit Claims" items={depositClaims} setItems={setDepositClaims} currencies={currencies} getUsd={getUsd} />
          <ReconListField title="Returns / Refunds" items={returns} setItems={setReturns} currencies={currencies} getUsd={getUsd} />
          <ReconListField title="Operational Expenses" items={expenses} setItems={setExpenses} currencies={currencies} getUsd={getUsd} />
          <ReconListField title="Purchases" items={purchases} setItems={setPurchases} currencies={currencies} getUsd={getUsd} />
        </div>
      </div>

      {/* 4. NOTES & SIGNATURE */}
      <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl overflow-hidden shadow-xl">
         <div className="px-6 py-4 bg-[#112240]/80 border-b border-[#1e345e] flex justify-between items-center">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">Notes & Verification</h2>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Additional Notes (Optional)</label>
              <textarea 
                value={notes} 
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-[#061121] border border-[#1e345e] rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-y min-h-[100px]"
                placeholder="Any explanations for variances..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Digital Signature <span className="text-rose-500">*</span></label>
              <p className="text-xs text-slate-500 mb-2">Type your full name to electronically sign this reconciliation.</p>
              <input 
                type="text" 
                required
                value={signature}
                onChange={e => setSignature(e.target.value)}
                className="w-full bg-[#061121] border border-[#1e345e] rounded-lg p-3 text-white font-serif italic text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="Your Full Name"
              />
            </div>
          </div>
      </div>

      {/* SUMMARY */}
      <div className="bg-gradient-to-br from-[#112240] to-[#0a192f] border border-[#1e345e] rounded-xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-blue-500 to-rose-400" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-[#1e345e]">
          <div className="px-4">
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Expected Cash</div>
            <div className="text-3xl font-mono text-white">${expected.toFixed(2)}</div>
          </div>
          <div className="px-4 pt-6 md:pt-0">
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Physical Cash</div>
            <div className="text-3xl font-mono text-white">${cashTotalUsd.toFixed(2)}</div>
          </div>
          <div className="px-4 pt-6 md:pt-0">
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Variance</div>
            <div className={clsx("text-4xl font-mono font-bold drop-shadow-lg scale-110", 
              variance > 0 ? "text-emerald-400" : variance < 0 ? "text-rose-400" : "text-blue-400"
            )}>
              {variance > 0 ? '+' : ''}{variance.toFixed(2)}
            </div>
            {variance !== 0 && (
              <div className={clsx("text-xs font-semibold mt-2 uppercase tracking-widest", variance > 0 ? "text-emerald-500" : "text-rose-500")}>
                {variance > 0 ? 'Surplus' : 'Shortage'}
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row justify-end gap-4">
          {onCancel && (
            <button 
              type="button" 
              onClick={onCancel}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-[#112240] hover:bg-[#1a2d53] text-white font-medium rounded-xl border border-[#1e345e] transition-all"
            >
              Cancel
            </button>
          )}
          <button type="submit" className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all">
            Review Submission
          </button>
        </div>
      </div>
    </form>
  );
}

function MissingSalesForm({ recon, rates, branch, onCancel, onSuccess }: any) {
  const currencies = rates.map((r: any) => r.currencyCode);
  const getUsd = (amount: number, code: string) => {
    const rate = rates.find((r: any) => r.currencyCode === code)?.rateToUsd || 1;
    return amount * rate;
  };
  const createItem = (desc: string): ReconLineItem => ({ id: Math.random().toString(), reconciliationId: '', description: desc, amount: 0, currencyCode: 'USD', usdEquivalent: 0 });
  
  const tillNames = (branch?.hasTills && branch.tills?.length > 0) 
    ? branch.tills.map((t:any) => t.name) 
    : ['Total Sales'];

  const ensureArray = (item: any, defaultDescs: string[]): ReconLineItem[] => {
    if (!item) return defaultDescs.map(createItem);
    if (Array.isArray(item)) return item.length > 0 ? item : defaultDescs.map(createItem);
    return [{ ...item, description: item.description || defaultDescs[0] }];
  };

  const [sales, setSales] = useState<ReconLineItem[]>(ensureArray(recon.totalSales, tillNames));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedTotalSales = sales;
      // We also need to recalculate expected cash and variance if we change sales!
      const getSum = (arr: any) => {
        if (!arr) return 0;
        if (Array.isArray(arr)) return arr.reduce((a: number, b: any) => a + b.usdEquivalent, 0);
        return arr.usdEquivalent || 0;
      };
      
      const tSales = getSum(updatedTotalSales) + getSum(recon.depositsReceived);
      const tDeductions = getSum(recon.debtors) + getSum(recon.depositClaims) + getSum(recon.returnsRefunds) 
                        + getSum(recon.expenses)
                        + getSum(recon.purchases);
      const expected = tSales - tDeductions;
      const cashTotalUsd = recon.endOfDayCash?.usdEquivalent || 0;
      const variance = cashTotalUsd - expected;

      await api.put(`/reconciliations/${recon.id}`, {
        totalSales: updatedTotalSales,
        expectedCashUsd: expected,
        varianceUsd: variance,
        salesConfirmed: true
      });
      onSuccess();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-[#0a192f] border border-blue-500/30 rounded-xl overflow-hidden shadow-2xl">
       <div className="px-6 py-4 bg-blue-500/10 border-b border-blue-500/20">
         <h2 className="text-xl font-bold text-blue-400">Enter System Sales</h2>
         <p className="text-sm text-blue-300/70 mt-1">For cash up Date: {format(new Date(recon.date), 'MMMM do, yyyy')}</p>
       </div>
       <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-[#061121]">
         <ReconListField title="Total Sales (from POS System)" items={sales} setItems={setSales} currencies={currencies} getUsd={getUsd} />
         
         <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-[#1e345e]">
            <button type="button" onClick={onCancel} className="px-6 py-2 bg-[#112240] hover:bg-[#1a2d53] text-slate-300 font-medium rounded-xl border border-[#1e345e] transition-all">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all">Confirm & Save Sales</button>
         </div>
       </form>
    </div>
  );
}

function ReconField({ label, item, setter, currencies, onChange, showCashierName }: any) {
  return (
    <div className="flex flex-col gap-4 bg-[#112240] p-4 rounded-xl border border-[#1e345e]">
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{label}</label>
          <div className="flex rounded-lg shadow-sm border border-[#1e345e] overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/50">
            <select 
              value={item.currencyCode} 
              onChange={e => onChange(setter, item, 'currencyCode', e.target.value)}
              className="bg-[#061121] py-2 px-3 text-emerald-400 border-r border-[#1e345e] focus:outline-none"
            >
              {currencies.map((c: string) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input 
              type="number" step="0.01" min="0"
              value={item.amount === 0 ? '' : item.amount}
              onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
              onChange={e => onChange(setter, item, 'amount', e.target.value.replace(/^0+(?=\d)/, ''))}
              className="flex-1 bg-[#061121] px-4 py-2 text-white focus:outline-none"
              placeholder="0.00"
            />
          </div>
        </div>
        <div className="w-full sm:w-32 bg-[#061121] border border-[#1e345e] px-4 py-2 rounded-lg flex items-center justify-between text-sm h-10 shadow-inner">
          <span className="text-slate-500">USD</span>
          <span className="text-emerald-400 font-medium">${(item.usdEquivalent || 0).toFixed(2)}</span>
        </div>
      </div>
      {showCashierName && (
        <div className="w-full sm:w-1/2">
          <input 
            type="text" 
            placeholder="Cashier Name"
            value={item.cashierName || ''}
            onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
            onChange={e => onChange(setter, item, 'cashierName', e.target.value)}
            className="w-full bg-[#061121] border border-[#1e345e] px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-lg"
          />
        </div>
      )}
    </div>
  );
}

function ReconListField({ title, items, setItems, currencies, getUsd, showCashierName }: any) {
  const createItem = (desc: string) => ({ id: Math.random().toString(), description: desc, amount: 0, currencyCode: 'USD', usdEquivalent: 0 });
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">{title}</h3>
        <button type="button" onClick={() => setItems([...items, createItem('')])} className="text-xs flex items-center gap-1 bg-[#061121] hover:bg-[#1e345e] border border-[#1e345e] px-3 py-1.5 rounded-lg text-emerald-400 font-medium transition-colors">
          <PlusCircle className="w-3.5 h-3.5"/> Add
        </button>
      </div>
      <div className="space-y-3">
        {items.length === 0 && <div className="text-sm text-slate-500 italic p-3 bg-[#061121] rounded-xl border border-[#1e345e]">No records.</div>}
        {items.map((item: any, idx: number) => (
          <div key={item.id || idx} className="flex flex-col sm:flex-row gap-4 items-end bg-[#112240] p-4 rounded-xl border border-[#1e345e]">
            <div className="flex-1 w-full">
              <input type="text" value={item.description} onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }} onChange={e => {
                const newArr = [...items];
                newArr[idx].description = e.target.value;
                setItems(newArr);
              }} placeholder="Description..." className="w-full bg-transparent text-sm text-white focus:outline-none mb-1 font-medium" />
              <input type="text" value={item.invoiceNumber || ''} onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }} onChange={e => {
                const newArr = [...items];
                newArr[idx].invoiceNumber = e.target.value;
                setItems(newArr);
              }} placeholder="Invoice # (Optional)..." className="w-full bg-transparent text-xs text-slate-400 focus:outline-none mb-2" />
              {showCashierName && (
                <input type="text" value={item.cashierName || ''} onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }} onChange={e => {
                  const newArr = [...items];
                  newArr[idx].cashierName = e.target.value;
                  setItems(newArr);
                }} placeholder="Cashier Name (Optional)..." className="w-full bg-transparent text-xs text-blue-300 focus:outline-none mb-2" />
              )}
              <div className="flex rounded-lg shadow-sm border border-[#1e345e] overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/50">
                <select value={item.currencyCode} onChange={e => {
                  const newArr = [...items];
                  newArr[idx].currencyCode = e.target.value;
                  newArr[idx].usdEquivalent = getUsd(newArr[idx].amount || 0, e.target.value);
                  setItems(newArr);
                }} className="bg-[#061121] py-2 px-3 text-emerald-400 border-r border-[#1e345e] focus:outline-none">
                  {currencies.map((c: string) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="number" step="0.01" min="0" value={item.amount === 0 && item.description === '' ? '' : item.amount} onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }} onChange={e => {
                  const newArr = [...items];
                  const rawVal = e.target.value.replace(/^0+(?=\d)/, '');
                  newArr[idx].amount = rawVal;
                  newArr[idx].usdEquivalent = getUsd(parseFloat(rawVal) || 0, newArr[idx].currencyCode);
                  setItems(newArr);
                }} className="flex-1 bg-[#061121] px-4 py-2 text-white focus:outline-none" placeholder="0.00" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-full sm:w-32 bg-[#061121] border border-[#1e345e] px-4 py-2 rounded-lg flex items-center justify-between text-sm h-10 shadow-inner">
                <span className="text-slate-500">USD</span>
                <span className="text-emerald-400 font-medium">${(item.usdEquivalent || 0).toFixed(2)}</span>
              </div>
              <button type="button" onClick={() => setItems(items.filter((_: any, i: number) => i !== idx))} className="h-10 px-3 text-rose-500 hover:text-rose-400 p-2">
                 <Trash2 className="w-4 h-4"/>
              </button>
            </div>
          </div>
        ))}
      </div>
      {items.length > 0 && <div className="text-right text-sm text-slate-400 mt-2 px-2 border-t border-[#1e345e] pt-2">Total {title}: <span className="text-white font-mono text-base">${items.reduce((a:any,b:any)=>a+(b.usdEquivalent||0),0).toFixed(2)}</span></div>}
    </div>
  );
}

function PreviewList({ title, items }: { title: string, items: any[] }) {
  if (!items || items.length === 0) return null;
  const total = items.reduce((a,b)=>a+(b.usdEquivalent||0), 0);
  if (total === 0 && items.length === 1 && !items[0].description) return null; // hide if just 1 zero item
  const validItems = items.filter(i => i.amount > 0 || i.description);
  if (validItems.length === 0) return null;
  
  return (
    <div className="bg-[#061121] rounded-lg border border-[#1e345e] overflow-hidden">
       <div className="bg-[#112240] px-3 py-2 flex justify-between items-center text-xs font-bold text-slate-300">
         <span>{title}</span>
         <span className="font-mono text-white">${total.toFixed(2)}</span>
       </div>
       <div className="p-3 space-y-2">
         {validItems.map((item, idx) => (
           <div key={idx} className="flex justify-between text-xs">
             <span className="text-slate-400">
               {item.description || 'Unnamed'}
               {item.cashierName && <span className="text-blue-400 font-medium ml-1"> (Cashier: {item.cashierName})</span>}
               {item.invoiceNumber && <span className="text-slate-500 font-normal ml-1"> (Inv: {item.invoiceNumber})</span>}
               {(item.amount > 0 || item.amount === '0') && <span className="text-slate-500 ml-1"> [{item.amount} {item.currencyCode}]</span>}
             </span>
             <span className="text-white font-mono">${(item.usdEquivalent || 0).toFixed(2)}</span>
           </div>
         ))}
       </div>
    </div>
  );
}
