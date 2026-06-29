import React from 'react';
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
              {item.description || 'Unnamed'} 
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
  if (!recon) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0a192f] border border-[#1e345e] rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto">
        <div className="p-6 border-b border-[#1e345e] flex justify-between items-center sticky top-0 bg-[#0a192f] z-10">
          <div>
            <h2 className="text-xl font-bold text-white">Reconciliation Details</h2>
            <p className="text-sm text-slate-400 mt-1">{format(new Date(recon.date), 'MMMM dd, yyyy')} - <span className="font-mono text-emerald-400">{recon.status}</span></p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white bg-[#112240] p-2 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#061121]">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-[#1e345e] pb-2">Income breakdown</h4>
            <div className="space-y-4">
              <BreakdownSection title="Total Sales" items={recon.totalSales} />
              <BreakdownSection title="Deposits Received" items={recon.depositsReceived} />
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-[#1e345e] pb-2">Deductions breakdown</h4>
            <div className="space-y-4">
              <BreakdownSection title="Debtors" items={recon.debtors} />
              <BreakdownSection title="Deposit Claims" items={recon.depositClaims} />
              <BreakdownSection title="Returns / Refunds" items={recon.returnsRefunds} />
              <BreakdownSection title="Expenses" items={recon.expenses} />
              <BreakdownSection title="Purchases" items={recon.purchases} />
            </div>
          </div>
        </div>
        
        {recon.tillCashBreakdown && recon.tillCashBreakdown.length > 0 && (
          <div className="px-6 pb-6 bg-[#061121]">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-[#1e345e] pb-2">Physical Cash Breakdown</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <BreakdownSection title="Physical Cash Counted" items={recon.tillCashBreakdown} />
              </div>
            </div>
          </div>
        )}

        <div className="p-6 bg-[#0a192f] border-t border-[#1e345e]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
            <div>
              <div className="text-slate-500 mb-1 text-xs uppercase tracking-wider">Expected Cash</div>
              <div className="text-slate-300 text-lg">${(recon.expectedCashUsd || 0).toFixed(2)}</div>
            </div>
            <div>
              <div className="text-slate-500 mb-1 text-xs uppercase tracking-wider">Physical Cash Count</div>
              <div className="text-white font-bold text-lg">${(recon.endOfDayCash?.usdEquivalent || 0).toFixed(2)}</div>
            </div>
            <div>
              <div className="text-slate-500 mb-1 text-xs uppercase tracking-wider">Variance</div>
              <div className={clsx("font-bold text-lg", recon.varianceUsd > 0 ? "text-emerald-400" : recon.varianceUsd < 0 ? "text-rose-400" : "text-blue-400")}>
                {recon.varianceUsd > 0 ? '+' : ''}{(recon.varianceUsd || 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {(recon.notes || recon.signature || (recon.amendmentNotes && recon.amendmentNotes.length > 0)) && (
          <div className="px-6 pb-6 bg-[#0a192f]">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-[#1e345e] pb-2">Notes & Verification</h4>
            {recon.amendmentNotes && recon.amendmentNotes.length > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-xs text-slate-500 mb-1">Amendment History</p>
                {recon.amendmentNotes.map((note: string, i: number) => (
                  <div key={i} className="text-sm text-yellow-500/90 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20 leading-relaxed font-medium">
                    {note}
                  </div>
                ))}
              </div>
            )}
            {recon.notes && (
              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-1">Additional Notes</p>
                <p className="text-sm text-slate-300 bg-[#061121] p-3 rounded-lg border border-[#1e345e]">{recon.notes}</p>
              </div>
            )}
            {recon.signature && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Digitally Signed By</p>
                <p className="text-lg text-emerald-400 font-serif italic">{recon.signature}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
