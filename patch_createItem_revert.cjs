const fs = require('fs');
let code = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');

code = code.replace(
/currencyCode: desc\.includes\("\([^)]*\)"\) \? "[^"]*" : "USD",/g,
`currencyCode: "USD",`
);

fs.writeFileSync('src/pages/SupervisorDashboard.tsx', code);
