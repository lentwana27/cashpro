import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { api } from '../lib/api';
import { DailyReconciliation, Branch } from '../lib/types';
import { CashierPerformance } from '../components/CashierPerformance';
import { CashierShortageChart } from '../components/CashierShortageChart';
import { CashierMonthlyPerformance } from '../components/CashierMonthlyPerformance';
import { Users, AlertTriangle } from 'lucide-react';

export function TillOperators() {
  const { user } = useAuth();
  const [reconciliations, setReconciliations] = useState<DailyReconciliation[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [reconData, branchData] = await Promise.all([
        api.get('/reconciliations'),
        api.get('/branches')
      ]);
      
      let filteredRecon = reconData;
      if (user?.role === 'SUPERVISOR') {
        filteredRecon = (reconData || []).filter((r: any) => r.branchId === user.branchId);
      }
      
      setReconciliations(filteredRecon);
      setBranches(branchData);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Users className="w-8 h-8 text-indigo-400" /> Till Operators Performance
        </h1>
        <p className="text-slate-400 mt-1">Compare cashier variances and cash shortages across your branches.</p>
      </div>

      <CashierShortageChart reconciliations={reconciliations} branches={branches} />
      <CashierMonthlyPerformance reconciliations={reconciliations} branches={branches} />
      <CashierPerformance reconciliations={reconciliations} branches={branches} />
    </div>
  );
}
