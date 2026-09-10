const fs = require('fs');
let content = fs.readFileSync('src/pages/DashboardRouter.tsx', 'utf8');

content = content.replace(
  "branches.find(b => b.id === activeBranchId)?.name || 'Loading branch...'",
  "activeBranchId ? (branches.find(b => b.id === activeBranchId)?.name || 'Loading branch...') : 'No Branch Assigned'"
);

fs.writeFileSync('src/pages/DashboardRouter.tsx', content);
console.log("Patched!");
