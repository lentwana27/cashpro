const fs = require('fs');
let code = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');

// replace Quick Log Modal
code = code.replace(/\{\/\* Quick Log Modal \*\/\}/g, `
      {history.length > 0 && (
         <CashierPerformance reconciliations={history} />
      )}
      {/* Quick Log Modal */}`);
      
fs.writeFileSync('src/pages/SupervisorDashboard.tsx', code);
