import React, { useMemo } from 'react';
import { DailyReconciliation, Branch } from '../lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';

export function CashierShortageChart({ reconciliations, branches }: { reconciliations: DailyReconciliation[], branches: Branch[] }) {
  const chartData = useMemo(() => {
    const stats: Record<string, { cashierName: string, branchName: string, variance: number }> = {};

    reconciliations.forEach(r => {
      const branchName = branches.find(b => b.id === r.branchId)?.name || 'Unknown Branch';
      
      if (r.tillVariances && Array.isArray(r.tillVariances)) {
        r.tillVariances.forEach(tv => {
          if (!tv.cashierId) return;
          const key = `${tv.cashierId}-${r.branchId}`;
          if (!stats[key]) {
            stats[key] = { cashierName: tv.cashierName || 'Unknown', branchName, variance: 0 };
          }
          if ((tv.variance || 0) < 0) {
            stats[key].variance += (tv.variance || 0);
          }
        });
      }
    });
    
    const data = Object.values(stats)
      .filter(s => s.variance < -0.01)
      .map(s => ({
        name: `${s.cashierName} (${s.branchName})`,
        shortage: Math.abs(s.variance), 
        branch: s.branchName
      }))
      .sort((a, b) => b.shortage - a.shortage);
      
    return data;
  }, [reconciliations, branches]);

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl shadow-xl overflow-hidden mt-6">
      <div className="p-4 sm:p-6 border-b border-[#1e345e] bg-[#061121] flex justify-between items-center">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-rose-400" /> Cash Shortages by Till Operator
        </h2>
      </div>
      <div className="p-4 sm:p-6">
        <div className="h-80 w-full">
          <ResponsiveContainer minWidth={0} minHeight={0} width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e345e" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#94a3b8" 
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                stroke="#94a3b8" 
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                cursor={{ fill: '#112240' }}
                contentStyle={{ backgroundColor: '#061121', borderColor: '#1e345e', color: '#f8fafc', borderRadius: '0.5rem' }}
                itemStyle={{ color: '#fb7185' }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Shortage']}
                labelStyle={{ color: '#94a3b8', marginBottom: '0.5rem' }}
              />
              <Bar dataKey="shortage" name="Cash Shortage (USD)" fill="#f43f5e" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#f43f5e" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
