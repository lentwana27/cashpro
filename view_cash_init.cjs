const fs = require('fs');
const content = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');
const match = content.match(/const \[cashBreakdown, setCashBreakdown\] = useState[^;]+;/);
console.log(match ? match[0] : 'Not found');
