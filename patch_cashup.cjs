const fs = require('fs');
let code = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');

// We need to inject `cashiers` into CashUpForm
code = code.replace(/<CashUpForm\n/g, '<CashUpForm\n          cashiers={cashiers}\n');

// Update CashUpForm props
code = code.replace(/function CashUpForm\(\{\n  branch,\n  branchId,\n  supervisorId,\n  date,\n  rates,\n  existingData,\n  quickLogs = \[\],\n  onClearLogs,\n  onCancel,\n  onSuccess,\n\}: any\) {/g, `function CashUpForm({
  branch,
  cashiers = [],
  branchId,
  supervisorId,
  date,
  rates,
  existingData,
  quickLogs = [],
  onClearLogs,
  onCancel,
  onSuccess,
}: any) {`);

// Add tillVariances state to CashUpForm
code = code.replace(/const \[cashBreakdown, setCashBreakdown\] = useState<ReconLineItem\[\]>\([\s\S]*?ensureArray\(existingData\?\.tillCashBreakdown, cashTillNames\),\n  \);/, `const [cashBreakdown, setCashBreakdown] = useState<ReconLineItem[]>(
    ensureArray(existingData?.tillCashBreakdown, cashTillNames),
  );
  const [tillVariances, setTillVariances] = useState<any[]>(
    existingData?.tillVariances || (branch?.hasTills && branch.tills?.length > 0 ? branch.tills.map((t: any) => ({ tillId: t.id, tillName: t.name, cashierId: '', cashierName: '', expected: 0, actual: 0, variance: 0 })) : [])
  );
  `);

// Update handleSubmit to calculate tillVariances
code = code.replace(/const variance = cashTotalUsd - expected;\n\s*await api\.put\(`\/reconciliations\/\$\{recon\.id\}`/g, `const variance = cashTotalUsd - expected;
      
      const computedTillVariances = tillVariances.map((tv: any, idx: number) => {
        const tillSales = updatedTotalSales[idx]?.usdEquivalent || 0;
        const tillCash = cashBreakdown[idx]?.usdEquivalent || 0;
        const cashier = cashiers.find((c: any) => c.id === tv.cashierId);
        return {
          ...tv,
          cashierName: cashier?.name || 'Unknown',
          expected: tillSales,
          actual: tillCash,
          variance: tillCash - tillSales
        };
      });

      await api.put(\`/reconciliations/\${recon.id}\``);

code = code.replace(/varianceUsd: variance,\n\s*salesConfirmed: true,\n\s*\}\);/g, `varianceUsd: variance,
        tillVariances: computedTillVariances,
        salesConfirmed: true,
      });`);


const uiInjection = `
      {branch?.hasTills && branch.tills?.length > 0 && (
        <div className="bg-[#112240] p-4 rounded-xl border border-blue-500/20 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">Till & Cashier Assignment</h3>
          <div className="space-y-4">
            {tillVariances.map((tv: any, idx: number) => (
              <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 bg-[#0a192f] rounded-lg border border-[#1e345e]">
                <div className="font-medium text-blue-400 w-1/3">{tv.tillName}</div>
                <div className="flex-1 w-full">
                  <select 
                    value={tv.cashierId || ''} 
                    onChange={e => {
                      const newVars = [...tillVariances];
                      newVars[idx].cashierId = e.target.value;
                      setTillVariances(newVars);
                    }}
                    className="w-full bg-[#061121] border border-[#1e345e] rounded-lg p-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Cashier for {tv.tillName}...</option>
                    {cashiers.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
`;

code = code.replace(/<ReconListField\n\s*title="Total Sales \(from POS System\)"/g, uiInjection + '\n        <ReconListField\n          title="Total Sales (from POS System)"');

fs.writeFileSync('src/pages/SupervisorDashboard.tsx', code);
