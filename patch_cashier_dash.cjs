const fs = require('fs');
let content = fs.readFileSync('src/pages/CashierDashboard.tsx', 'utf8');

const importRegex = /import React from 'react';/;
content = content.replace(importRegex, "import React, { useState, useEffect } from 'react';\nimport { api } from '../lib/api';");

const fnRegex = /export function CashierDashboard\(\) \{(\s+)const \{ user \} = useAuth\(\);/;
const fnReplace = `export function CashierDashboard() {
  const { user } = useAuth();
  const [branchName, setBranchName] = useState<string>('');

  useEffect(() => {
    if (user?.branchId) {
      api.get('/branches').then(branches => {
        const b = branches.find((x: any) => x.id === user.branchId);
        if (b) setBranchName(b.name);
      }).catch(console.error);
    }
  }, [user]);
`;
content = content.replace(fnRegex, fnReplace);

const roleRowRegex = /<span className="text-emerald-400 font-medium">Cashier \/ Till Operator<\/span>\s*<\/div>/;
const roleRowReplace = `<span className="text-emerald-400 font-medium">Cashier / Till Operator</span>
            </div>
            <div className="flex justify-between pb-2 mt-2">
              <span className="text-slate-400">Allocated Branch:</span>
              <span className="text-blue-400 font-medium">{branchName || user?.branchId || 'Not Assigned'}</span>
            </div>`;
content = content.replace(roleRowRegex, roleRowReplace);

fs.writeFileSync('src/pages/CashierDashboard.tsx', content);
console.log('Patched CashierDashboard.tsx!');
