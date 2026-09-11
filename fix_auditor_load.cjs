const fs = require('fs');
let content = fs.readFileSync('src/pages/AuditorDashboard.tsx', 'utf8');

content = content.replace(
  `      const [recons, brs, rts] = await Promise.all([
        api.get('/rates'),
        api.get('/reconciliations'),
        api.get('/branches')
      ]);
      setReconciliations(recons);
      setBranches(brs);`,
  `      const [rtData, recData, brData] = await Promise.all([
        api.get('/rates'),
        api.get('/reconciliations'),
        api.get('/branches')
      ]);
      setRates(rtData);
      setReconciliations(recData);
      setBranches(brData);`
);

fs.writeFileSync('src/pages/AuditorDashboard.tsx', content);
