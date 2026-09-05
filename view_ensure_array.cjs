const fs = require('fs');
const content = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');
const match = content.match(/const cashTillNames =[^;]+;/);
console.log(match ? match[0] : 'cashTillNames not found');
const match2 = content.match(/function ensureArray[^}]+}/);
console.log(match2 ? match2[0] : 'ensureArray not found');
