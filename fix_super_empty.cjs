const fs = require('fs');
let code = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');

code = code.replace(/\{history\.length > 0 && \(\s*\)\}/g, "");

fs.writeFileSync('src/pages/SupervisorDashboard.tsx', code);
