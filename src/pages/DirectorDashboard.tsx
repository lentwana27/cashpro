import { DollarSign, AlertCircle, TrendingDown, TrendingUp, Activity as ActivityIcon, ChevronDown, ChevronUp, MapPin, Download, FileText, FileSpreadsheet } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { DailyReconciliation, Branch } from '../lib/types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import clsx from 'clsx';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReconModal } from '../components/ReconModal';

export function DirectorDashboard() {
  const [reconciliations, setReconciliations] = useState<DailyReconciliation[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  
  const [filterType, setFilterType] = useState('month'); // all, day, week, month, year
  const [filterValue, setFilterValue] = useState(format(new Date(), 'yyyy-MM'));
  
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string | null>(null);
  const [viewReconId, setViewReconId] = useState<string | null>(null);
  const tableRef = React.useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const load = async () => {
      try {
         const [recs, brs] = await Promise.all([
           api.get('/reconciliations'),
           api.get('/branches')
         ]);
         setReconciliations(recs);
         setBranches(brs);
      } catch (e) {
         console.error(e);
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

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

  const getWeekStr = (dateStr: string) => {
    const d = new Date(dateStr);
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    const week = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return `${date.getFullYear()}-W${week.toString().padStart(2, '0')}`;
  };

  const filteredReconciliations = reconciliations.filter((r: any) => {
    if (filterType === 'all') return true;
    if (!filterValue) return true;
    
    if (filterType === 'day') return r.date === filterValue;
    if (filterType === 'month') return r.date.startsWith(filterValue);
    if (filterType === 'year') return r.date.startsWith(filterValue);
    if (filterType === 'week') return getWeekStr(r.date) === filterValue;
    
    return true;
  });

  const getSumVal = (val: any) => {
    if (!val) return 0;
    if (Array.isArray(val)) return val.reduce((a:any, b:any) => a + (b.usdEquivalent || 0), 0);
    return val.usdEquivalent || 0;
  };

  const totalSales = filteredReconciliations.reduce((acc, curr) => acc + getSumVal(curr.totalSales), 0);
  const totalVariance = filteredReconciliations.reduce((acc, curr) => acc + curr.varianceUsd, 0);
  const totalExpenses = filteredReconciliations.reduce((acc, curr) => acc + getSumVal(curr.expenses), 0);
  const shortagesCount = filteredReconciliations.filter(r => r.varianceUsd < -0.01).length;

  const charData = filteredReconciliations.reduce((acc: any[], curr) => {
    const existing = acc.find(a => a.date === curr.date);
    if (existing) {
      existing.sales += getSumVal(curr.totalSales);
      existing.variance += curr.varianceUsd;
    } else {
      acc.push({ date: curr.date, sales: getSumVal(curr.totalSales), variance: curr.varianceUsd });
    }
    return acc;
  }, []).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const branchAggregates = (Object.values(filteredReconciliations.reduce((acc: Record<string, { branchId: string, name: string, sales: number, variance: number, expenses: number, shortageCount: number }>, curr) => {
    if (!acc[curr.branchId]) {
      acc[curr.branchId] = { branchId: curr.branchId, name: branches.find(b => b.id === curr.branchId)?.name || curr.branchId, sales: 0, variance: 0, expenses: 0, shortageCount: 0 };
    }
    acc[curr.branchId].sales += getSumVal(curr.totalSales);
    acc[curr.branchId].variance += curr.varianceUsd;
    acc[curr.branchId].expenses += getSumVal(curr.expenses);
    if (curr.varianceUsd < -0.01) {
      acc[curr.branchId].shortageCount += 1;
    }
    return acc;
  }, {})) as { branchId: string, name: string, sales: number, variance: number, expenses: number, shortageCount: number }[]).sort((a, b) => b.sales - a.sales);

  const top3Branches = branchAggregates.slice(0, 3);
  const underperformingBranches = [...branchAggregates].sort((a, b) => a.sales - b.sales).slice(0, 3);
  const highVarianceBranches = [...branchAggregates].sort((a, b) => b.shortageCount - a.shortageCount).filter(b => b.shortageCount > 0);
  
  const sortedReconciliations = [...filteredReconciliations]
    .filter(r => !selectedBranchFilter || r.branchId === selectedBranchFilter)
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const exportBranchDataToExcel = () => {
    // Sheet 1: Branch Aggregates
    const aggHeaders = ['Branch Code', 'Branch Name', 'Location', 'Total Sales (USD)', 'Total Variance (USD)', 'Total Expenses (USD)'];
    const aggRows = branchAggregates.map((ba: any) => {
      const b = branches.find(br => br.id === ba.branchId);
      return [
        ba.branchId,
        b?.name || 'Unknown',
        b?.location || 'Unknown',
        parseFloat((ba.sales || 0).toFixed(2)),
        parseFloat((ba.variance || 0).toFixed(2)),
        parseFloat((ba.expenses || 0).toFixed(2))
      ];
    });

    // Sheet 2: Raw Daily Reconciliations
    const rawHeaders = [
      'Branch', 'Date', 'Total Sales (USD)', 'Deposits Received (USD)', 
      'Debtors (USD)', 'Returns (USD)', 'Expenses (USD)', 'Purchases (USD)', 
      'Expected Cash (USD)', 'End Cash (USD)', 'Variance (USD)', 'Status'
    ];
    
    const getSum = (val: any) => {
      if (!val) return 0;
      if (Array.isArray(val)) return val.reduce((a:any, b:any) => a + (b.usdEquivalent || 0), 0);
      return val.usdEquivalent || 0;
    };

    const rawRows = sortedReconciliations.map(r => [
      branches.find(b => b.id === r.branchId)?.name || r.branchId,
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

    const workbook = XLSX.utils.book_new();
    const aggSheet = XLSX.utils.aoa_to_sheet([aggHeaders, ...aggRows]);
    const rawSheet = XLSX.utils.aoa_to_sheet([rawHeaders, ...rawRows]);
    
    XLSX.utils.book_append_sheet(workbook, aggSheet, "Branch Overview");
    XLSX.utils.book_append_sheet(workbook, rawSheet, "Daily Raw Data");
    XLSX.writeFile(workbook, `Director_Branch_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const exportBranchDataToPdf = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(`Director Branch Report - ${format(new Date(), 'yyyy-MM-dd')}`, 14, 20);
    
    // Branch Aggregates
    doc.setFontSize(14);
    doc.text('Branch Overview', 14, 30);
    
    const aggHeaders = [['Branch', 'Name', 'Location', 'Sales (USD)', 'Variance (USD)', 'Expenses (USD)']];
    const aggRows = branchAggregates.map((ba: any) => {
      const b = branches.find(br => br.id === ba.branchId);
      return [
        ba.branchId,
        b?.name || 'Unknown',
        b?.location || 'Unknown',
        `$${(ba.sales || 0).toFixed(2)}`,
        `$${(ba.variance || 0).toFixed(2)}`,
        `$${(ba.expenses || 0).toFixed(2)}`
      ];
    });

    autoTable(doc, {
      startY: 35,
      head: aggHeaders,
      body: aggRows,
    });

    let nextY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(14);
    doc.text('Daily Raw Data', 14, nextY);

    const rawHeaders = [[
      'Branch', 'Date', 'Sales ($)', 'Expected Cash ($)', 'Act Cash ($)', 'Var ($)', 'Status'
    ]];

    const getSum = (val: any) => {
      if (!val) return 0;
      if (Array.isArray(val)) return val.reduce((a:any, b:any) => a + (b.usdEquivalent || 0), 0);
      return val.usdEquivalent || 0;
    };

    const rawRows = sortedReconciliations.map(r => [
      branches.find(b => b.id === r.branchId)?.name || r.branchId,
      r.date,
      `$${parseFloat(getSum(r.totalSales).toFixed(2))}`,
      `$${parseFloat((r.expectedCashUsd || 0).toFixed(2))}`,
      `$${parseFloat((r.endOfDayCash?.usdEquivalent || 0).toFixed(2))}`,
      `$${parseFloat((r.varianceUsd || 0).toFixed(2))}`,
      r.status
    ]);

    autoTable(doc, {
      startY: nextY + 5,
      head: rawHeaders,
      body: rawRows,
    });

    doc.save(`Director_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const handleBranchClick = (branchId: string) => {
    if (selectedBranchFilter === branchId) {
      setSelectedBranchFilter(null);
    } else {
      setSelectedBranchFilter(branchId);
      setTimeout(() => {
        tableRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const getBranchItemClass = (branchId: string) => {
    return clsx(
      "flex justify-between items-center p-2 rounded border cursor-pointer transition-colors",
      selectedBranchFilter === branchId 
        ? "bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_10px_rgba(52,211,153,0.1)]" 
        : "bg-[#112240] border-[#1e345e] hover:bg-[#1a365d]"
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">Executive Overview</h1>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {selectedBranchFilter && (
            <button 
              onClick={() => setSelectedBranchFilter(null)}
              className="text-xs px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-700"
            >
              Clear Branch Filter
            </button>
          )}
          <div className="flex items-center gap-2 bg-[#061121] px-3 py-1.5 rounded-lg border border-[#1e345e]">
            <select 
              value={filterType} 
              onChange={e => {
                setFilterType(e.target.value);
                setFilterValue('');
              }} 
              className="bg-transparent text-xs text-slate-400 focus:outline-none"
            >
              <option value="all">All Time</option>
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
            {filterType !== 'all' && (
              <input 
                type={filterType === 'day' ? 'date' : filterType === 'week' ? 'week' : filterType === 'month' ? 'month' : 'number'} 
                value={filterValue}
                onChange={e => setFilterValue(e.target.value)}
                placeholder={filterType === 'year' ? 'YYYY' : ''}
                min={filterType === 'year' ? "2000" : undefined}
                max={filterType === 'year' ? "2099" : undefined}
                className="bg-transparent text-white text-sm focus:outline-none [color-scheme:dark] w-32 ml-2"
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={exportBranchDataToExcel}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm font-medium text-white shadow-lg transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </button>
            <button 
              onClick={exportBranchDataToPdf}
              className="flex items-center gap-2 px-3 py-2 bg-rose-500 hover:bg-rose-600 rounded-lg text-sm font-medium text-white shadow-lg transition-colors"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>
      </div>

      {missingReconciliations.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-6 shadow-inner">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-rose-400" />
            <h3 className="text-lg font-bold text-rose-400">Action Required: Missing Submissions</h3>
          </div>
          <p className="text-sm text-rose-300 mb-4">The following branches have missed their daily reconciliations in the last 7 days.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {missingReconciliations.slice(0, 8).map((m, idx) => (
              <div key={idx} className="bg-rose-500/5 p-3 rounded-lg border border-rose-500/10 flex justify-between items-center text-sm">
                <span className="font-semibold text-rose-200 truncate pr-2">{m.branchName}</span>
                <span className="text-rose-400/80 font-mono whitespace-nowrap">{format(new Date(m.date), 'MMM d, yyyy')}</span>
              </div>
            ))}
            {missingReconciliations.length > 8 && (
              <div className="bg-rose-500/5 p-3 rounded-lg border border-rose-500/10 flex justify-center items-center text-sm text-rose-300">
                + {missingReconciliations.length - 8} more missing
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Sales (USD)" value={`$${totalSales.toFixed(2)}`} icon={<DollarSign />} trend={filterType !== 'all' && filterValue ? 'Filtered' : '+12%'} positive />
        <KPICard title="Total Expenses (USD)" value={`$${totalExpenses.toFixed(2)}`} icon={<TrendingDown />} trend={filterType !== 'all' && filterValue ? 'Filtered' : '-3%'} />
        <KPICard title="Net Variance (USD)" value={`$${totalVariance.toFixed(2)}`} icon={<ActivityIcon />} trend="Stable" 
                 valueColor={totalVariance < 0 ? 'text-rose-400' : totalVariance > 0 ? 'text-emerald-400' : 'text-blue-400'} />
        <KPICard title="Shortage Incidents" value={shortagesCount.toString()} icon={<AlertCircle />} trend="Requires Attention" positive={false} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl p-6 shadow-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingUp className="w-24 h-24 text-emerald-400"/></div>
           <h3 className="text-lg font-bold text-white mb-4 relative z-10 flex items-center gap-2">Top 3 Performing (Sales)</h3>
           <div className="space-y-3 relative z-10">
             {top3Branches.length === 0 && <div className="text-xs text-slate-500 italic">No data</div>}
             {top3Branches.map((b, i) => (
               <div key={b.branchId} onClick={() => handleBranchClick(b.branchId)} className={getBranchItemClass(b.branchId)}>
                 <span className="text-sm font-medium text-slate-300">#{i+1} {b.name}</span>
                 <span className="text-emerald-400 font-mono text-sm">${(b.sales || 0).toFixed(2)}</span>
               </div>
             ))}
           </div>
        </div>

        <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl p-6 shadow-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingDown className="w-24 h-24 text-slate-400"/></div>
           <h3 className="text-lg font-bold text-white mb-4 relative z-10 flex items-center gap-2">Low Sales</h3>
           <div className="space-y-3 relative z-10">
             {underperformingBranches.length === 0 && <div className="text-xs text-slate-500 italic">No data</div>}
             {underperformingBranches.map((b, i) => (
               <div key={b.branchId} onClick={() => handleBranchClick(b.branchId)} className={getBranchItemClass(b.branchId)}>
                 <span className="text-sm font-medium text-slate-300">{b.name}</span>
                 <span className="text-slate-400 font-mono text-sm">${(b.sales || 0).toFixed(2)}</span>
               </div>
             ))}
           </div>
        </div>

        <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl p-6 shadow-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5"><AlertCircle className="w-24 h-24 text-rose-400"/></div>
           <h3 className="text-lg font-bold text-white mb-4 relative z-10 flex items-center gap-2">High Variance Incidents</h3>
           <div className="space-y-3 relative z-10">
             {highVarianceBranches.length === 0 && <div className="text-xs text-slate-500 italic">No shortages recorded</div>}
             {highVarianceBranches.slice(0,3).map((b, i) => (
               <div key={b.branchId} onClick={() => handleBranchClick(b.branchId)} className={getBranchItemClass(b.branchId)}>
                 <span className="text-sm font-medium text-slate-300">{b.name}</span>
                 <span className="text-rose-400 font-medium text-sm">{b.shortageCount} incidents</span>
               </div>
             ))}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl p-6 shadow-xl w-full">
          <h2 className="text-lg font-semibold text-white mb-6">Sales Trend</h2>
          <div className="w-full">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={charData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e345e" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" tickFormatter={str => format(new Date(str), 'MMM d')} />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#0a192f', borderColor: '#1e345e', color: '#f8fafc' }} />
                <Area type="monotone" dataKey="sales" stroke="#34d399" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl p-6 shadow-xl w-full">
          <h2 className="text-lg font-semibold text-white mb-6">Variance Tracking</h2>
          <div className="w-full">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e345e" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" tickFormatter={str => format(new Date(str), 'MMM d')} />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#0a192f', borderColor: '#1e345e', color: '#f8fafc' }} cursor={{fill: '#112240'}} />
                <Bar dataKey="variance" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl p-6 shadow-xl lg:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-6">Branch Performance Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#061121] text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Branch</th>
                  <th className="px-4 py-3 text-right font-medium">Total Sales Rank</th>
                  <th className="px-4 py-3 text-right font-medium">Total Sales (USD)</th>
                  <th className="px-4 py-3 text-right font-medium">Total Variance (USD)</th>
                  <th className="px-4 py-3 text-right font-medium">Total Expenses (USD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e345e]">
                {branchAggregates.map((b, i) => (
                  <tr key={b.branchId} className="hover:bg-[#112240]/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{b.name}</td>
                    <td className="px-4 py-3 text-right text-slate-400">#{i + 1}</td>
                    <td className="px-4 py-3 text-right font-mono">${(b.sales || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      <span className={clsx(b.variance > 0 ? "text-emerald-400" : b.variance < 0 ? "text-rose-400" : "text-blue-400")}>
                        {b.variance > 0 ? '+' : ''}{(b.variance || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">${(b.expenses || 0).toFixed(2)}</td>
                  </tr>
                ))}
                {branchAggregates.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No data available for comparison.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div ref={tableRef} className="bg-[#0a192f] border border-[#1e345e] rounded-xl p-6 shadow-xl lg:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-6">Recent Cash-Up Submissions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#061121] text-slate-400">
                <tr>
                  <th className="px-4 py-3 w-10"></th>
                  <th className="px-4 py-3 font-medium">Branch</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">Total Sales (USD)</th>
                  <th className="px-4 py-3 text-right font-medium">Variance (USD)</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e345e]">
                {sortedReconciliations.map(r => (
                  <React.Fragment key={r.id}>
                    <tr onClick={() => setViewReconId(r.id)} className="hover:bg-[#112240] transition-colors cursor-pointer group">
                      <td className="px-4 py-3">
                        <div className="p-1 rounded bg-[#0a192f] group-hover:bg-emerald-500/20 text-slate-500 group-hover:text-emerald-400 transition-colors flex items-center justify-center">
                          <FileText className="w-4 h-4" />
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-white">{branches.find(b => b.id === r.branchId)?.name || r.branchId}</td>
                      <td className="px-4 py-3 text-slate-300">{format(new Date(r.date), 'MMM d, yyyy')}</td>
                      <td className="px-4 py-3 text-right font-mono">${(Array.isArray(r.totalSales) ? r.totalSales.reduce((a,b)=>a+(b.usdEquivalent||0),0) : (r.totalSales?.usdEquivalent || 0)).toFixed(2)}</td>
                      <td className={clsx("px-4 py-3 text-right font-mono font-bold", 
                        (r.varianceUsd || 0) > 0 ? "text-emerald-400" :
                        (r.varianceUsd || 0) < 0 ? "text-rose-400" : "text-blue-400"
                      )}>
                        {(r.varianceUsd || 0) > 0 ? '+' : ''}{(r.varianceUsd || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={clsx("px-2 py-1 rounded text-xs font-semibold", 
                          r.status === 'APPROVED' ? "bg-emerald-500/20 text-emerald-400" :
                          r.status === 'FLAGGED' ? "bg-rose-500/20 text-rose-400" :
                          "bg-amber-500/20 text-amber-400"
                        )}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {viewReconId && (
        <ReconModal 
          recon={reconciliations.find(r => r.id === viewReconId)}
          onClose={() => setViewReconId(null)}
        />
      )}
    </div>
  );
}

function KPICard({ title, value, icon, trend, positive, valueColor = 'text-white' }: any) {
  return (
    <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl p-6 relative overflow-hidden group hover:border-[#2a457e] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_20px_rgba(0,0,0,0.5)] transition-all transform hover:-translate-y-1 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_12px_24px_rgba(52,211,153,0.1)]">
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-[#1e345e]/50 to-transparent rounded-full pointer-events-none group-hover:scale-110 transition-transform" />
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-slate-400 capitalize">{title}</h3>
        <div className="p-2 bg-[#112240] rounded-lg text-emerald-400 hidden group-hover:block">
           {icon}
        </div>
      </div>
      <div className={`text-3xl font-bold tracking-tight mb-2 ${valueColor}`}>{value}</div>
      {trend && (
        <div className={`text-xs font-medium ${positive === true ? 'text-emerald-400' : positive === false ? 'text-rose-400' : 'text-slate-500'}`}>
          {trend}
        </div>
      )}
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
              {item.description || 'Unnamed'} 
              {(item.amount || item.amount === 0) && <span className="text-slate-500 ml-1">({item.amount} {item.currencyCode})</span>}
            </span>
            <span className="text-slate-300 font-mono">${(item.usdEquivalent||0).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};


