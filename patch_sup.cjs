const fs = require('fs');
let code = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');

// We need to add cashiers state and load them
code = code.replace(/const \[branch, setBranch\] = useState<any>\(null\);/, `const [branch, setBranch] = useState<any>(null);
  const [cashiers, setCashiers] = useState<any[]>([]);`);

code = code.replace(/api\.get\("\/reconciliations"\),/, `api.get("/reconciliations"),
        api.get("/users"),`);

code = code.replace(/setRates\(ratesData\);/, `setRates(ratesData);
      const usersData = arguments[0]?.[3] || []; // Actually we can just do another api.get
      api.get("/users").then(u => setCashiers(u.filter((x: any) => x.role === 'CASHIER' && x.branchId === user?.branchId))).catch(() => {});
      `);

fs.writeFileSync('src/pages/SupervisorDashboard.tsx', code);
