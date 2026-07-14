const fs = require('fs');
let code = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');

code = code.replace(
  `const [branch, setBranch] = useState<any>(null);`,
  `const [branch, setBranch] = useState<any>(null);\n  const [branches, setBranches] = useState<any[]>([]);`
);

code = code.replace(
  `const data = await api.get('/branches');\n        const myBranch = data.find((b: any) => b.id === user?.branchId);\n        if (myBranch) setBranch(myBranch);`,
  `const data = await api.get('/branches');\n        setBranches(data);\n        const myBranch = data.find((b: any) => b.id === user?.branchId);\n        if (myBranch) setBranch(myBranch);`
);

fs.writeFileSync('src/pages/SupervisorDashboard.tsx', code);
