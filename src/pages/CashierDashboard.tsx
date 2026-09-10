import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../components/AuthProvider';
import { Activity } from 'lucide-react';

export function CashierDashboard() {
  const { user } = useAuth();
  const [branchName, setBranchName] = useState<string>('');

  useEffect(() => {
    if (user?.branchId) {
      api.get('/branches').then(branches => {
        const b = (branches || []).find((x: any) => x.id === user.branchId);
        if (b) setBranchName(b.name);
      }).catch(console.error);
    }
  }, [user]);

  
  return (
    <div className="space-y-6">
      <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl p-8 text-center max-w-2xl mx-auto mt-10">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Activity className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Welcome, {user?.name}</h1>
        <p className="text-slate-400 mb-6">
          You are logged in as a Till Operator (Cashier). Your reconciliations and till variances are managed by your Branch Supervisor.
        </p>
        <div className="bg-[#061121] rounded-lg p-6 border border-[#1e345e] inline-block text-left w-full">
          <h3 className="text-lg font-semibold text-white mb-4">Your Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between border-b border-[#1e345e] pb-2">
              <span className="text-slate-400">Name:</span>
              <span className="text-white font-medium">{user?.name}</span>
            </div>
            <div className="flex justify-between border-b border-[#1e345e] pb-2">
              <span className="text-slate-400">Email:</span>
              <span className="text-white font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-slate-400">Role:</span>
              <span className="text-emerald-400 font-medium">Cashier / Till Operator</span>
            </div>
            <div className="flex justify-between pb-2 mt-2">
              <span className="text-slate-400">Allocated Branch:</span>
              <span className="text-blue-400 font-medium">{branchName || user?.branchId || 'Not Assigned'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
