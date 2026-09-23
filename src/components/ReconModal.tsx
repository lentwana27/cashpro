import { safeFormat } from '../lib/formatDate';
import React from 'react';
import { useAuth } from '../components/AuthProvider';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Check, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import clsx from 'clsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download } from 'lucide-react';

const money = (n: any) => `$${(Number(n) || 0).toFixed(2)}`;

const sumUsd = (val: any): number => {
  if (!val) return 0;
  if (Array.isArray(val)) return val.reduce((a: number, b: any) => a + (b.usdEquivalent || 0), 0);
  return val.usdEquivalent || 0;
};

// Expected Cash and Variance are always derived here from the underlying line
// items - never read from the recon's own stored expectedCashUsd/varianceUsd
// fields - so the numbers shown are guaranteed to satisfy
// Income - Deductions = Expected Cash, and Physical Cash - Expected Cash = Variance,
// regardless of any bug in whichever screen last wrote those stored fields.
const computeTotals = (recon: any) => {
  const totalIncome = sumUsd(recon.totalSales) + sumUsd(recon.depositsReceived) + sumUsd(recon.manualSalesToday);
  const totalDeductions = sumUsd(recon.debtors) + sumUsd(recon.depositClaims) + sumUsd(recon.returnsRefunds) +
    sumUsd(recon.expenses) + sumUsd(recon.purchases) + sumUsd(recon.manualSalesPrevious);
  const expectedCashUsd = totalIncome - totalDeductions;
  const physicalCashUsd = sumUsd(recon.tillCashBreakdown) || sumUsd(recon.endOfDayCash);
  const varianceUsd = physicalCashUsd - expectedCashUsd;
  return { totalIncome, totalDeductions, expectedCashUsd, physicalCashUsd, varianceUsd };
};

// tillVariances[].expected is set once at submission time and is never
// recomputed when the "Enter System Sales" step later updates totalSales -
// so it's stale (usually stuck at 0) on almost every reconciliation that went
// through that step. Re-derive each till's expected figure from the current
// totalSales entry for that till (matched by name) instead of trusting the
// stored value, and recompute variance from that corrected expected.
const deriveTillVariances = (recon: any): any[] => {
  const tillVariances = recon.tillVariances || [];
  const totalSalesArr = Array.isArray(recon.totalSales) ? recon.totalSales : recon.totalSales ? [recon.totalSales] : [];
  return tillVariances.map((tv: any) => {
    const matchingSale = totalSalesArr.find((s: any) => s.description === tv.tillName);
    const expected = matchingSale ? (matchingSale.usdEquivalent || 0) : (tv.expected || 0);
    const actual = tv.actual || 0;
    return { ...tv, expected, variance: actual - expected };
  });
};

const getCashierName = (item: any, tillVariances?: any[]): string | null => {
  if (item.cashierName && item.cashierName !== 'Unknown') return item.cashierName;
  if (tillVariances) {
    const tv = tillVariances.find((t: any) => t.tillName === item.description);
    if (tv?.cashierName && tv.cashierName !== 'Unknown') return tv.cashierName;
  }
  return null;
};

const BreakdownSection = ({ title, items, tillVariances, footer }: { title: string, items: any, tillVariances?: any[], footer?: { label: string, value: number } }) => {
  const arr = Array.isArray(items) ? items : items ? [items] : [];
  if (arr.length === 0) return null;
  const total = arr.reduce((a:number,b:any)=>a+(b.usdEquivalent||0), 0);

  const cashierFor = (item: any) => getCashierName(item, tillVariances);

  return (
    <div className="mb-4">
      <div className="flex justify-between font-medium text-slate-300 text-sm mb-2">
        <span>{title}</span>
        <span className="font-mono text-white">${total.toFixed(2)}</span>
      </div>
      <div className="space-y-1.5 border-l-2 border-[#1e345e] ml-1 pl-3">
        {arr.map((item: any, idx: number) => {
          const cashierName = cashierFor(item);
          return (
            <div key={idx} className="flex justify-between text-xs">
              <span className="text-slate-400">
                {item.description || 'Unnamed'}{item.date ? ` [${item.date}]` : ""}
                {cashierName && <span className="text-emerald-400/80 ml-1">(Cashier: {cashierName})</span>}
                {(item.amount || item.amount === 0) && <span className="text-slate-500 ml-1">({item.amount} {item.currencyCode})</span>}
              </span>
              <span className="text-slate-300 font-mono">${(item.usdEquivalent||0).toFixed(2)}</span>
            </div>
          );
        })}
      </div>
      {footer && (
        <div className="flex justify-between text-xs font-bold mt-2 pt-2 border-t border-[#1e345e]">
          <span className="text-slate-300">{footer.label}</span>
          <span className="text-emerald-400 font-mono">{money(footer.value)}</span>
        </div>
      )}
    </div>
  );
}

export function ReconModal({ recon, onClose }: { recon: any, onClose: () => void }) {
  const { user } = useAuth();
  const [localRecon, setLocalRecon] = useState(recon);
  const [editingNoteIdx, setEditingNoteIdx] = useState<number | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    api.get('/branches').then(setBranches).catch(() => {});
  }, []);

  const downloadPdf = () => {
    try {
      setDownloading(true);
      const branchName = (branches || []).find((b: any) => b.id === localRecon.branchId)?.name || localRecon.branchId;
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 14;
      let y = 36;

      const ensureSpace = (needed: number) => {
        if (y + needed > pageHeight - 18) {
          doc.addPage();
          y = 20;
        }
      };

      // Header banner
      doc.setFillColor(10, 25, 47);
      doc.rect(0, 0, pageWidth, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Reconciliation Report', marginX, 13);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `${branchName}   |   ${safeFormat(localRecon.date || new Date(), 'MMMM dd, yyyy')}   |   ${localRecon.status}`,
        marginX, 21
      );
      doc.setTextColor(0, 0, 0);

      // Summary
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', marginX, y);
      y += 4;
      const totals = computeTotals(localRecon);
      const varianceUsd = totals.varianceUsd;
      const varianceColor: [number, number, number] = varianceUsd > 0 ? [16, 185, 129] : varianceUsd < 0 ? [244, 63, 94] : [59, 130, 246];
      autoTable(doc, {
        startY: y,
        margin: { left: marginX, right: marginX },
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3, halign: 'center' },
        headStyles: { fillColor: [17, 34, 64] },
        head: [['Total Income (USD)', 'Total Deductions (USD)', 'Expected Cash (USD)', 'Physical Cash Counted (USD)', 'Variance (USD)']],
        body: [[
          money(totals.totalIncome),
          money(totals.totalDeductions),
          money(totals.expectedCashUsd),
          money(totals.physicalCashUsd),
          `${varianceUsd > 0 ? '+' : ''}${money(varianceUsd)}`,
        ]],
        didParseCell: (data: any) => {
          if (data.section === 'body' && data.column.index === 4) {
            data.cell.styles.textColor = varianceColor;
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });
      y = (doc as any).lastAutoTable.finalY + 10;

      const itemRows = (sections: { label: string, items: any }[], tillVariances?: any[]) => {
        const rows: any[] = [];
        let total = 0;
        sections.forEach(({ label, items }) => {
          const arr = Array.isArray(items) ? items : items ? [items] : [];
          arr.forEach((item: any) => {
            total += item.usdEquivalent || 0;
            rows.push([
              label,
              item.description || 'Unnamed',
              getCashierName(item, tillVariances) || '-',
              `${item.amount ?? '-'} ${item.currencyCode || ''}`.trim(),
              money(item.usdEquivalent),
            ]);
          });
        });
        return { rows, total };
      };

      const addItemTable = (title: string, sections: { label: string, items: any }[], tillVariances?: any[]) => {
        const { rows, total } = itemRows(sections, tillVariances);
        if (rows.length === 0) return;
        ensureSpace(20);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(title, marginX, y);
        y += 4;
        autoTable(doc, {
          startY: y,
          margin: { left: marginX, right: marginX },
          theme: 'striped',
          styles: { fontSize: 8, cellPadding: 2.5 },
          headStyles: { fillColor: [17, 34, 64] },
          footStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: 'bold' },
          head: [['Section', 'Description', 'Cashier', 'Amount', 'USD Equivalent']],
          body: rows,
          foot: [['', '', '', 'Total', money(total)]],
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      };

      addItemTable('Income', [
        { label: 'Total Sales', items: localRecon.totalSales },
        { label: 'Deposits Received', items: localRecon.depositsReceived },
        { label: 'Manual Sales (Today)', items: localRecon.manualSalesToday },
      ], localRecon.tillVariances);

      addItemTable('Deductions', [
        { label: 'Debtors', items: localRecon.debtors },
        { label: 'Deposit Claims', items: localRecon.depositClaims },
        { label: 'Returns / Refunds', items: localRecon.returnsRefunds },
        { label: 'Expenses', items: localRecon.expenses },
        { label: 'Purchases', items: localRecon.purchases },
        { label: 'Manual Sales (Previous Days)', items: localRecon.manualSalesPrevious },
      ]);

      const pdfTillVariances = deriveTillVariances(localRecon);
      if (pdfTillVariances.length > 0) {
        ensureSpace(20);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Till Variances', marginX, y);
        y += 4;
        autoTable(doc, {
          startY: y,
          margin: { left: marginX, right: marginX },
          theme: 'striped',
          styles: { fontSize: 8, cellPadding: 2.5 },
          headStyles: { fillColor: [17, 34, 64] },
          head: [['Till', 'Cashier', 'Expected (USD)', 'Actual (USD)', 'Variance (USD)', 'Note']],
          body: pdfTillVariances.map((tv: any) => [
            tv.tillName,
            tv.cashierName && tv.cashierName !== 'Unknown' ? tv.cashierName : 'Not identified',
            money(tv.expected),
            money(tv.actual),
            `${(tv.variance || 0) > 0 ? '+' : ''}${money(tv.variance)}`,
            tv.note || '-',
          ]),
          didParseCell: (data: any) => {
            if (data.section === 'body' && data.column.index === 4) {
              const v = pdfTillVariances[data.row.index]?.variance || 0;
              data.cell.styles.textColor = v > 0 ? [16, 185, 129] : v < 0 ? [244, 63, 94] : [59, 130, 246];
              data.cell.styles.fontStyle = 'bold';
            }
          },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      }

      if (localRecon.tillCashBreakdown && localRecon.tillCashBreakdown.length > 0) {
        addItemTable('Physical Cash Breakdown', [
          { label: '', items: localRecon.tillCashBreakdown },
        ]);
      }

      const notesBlocks: { heading: string, lines: string[], color?: [number, number, number] }[] = [];
      if (localRecon.amendmentNotes && localRecon.amendmentNotes.length > 0) {
        notesBlocks.push({ heading: 'Amendment History', lines: localRecon.amendmentNotes, color: [161, 98, 7] });
      }
      if (localRecon.notes) {
        notesBlocks.push({ heading: 'Additional Notes', lines: [localRecon.notes] });
      }
      if (localRecon.signature) {
        notesBlocks.push({ heading: 'Digitally Signed By', lines: [localRecon.signature], color: [16, 185, 129] });
      }

      if (notesBlocks.length > 0) {
        ensureSpace(16);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Notes & Verification', marginX, y);
        y += 7;
        notesBlocks.forEach(({ heading, lines, color }) => {
          ensureSpace(12);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(90, 90, 90);
          doc.text(heading, marginX, y);
          y += 5;
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...(color || [30, 30, 30]));
          lines.forEach((line) => {
            const wrapped = doc.splitTextToSize(line, pageWidth - marginX * 2);
            wrapped.forEach((wrappedLine: string) => {
              ensureSpace(6);
              doc.text(wrappedLine, marginX, y);
              y += 5;
            });
          });
          y += 3;
        });
      }

      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(140, 140, 140);
        doc.text(`Generated ${safeFormat(new Date(), 'yyyy-MM-dd HH:mm')}`, marginX, pageHeight - 8);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - marginX, pageHeight - 8, { align: 'right' });
      }

      doc.save(`Reconciliation_${localRecon.date}_${branchName.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF', error);
      alert('Failed to generate PDF. Check console for details.');
    } finally {
      setDownloading(false);
    }
  };

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
  const totals = computeTotals(localRecon);
  const derivedTillVariances = deriveTillVariances(localRecon);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm overflow-hidden">
  <div className="bg-[#0a192f] border border-[#1e345e] rounded-2xl w-full max-w-5xl max-h-full shadow-2xl overflow-y-auto flex flex-col relative">
    <div className="absolute top-6 right-6 flex items-center gap-3 z-20">
        <button onClick={downloadPdf} disabled={downloading} className="flex items-center gap-2 text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-500/20 p-2 px-3 rounded-lg transition-colors border border-emerald-500/20 text-sm font-bold disabled:opacity-50">
          <Download className="w-4 h-4" />
          {downloading ? "Exporting..." : "Download PDF"}
        </button>
        <button onClick={onClose} className="text-slate-500 hover:text-white bg-[#112240] p-2 rounded-lg transition-colors shadow-lg">
          <X className="w-5 h-5" />
        </button>
    </div>
    <div className="bg-[#0a192f] flex-1 flex flex-col">
      <div className="p-6 border-b border-[#1e345e] flex justify-between items-center bg-[#0a192f] z-10 pr-48">
        <div>
          <h2 className="text-xl font-bold text-white">Reconciliation Details</h2>
          <p className="text-sm text-slate-400 mt-1">
            {(branches || []).find((b: any) => b.id === localRecon.branchId)?.name || localRecon.branchId} &middot;{" "}
            {safeFormat(localRecon.date || new Date(), "MMMM dd, yyyy")} - <span className="font-mono text-emerald-400">{localRecon.status}</span>
          </p>
        </div>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#061121]">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-[#1e345e] pb-2">Income breakdown</h4>
            <div className="space-y-4">
              <BreakdownSection
                title="Total Sales"
                items={localRecon.totalSales}
                tillVariances={localRecon.tillVariances}
                footer={{ label: 'Expected (Income − Deductions)', value: totals.expectedCashUsd }}
              />
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
        
        
        {derivedTillVariances.length > 0 && (
          <div className="px-6 pb-6 bg-[#061121]">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-[#1e345e] pb-2">Till Variances</h4>
            <div className="space-y-4">
              {derivedTillVariances.map((tv: any, idx: number) => (
                <div key={idx} className="bg-[#112240] border border-[#1e345e] rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-white">{tv.tillName}</div>
                      <div className="text-sm text-slate-400">Cashier: {tv.cashierName && tv.cashierName !== 'Unknown' ? tv.cashierName : 'Not identified'}</div>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 font-mono">
            <div>
              <div className="text-slate-500 mb-1 text-xs uppercase tracking-wider">Total Income</div>
              <div className="text-slate-300 text-lg">{money(totals.totalIncome)}</div>
            </div>
            <div>
              <div className="text-slate-500 mb-1 text-xs uppercase tracking-wider">Total Deductions</div>
              <div className="text-slate-300 text-lg">{money(totals.totalDeductions)}</div>
            </div>
            <div>
              <div className="text-slate-500 mb-1 text-xs uppercase tracking-wider">Expected Cash</div>
              <div className="text-slate-300 text-lg">{money(totals.expectedCashUsd)}</div>
            </div>
            <div>
              <div className="text-slate-500 mb-1 text-xs uppercase tracking-wider">Physical Cash Count</div>
              <div className="text-white font-bold text-lg">{money(totals.physicalCashUsd)}</div>
            </div>
            <div>
              <div className="text-slate-500 mb-1 text-xs uppercase tracking-wider">Variance</div>
              <div className={clsx("font-bold text-lg", totals.varianceUsd > 0 ? "text-emerald-400" : totals.varianceUsd < 0 ? "text-rose-400" : "text-blue-400")}>
                {totals.varianceUsd > 0 ? '+' : ''}{money(totals.varianceUsd)}
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
  </div>
  );
}