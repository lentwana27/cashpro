const fs = require('fs');
let content = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');

content = content.replace(
  /\{history\.map\(\(r\) => \(\s*<tr/,
  '{history.map((r) => (\n                <React.Fragment key={r.id}>\n                <tr'
);

content = content.replace(
  /<\/AnimatePresence>\s*\)\)}\s*\{history\.length === 0 && \(/,
  '</AnimatePresence>\n                </React.Fragment>\n              ))}\n              {history.length === 0 && ('
);

fs.writeFileSync('src/pages/SupervisorDashboard.tsx', content);
console.log("Fixed SupervisorDashboard map");
