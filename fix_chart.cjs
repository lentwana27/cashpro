const fs = require('fs');

function fixChart(file) {
  let code = fs.readFileSync(file, 'utf8');
  
  // Remove from BreakdownSection if present
  code = code.replace(/<CashierPerformance reconciliations=\{filteredReconciliations\} \/>\n        <CashierShortageChart reconciliations=\{filteredReconciliations\} branches=\{branches\} \/>/g, "");
  
  // Find where CashierPerformance actually was!
  // Wait, did DirectorDashboard even have CashierPerformance?
  // Let me check if it's there.
  
  fs.writeFileSync(file, code);
}

fixChart('src/pages/DirectorDashboard.tsx');
fixChart('src/pages/AuditorDashboard.tsx');
