const fs = require('fs');

function patchFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/<ResponsiveContainer(.*?)>/g, (match) => {
    if (match.includes('minWidth')) return match;
    return match.replace('<ResponsiveContainer', '<ResponsiveContainer minWidth={0} minHeight={0}');
  });
  
  // also let's change width="100%" height="100%" to also have aspect ratio maybe?
  fs.writeFileSync(file, content);
  console.log('Patched', file);
}

patchFile('src/components/CashierShortageChart.tsx');
patchFile('src/pages/DirectorDashboard.tsx');
patchFile('src/pages/SystemBranches.tsx');
