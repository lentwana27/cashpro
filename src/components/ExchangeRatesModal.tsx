import { safeFormat } from '../lib/formatDate';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { CheckCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from './AuthProvider';
import { PaginationBar, paginate } from './PaginationBar';
import { Period, PERIOD_OPTIONS, getPeriodRange, inRange } from '../lib/period';

const RATES_PAGE_SIZE = 5;
const HISTORY_PAGE_SIZE = 8;

export function ExchangeRatesModal({ rates, onClose, onUpdate }: any) {
  const [editing, setEditing] = useState<string | null>(null);
  const [newRate, setNewRate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const { user } = useAuth();
  const [rateSearch, setRateSearch] = useState('');
  const [ratePage, setRatePage] = useState(1);
  const [histCurrency, setHistCurrency] = useState('ALL');
  const [histPeriod, setHistPeriod] = useState<Period>('ALL');
  const [histFrom, setHistFrom] = useState('');
  const [histTo, setHistTo] = useState('');
  const [histPage, setHistPage] = useState(1);
  useEffect(() => { setRatePage(1); }, [rateSearch]);
  useEffect(() => { setHistPage(1); }, [histCurrency, histPeriod, histFrom, histTo]);
  const canEdit = user?.role === 'ADMIN' || user?.role === 'HEAD_ACCOUNTANT';

  useEffect(() => {
    api.get('/rates/history').then(res => setHistory(res)).catch(console.error);
  }, []);

  const handleUpdate = async (code: string) => {
    setLoading(true);
    await api.put(`/rates/${code}`, { newRate: parseFloat(newRate), userId: user?.id });
    setEditing(null);
    setLoading(false);
    onUpdate();
    api.get('/rates/history').then(res => setHistory(res)).catch(console.error);
  };

  const histRange = getPeriodRange(histPeriod, histFrom, histTo);
  const nonUsd = (rates || []).filter((r: any) => r.currencyCode !== 'USD');
  const filteredRates = nonUsd.filter((r: any) => !rateSearch.trim() || r.currencyCode.toLowerCase().includes(rateSearch.trim().toLowerCase()));
  const rateView = paginate<any>(filteredRates, ratePage, RATES_PAGE_SIZE);
  const historyCurrencies = Array.from(new Set<string>(history.map((h: any) => h.currencyCode))).sort();
  const filteredHistory = history
    .filter((h: any) => histCurrency === 'ALL' || h.currencyCode === histCurrency)
    .filter((h: any) => inRange(String(h.changedAt || '').substring(0, 10), histRange))
    .sort((a: any, b: any) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
  const histView = paginate<any>(filteredHistory, histPage, HISTORY_PAGE_SIZE);
  const histFiltersActive = histCurrency !== 'ALL' || histPeriod !== 'ALL';

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="bg-[#0a192f] border border-[#1e345e] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="p-4 sm:p-6 border-b border-[#1e345e] flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-white">Exchange Rates</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white">&times;</button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          <div>
            <p className="text-sm text-slate-400 mb-4">Base currency is USD (1.00). Rate modifications apply to FUTURE submissions only.</p>
            {nonUsd.length > RATES_PAGE_SIZE && (
              <input type="text" value={rateSearch} onChange={e => setRateSearch(e.target.value)} placeholder="Search currency code..." className="w-full mb-4 bg-[#112240] border border-[#1e345e] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-500" />
            )}
            <div className="space-y-4">
              {filteredRates.length === 0 && <div className="text-sm text-slate-500 italic p-4 bg-[#112240] rounded-xl border border-[#1e345e]">No currencies match.</div>}
              {rateView.pageItems.map((rate: any) => (
                <div key={rate.id} className="flex items-center justify-between bg-[#112240] p-4 rounded-xl border border-[#1e345e] shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#061121] rounded-lg flex items-center justify-center font-bold text-emerald-400 border border-[#1e345e]">
                      {rate.currencyCode}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">1 {rate.currencyCode}</div>
                      <div className="text-xs text-slate-500">Updated: {safeFormat(rate.effectiveDate || new Date(), 'MMM d, yyyy HH:mm')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {editing === rate.currencyCode ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number" step="0.001"
                          value={newRate} onChange={e => setNewRate(e.target.value.replace(/^0+(?=d)/, ''))}
                          className="w-24 px-2 py-1 bg-[#061121] border border-emerald-500 rounded text-right text-emerald-400 focus:outline-none"
                        />
                        <button onClick={() => handleUpdate(rate.currencyCode)} disabled={loading} className="text-emerald-400 hover:text-emerald-300">
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-emerald-400">${rate.rateToUsd.toFixed(4)}</span>
                        {canEdit && (
                          <button onClick={() => { setEditing(rate.currencyCode); setNewRate(rate.rateToUsd.toString()); }} className="text-slate-500 hover:text-white">
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <PaginationBar page={rateView.currentPage} totalPages={rateView.totalPages} totalItems={filteredRates.length} pageSize={RATES_PAGE_SIZE} onPageChange={setRatePage} />
          </div>

          <div className="border-t border-[#1e345e] pt-6">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Rate History</h3>
            {history.length > 0 && (
              <div className="flex flex-wrap items-end gap-3 mb-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Currency</label>
                  <select value={histCurrency} onChange={e => setHistCurrency(e.target.value)} className="bg-[#112240] border border-[#1e345e] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500">
                    <option value="ALL">All Currencies</option>
                    {historyCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Period</label>
                  <select value={histPeriod} onChange={e => setHistPeriod(e.target.value as Period)} className="bg-[#112240] border border-[#1e345e] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500">
                    {PERIOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                {histPeriod === 'CUSTOM' && (
                  <>
                    <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">From</label><input type="date" value={histFrom} onChange={e => setHistFrom(e.target.value)} className="bg-[#112240] border border-[#1e345e] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500" /></div>
                    <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">To</label><input type="date" value={histTo} onChange={e => setHistTo(e.target.value)} className="bg-[#112240] border border-[#1e345e] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500" /></div>
                  </>
                )}
                {histFiltersActive && (
                  <button onClick={() => { setHistCurrency('ALL'); setHistPeriod('ALL'); setHistFrom(''); setHistTo(''); }} className="text-xs text-slate-400 hover:text-white px-3 py-2 border border-[#1e345e] rounded-lg transition-colors">Clear filters</button>
                )}
              </div>
            )}
            {history.length === 0 ? (
              <div className="text-sm text-slate-500 italic p-4 bg-[#112240] rounded-xl border border-[#1e345e]">
                No history found.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredHistory.length === 0 && <div className="text-sm text-slate-500 italic p-4 bg-[#112240] rounded-xl border border-[#1e345e]">No changes match the filters.</div>}
                {histView.pageItems.map((h: any) => (
                  <div key={h.id} className="flex justify-between items-center text-sm p-3 bg-[#112240] rounded-lg border border-[#1e345e]">
                    <div>
                      <div className="text-slate-300 font-medium">
                        {h.currencyCode}: <span className="text-rose-400 line-through mr-1">${h.oldRate.toFixed(4)}</span>
                        <span className="text-emerald-400">${h.newRate.toFixed(4)}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{safeFormat(h.changedAt || new Date(), 'MMM d, yyyy HH:mm')}</div>
                    </div>
                  </div>
                ))}
                <PaginationBar page={histView.currentPage} totalPages={histView.totalPages} totalItems={filteredHistory.length} pageSize={HISTORY_PAGE_SIZE} onPageChange={setHistPage} />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
