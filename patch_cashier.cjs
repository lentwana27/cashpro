const fs = require('fs');

let cp = fs.readFileSync('src/components/CashierPerformance.tsx', 'utf8');
cp = cp.replace(/startDate: string, endDate: string /, '');
cp = cp.replace(/startDate, endDate /, '');
fs.writeFileSync('src/components/CashierPerformance.tsx', cp);

function removeProps(file) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/startDate=\{startDate\} endDate=\{endDate\} /g, '');
  fs.writeFileSync(file, code);
}

removeProps('src/pages/DirectorDashboard.tsx');
try { removeProps('src/pages/AccountantDashboard.tsx'); } catch(e){}
try { removeProps('src/pages/AdminDashboard.tsx'); } catch(e){}
