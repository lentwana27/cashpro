import React from 'react';
import { useAuth } from '../components/AuthProvider';
import { useState } from 'react';
import { api } from '../lib/api';
import { Check, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import clsx from 'clsx';

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
              {item.description || 'Unnamed'}{item.date ? ` [${item.date}]` : ""} 
              {(item.amount || item.amount === 0) && <span className="text-slate-500 ml-1">({item.amount} {item.currencyCode})</span>}
            </span>
            <span className="text-slate-300 font-mono">${(item.usdEquivalent||0).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReconModal({ recon, onClose }: { recon: any, onClose: () => void }) {
  const { user } = useAuth();
  const [localRecon, setLocalRecon] = useState(recon);
  const [editingNoteIdx, setEditingNoteIdx] = useState<number | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [saving, setSaving] = useState(false);

  const saveNote = async (idx: number) => {
    try {
      setSaving(true);
      const newVariances = [...localRecon.tillVariances];
      newVariances[idx].note = noteInput;
      
      const updated = await api.put(`/reconciliations/${localRecon.id}`, {
        tillVariances: newVariances
      });
      
      setLocalRecon(updated);
      setEditingNoteIdx(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!localRecon) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0a192f] border border-[#1e345e] rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto">
        <div className="p-6 border-b border-[#1e345e] flex justify-between items-center sticky top-0 bg-[#0a192f] z-10">
          <div>
            <h2 className="text-xl font-bold text-white">Reconciliation Details</h2>
            <p className="text-sm text-slate-400 mt-1">{format(new Date(localRecon.date), 'MMMM dd, yyyy')} - <span className="font-mono text-emerald-400">{localRecon.status}</span></p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white bg-[#112240] p-2 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#061121]">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-[#1e345e] pb-2">Income breakdown</h4>
            <div className="space-y-4">
              <BreakdownSection title="Total Sales" items={localRecon.totalSales} />
              <BreakdownSection title="Deposits Received" items={localRecon.depositsReceived} />
              <BreakdownSection title="Manual Sales Not Captured Today" items={localRecon.manualSalesToday} />
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-[#1e345e] pb-2">Deductions breakdown</h4>
            <div className="space-y-4">
              <BreakdownSection title="Debtors" items={localRecon.debtors} />
              <BreakdownSection title="Deposit Claims" items={localRecon.depositClaims} />
              <BreakdownSection title="Returns / Refunds" items={localRecon.returnsRefunds} />
              <BreakdownSection title="Expenses" items={localRecon.expenses} />
              <BreakdownSection title="Purchases" items={localRecon.purchases} />
              <BreakdownSection title="Manual Sales for Previous Days" items={localRecon.manualSalesPrevious} />
            </div>
          </div>
        </div>
        
        
        {localRecon.tillVariances && localRecon.tillVariances.length > 0 && (
          <div className="px-6 pb-6 bg-[#061121]">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-[#1e345e] pb-2">Till Variances</h4>
            <div className="space-y-4">
              {localRecon.tillVariances.map((tv: any, idx: number) => (
                <div key={idx} className="bg-[#112240] border border-[#1e345e] rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-white">{tv.tillName}</div>
                      <div className="text-sm text-slate-400">Cashier: {tv.cashierName}</div>
                    </div>
                    <div className="text-right">
                      <div className={clsx("font-bold font-mono", (tv.variance || 0) > 0 ? "text-emerald-400" : (tv.variance || 0) < 0 ? "text-rose-400" : "text-blue-400")}>
                        {(tv.variance || 0) > 0 ? '+' : ''}{(tv.variance || 0).toFixed(2)} USD
                      </div>
                      <div className="text-xs text-slate-500">
                        Expected: ${(tv.expected || 0).toFixed(2)} | Actual: ${(tv.actual || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  {editingNoteIdx === idx ? (
                    <div className="mt-3 flex gap-2">
                      <input 
                        type="text" 
                        value={noteInput} 
                        onChange={(e) => setNoteInput(e.target.value)} 
                        placeholder="Add contextual note to explain this variance..."
                        className="flex-1 bg-[#061121] border border-[#1e345e] text-white text-sm p-2 rounded focus:outline-none focus:border-blue-500"
                      />
                      <button 
                        onClick={() => saveNote(idx)}
                        disabled={saving}
                        className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors flex items-center justify-center disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3">
                      {tv.note ? (
                        <div className="flex items-start justify-between gap-4 text-sm bg-[#061121]/50 p-2.5 rounded border border-[#1e345e]/50">
                          <div className="text-slate-300 italic">"{tv.note}"</div>
                          {(user?.role === 'SUPERVISOR' || user?.role === 'ADMIN') && (
                            <button onClick={() => { setEditingNoteIdx(idx); setNoteInput(tv.note); }} className="text-slate-500 hover:text-blue-400 transition-colors shrink-0">
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ) : (
                        (user?.role === 'SUPERVISOR' || user?.role === 'ADMIN') && (
                          <button 
                            onClick={() => { setEditingNoteIdx(idx); setNoteInput(''); }}
                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            + Add Contextual Note
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {localRecon.tillCashBreakdown && localRecon.tillCashBreakdown.length > 0 && (
          <div className="px-6 pb-6 bg-[#061121]">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-[#1e345e] pb-2">Physical Cash Breakdown</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <BreakdownSection title="Physical Cash Counted" items={localRecon.tillCashBreakdown} />
              </div>
            </div>
          </div>
        )}

        <div className="p-6 bg-[#0a192f] border-t border-[#1e345e]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
            <div>
              <div className="text-slate-500 mb-1 text-xs uppercase tracking-wider">Expected Cash</div>
              <div className="text-slate-300 text-lg">${(localRecon.expectedCashUsd || 0).toFixed(2)}</div>
            </div>
            <div>
              <div className="text-slate-500 mb-1 text-xs uppercase tracking-wider">Physical Cash Count</div>
              <div className="text-white font-bold text-lg">${(localRecon.endOfDayCash?.usdEquivalent || 0).toFixed(2)}</div>
            </div>
            <div>
              <div className="text-slate-500 mb-1 text-xs uppercase tracking-wider">Variance</div>
              <div className={clsx("font-bold text-lg", localRecon.varianceUsd > 0 ? "text-emerald-400" : localRecon.varianceUsd < 0 ? "text-rose-400" : "text-blue-400")}>
                {localRecon.varianceUsd > 0 ? '+' : ''}{(localRecon.varianceUsd || 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {(localRecon.notes || localRecon.signature || (localRecon.amendmentNotes && localRecon.amendmentNotes.length > 0)) && (
          <div className="px-6 pb-6 bg-[#0a192f]">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-[#1e345e] pb-2">Notes & Verification</h4>
            {localRecon.amendmentNotes && localRecon.amendmentNotes.length > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-xs text-slate-500 mb-1">Amendment History</p>
                {(localRecon.amendmentNotes || []).map((note: string, i: number) => (
                  <div key={i} className="text-sm text-yellow-500/90 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20 leading-relaxed font-medium">
                    {note}
                  </div>
                ))}
              </div>
            )}
            {localRecon.notes && (
              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-1">Additional Notes</p>
                <p className="text-sm text-slate-300 bg-[#061121] p-3 rounded-lg border border-[#1e345e]">{localRecon.notes}</p>
              </div>
            )}
            {localRecon.signature && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Digitally Signed By</p>
                <p className="text-lg text-emerald-400 font-serif italic">{localRecon.signature}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
