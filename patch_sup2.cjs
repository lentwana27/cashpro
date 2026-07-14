const fs = require('fs');
let code = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');

code = code.replace(/const \[ratesData, recsData, locsData\] = await Promise\.all\(\[\s*api\.get\("\/rates"\),\s*api\.get\("\/reconciliations"\),\s*api\.get\("\/users"\),\s*user\?\.branchId \? api\.get\("\/branches"\) : Promise\.resolve\(\[\]\),\s*\]\);/, `const [ratesData, recsData, locsData] = await Promise.all([
        api.get("/rates"),
        api.get("/reconciliations"),
        user?.branchId ? api.get("/branches") : Promise.resolve([]),
      ]);`);

fs.writeFileSync('src/pages/SupervisorDashboard.tsx', code);
