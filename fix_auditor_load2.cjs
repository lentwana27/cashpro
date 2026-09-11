const fs = require('fs');
let content = fs.readFileSync('src/pages/AuditorDashboard.tsx', 'utf8');

const oldLoad = `      const [recons, brs, rts] = await Promise.all([
        api.get('/rates'),
        api.get('/reconciliations'),
        api.get('/branches')
      ]);
      setReconciliations(recons);
      setBranches(brs);`;

const newLoad = `      const [rtData, recData, brData] = await Promise.all([
        api.get('/rates'),
        api.get('/reconciliations'),
        api.get('/branches')
      ]);
      setRates(rtData.data);
      setReconciliations(recData.data || recData);
      setBranches(brData.data || brData);`;

if(content.includes(oldLoad)) {
  content = content.replace(oldLoad, newLoad);
  fs.writeFileSync('src/pages/AuditorDashboard.tsx', content);
  console.log("Patched load");
} else {
  // Let's just do a regex replace
  content = content.replace(
    /const \[recons, brs, rts\] = await Promise\.all\(\[\s+api\.get\('\/rates'\),\s+api\.get\('\/reconciliations'\),\s+api\.get\('\/branches'\)\s+\]\);\s+setReconciliations\(recons\);\s+setBranches\(brs\);/m,
    newLoad
  );
  fs.writeFileSync('src/pages/AuditorDashboard.tsx', content);
  console.log("Patched load with regex");
}
