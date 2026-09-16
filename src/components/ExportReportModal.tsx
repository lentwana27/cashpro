import { safeFormat } from '../lib/formatDate';
import React, { useState, useMemo } from 'react';
import { X, Download, FileSpreadsheet, FileText, Calendar, Filter, Eye } from 'lucide-react';
import { format, isAfter, isBefore, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, startOfDay, endOfDay } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function ExportReportModal({ isOpen, onClose, reconciliations = [], branches = [] }: any) {
  const [dateRangeType, setDateRangeType] = useState('ALL'); // ALL, WEEK, MONTH, CUSTOM
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [showPreview, setShowPreview] = useState(false);

  const getSum = (val: any) => {
    if (!val) return 0;
    if (Array.isArray(val)) return val.reduce((a:any, b:any) => a + (b.usdEquivalent || 0), 0);
    return val.usdEquivalent || 0;
  };

  const filteredData = useMemo(() => {
    let data = [...reconciliations];

    // Branch filter
    if (selectedBranch !== 'ALL') {
      data = data.filter(r => r.branchId === selectedBranch);
    }

    // Date filter
    const now = new Date();
    if (dateRangeType === 'WEEK') {
      const start = startOfWeek(now, { weekStartsOn: 1 });
      const end = endOfWeek(now, { weekStartsOn: 1 });
      data = data.filter(r => {
        const d = parseISO(r.date);
        return d >= startOfDay(start) && d <= endOfDay(end);
      });
    } else if (dateRangeType === 'MONTH') {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      data = data.filter(r => {
        const d = parseISO(r.date);
        return d >= startOfDay(start) && d <= endOfDay(end);
      });
    } else if (dateRangeType === 'CUSTOM' && customStart && customEnd) {
      const start = startOfDay(parseISO(customStart));
      const end = endOfDay(parseISO(customEnd));
      data = data.filter(r => {
        const d = parseISO(r.date);
        return d >= start && d <= end;
      });
    }

    return data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [reconciliations, dateRangeType, customStart, customEnd, selectedBranch]);

  const headers = [
    'Branch', 'Date', 'Sales (USD)', 'Deposits (USD)', 
    'Debtors (USD)', 'Returns (USD)', 'Expenses (USD)', 'Purchases (USD)', 
    'Expected Cash (USD)', 'End Cash (USD)', 'Variance (USD)', 'Status'
  ];

  const getRows = () => filteredData.map((r: any) => [
    (branches || []).find((b:any) => b.id === r.branchId)?.name || r.branchId,
    r.date,
    parseFloat(getSum(r.totalSales).toFixed(2)),
    parseFloat(getSum(r.depositsReceived).toFixed(2)),
    parseFloat(getSum(r.debtors).toFixed(2)),
    parseFloat(getSum(r.returnsRefunds).toFixed(2)),
    parseFloat(getSum(r.expenses).toFixed(2)),
    parseFloat(getSum(r.purchases).toFixed(2)),
    parseFloat((r.expectedCashUsd || 0).toFixed(2)),
    parseFloat((r.endOfDayCash?.usdEquivalent || 0).toFixed(2)),
    parseFloat((r.varianceUsd || 0).toFixed(2)),
    r.status
  ]);

  const exportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...getRows().map((e:any[]) => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Report_${safeFormat(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...getRows()]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `Report_${safeFormat(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text(`Financial Report`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${safeFormat(new Date(), 'yyyy-MM-dd HH:mm')}`, 14, 22);

    autoTable(doc, {
      head: [headers],
      body: getRows(),
      startY: 30,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [17, 34, 64] }
    });
    
    doc.save(`Report_${safeFormat(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-[#1e345e]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-400" /> Advanced Report Export
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 bg-[#112240]/50 border-b border-[#1e345e] grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Time Range</label>
            <select 
              value={dateRangeType}
              onChange={(e) => setDateRangeType(e.target.value)}
              className="w-full bg-[#0a192f] border border-[#1e345e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Time</option>
              <option value="WEEK">This Week</option>
              <option value="MONTH">This Month</option>
              <option value="CUSTOM">Custom Date Range</option>
            </select>
          </div>

          {dateRangeType === 'CUSTOM' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Start Date</label>
                <input 
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full bg-[#0a192f] border border-[#1e345e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">End Date</label>
                <input 
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full bg-[#0a192f] border border-[#1e345e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </>
          )}

          <div className={dateRangeType === 'CUSTOM' ? '' : 'md:col-span-3'}>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Branch / Entity</label>
            <select 
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full bg-[#0a192f] border border-[#1e345e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Branches</option>
              {branches.map((b:any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-medium flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400" /> Data Preview ({filteredData.length} records)
            </h3>
            <div className="flex gap-2">
              <button onClick={exportCSV} disabled={filteredData.length === 0} className="px-3 py-1.5 bg-[#112240] hover:bg-[#1a2d53] text-emerald-400 border border-[#1e345e] rounded flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-50">
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
              <button onClick={exportExcel} disabled={filteredData.length === 0} className="px-3 py-1.5 bg-[#112240] hover:bg-[#1a2d53] text-blue-400 border border-[#1e345e] rounded flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-50">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
              </button>
              <button onClick={exportPDF} disabled={filteredData.length === 0} className="px-3 py-1.5 bg-[#112240] hover:bg-[#1a2d53] text-rose-400 border border-[#1e345e] rounded flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-50">
                <FileText className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto rounded-lg border border-[#1e345e]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#112240]">
                  {headers.map((h, i) => (
                    <th key={i} className="p-3 text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-[#1e345e] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-[#0a192f] divide-y divide-[#1e345e]">
                {getRows().map((row: any[], i: number) => (
                  <tr key={i} className="hover:bg-[#112240]/50 transition-colors">
                    {row.map((cell, j) => (
                      <td key={j} className="p-3 text-sm text-slate-300 whitespace-nowrap">{cell}</td>
                    ))}
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={headers.length} className="p-8 text-center text-slate-500">
                      No data found for the selected criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
