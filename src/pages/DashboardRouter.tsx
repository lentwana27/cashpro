import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../components/AuthProvider';
import { AdminDashboard } from './AdminDashboard';
import { AccountantDashboard } from './AccountantDashboard';
import { DirectorDashboard } from './DirectorDashboard';
import { SupervisorDashboard } from './SupervisorDashboard';
import { AuditorDashboard } from './AuditorDashboard';
import { CashierDashboard } from './CashierDashboard';
import { api } from '../lib/api';
import { Activity, DollarSign, AlertCircle, Building2 } from 'lucide-react';
import clsx from 'clsx';

function SupervisorWrapper() {
  const { user } = useAuth();
  const [branches, setBranches] = useState<any[]>([]);
  const [recons, setRecons] = useState<any[]>([]);
  const activeBranchId = user?.branchId || '';

  useEffect(() => {
    Promise.all([
      api.get('/branches'),
      api.get('/reconciliations')
    ]).then(([br, recs]) => {
      setBranches(br);
      setRecons(recs);
    }).catch(console.error);
  }, []);

  const stats = useMemo(() => {
    if (!activeBranchId) return { sales: 0, variance: 0, count: 0 };
    const branchRecs = (recons || []).filter((r: any) => r.branchId === activeBranchId);
    let sales = 0;
    let variance = 0;
    branchRecs.forEach((r: any) => {
      sales += (Array.isArray(r.totalSales) ? r.totalSales.reduce((a:number,b:any)=>a+(b.usdEquivalent||0),0) : (r.totalSales?.usdEquivalent || 0));
      variance += (r.varianceUsd || 0);
    });
    return { sales, variance, count: branchRecs.length };
  }, [recons, activeBranchId]);

  return (
    <div className="space-y-6">
      <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" /> Branch Overview
            </h2>
            <p className="text-sm text-slate-400 mt-1">Select a branch to view specific performance metrics and manage cash-ups.</p>
          </div>
          <div className="bg-[#061121] border border-[#1e345e] text-white px-4 py-2 rounded-lg font-bold">
            {activeBranchId ? ((branches || []).find(b => b.id === activeBranchId)?.name || 'Loading branch...') : 'No Branch Assigned'}
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#061121] rounded-lg p-4 border border-[#1e345e]">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Sales</div>
            <div className="text-2xl font-black text-white">${stats.sales.toFixed(2)}</div>
          </div>
          <div className="bg-[#061121] rounded-lg p-4 border border-[#1e345e]">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Variance</div>
            <div className={clsx("text-2xl font-black", stats.variance > 0 ? "text-emerald-400" : stats.variance < 0 ? "text-rose-400" : "text-blue-400")}>
              {stats.variance > 0 ? '+' : ''}{stats.variance.toFixed(2)}
            </div>
          </div>
          <div className="bg-[#061121] rounded-lg p-4 border border-[#1e345e]">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Cash-ups Submitted</div>
            <div className="text-2xl font-black text-indigo-400">{stats.count}</div>
          </div>
        </div>
      </div>
      
      {activeBranchId && <SupervisorDashboard branchIdOverride={activeBranchId} />}
    </div>
  );
}

export function DashboardRouter() {
  const { user } = useAuth();
  switch (user?.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'ACCOUNTANT':
    case 'HEAD_ACCOUNTANT':
      return <AccountantDashboard />;
    case 'DIRECTOR':
      return <DirectorDashboard />;
    case 'SUPERVISOR':
      return <SupervisorWrapper />;
    case 'AUDITOR':
      return <AuditorDashboard />;
    case 'CASHIER':
      return <CashierDashboard />;
    default:
      return <div>Access Denied</div>;
  }
}
