const fs = require('fs');

let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');
code = code.replace(
  'Last seen: {new Date(u.lastSeen).toLocaleTimeString([], {hour: \'2-digit\', minute:\'2-digit\'})}',
  'Last seen: {u.lastSeen ? safeFormat(u.lastSeen, "HH:mm") : "Never"}'
);
fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
