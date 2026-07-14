const fs = require('fs');
let code = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');

code = code.replace(/const usersData = arguments\[0\]\?\.\[3\] \|\| \[\]; \/\/ Actually we can just do another api\.get\n\s*api\.get\("\/users"\)\.then\(u => setCashiers\(u\.filter\(\(x: any\) => x\.role === 'CASHIER' && x\.branchId === user\?\.branchId\)\)\)\.catch\(\(\) => \{\}\);/g,
`      try {
        const u = await api.get('/users');
        setCashiers(u.filter((x: any) => x.role === 'CASHIER' && x.branchId === user?.branchId));
      } catch (e) {}`);

fs.writeFileSync('src/pages/SupervisorDashboard.tsx', code);
