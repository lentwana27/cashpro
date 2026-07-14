const fs = require('fs');
let code = fs.readFileSync('src/pages/SystemBranches.tsx', 'utf8');

if (!code.includes('getTillOperatorsForBranch')) {
  code = code.replace(/const getCashUpsForSupervisorAndBranch = \(supId: string, bId: string\) => \{/g, 
  `const getTillOperatorsForBranch = (bId: string) => {
    const currentAssigned = users.filter(u => u.branchId === bId && u.role === 'CASHIER');
    const branchRecons = reconciliations.filter(r => r.branchId === bId);
    
    const pastOperatorIds = new Set<string>();
    branchRecons.forEach(r => {
      r.tillVariances?.forEach(tv => {
        if (tv.cashierId) pastOperatorIds.add(tv.cashierId);
      });
    });

    const allRelated = [...currentAssigned];
    pastOperatorIds.forEach(uid => {
      if (uid && !allRelated.some(u => u.id === uid)) {
        const u = users.find(x => x.id === uid);
        if (u) allRelated.push(u);
      }
    });

    return allRelated;
  };

  const getTillVariancesForOperatorAndBranch = (operatorId: string, bId: string) => {
    const branchRecons = reconciliations.filter(r => r.branchId === bId);
    let operatorRecords: any[] = [];
    
    branchRecons.forEach(r => {
      const tvs = r.tillVariances?.filter(tv => tv.cashierId === operatorId) || [];
      tvs.forEach(tv => {
        operatorRecords.push({
          date: r.date,
          status: r.status,
          reconId: r.id,
          varianceUsd: tv.variance,
          expected: tv.expected,
          actual: tv.actual,
          tillName: tv.tillName
        });
      });
    });
    
    return operatorRecords.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getCashUpsForSupervisorAndBranch = (supId: string, bId: string) => {`);
  fs.writeFileSync('src/pages/SystemBranches.tsx', code);
}
