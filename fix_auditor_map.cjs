const fs = require('fs');
let content = fs.readFileSync('src/pages/AuditorDashboard.tsx', 'utf8');

content = content.replace(
  /\{filteredRecon\.map\(\(r\) => \(\s*<tr/,
  '{filteredRecon.map((r) => (\n                <React.Fragment key={r.id}>\n                <tr'
);

content = content.replace(
  /<\/tr>\n\s*\)\}\s*\)\)}\s*<\/tbody>/,
  '</tr>\n                  )}\n                </React.Fragment>\n              ))}\n            </tbody>'
);

// We didn't use AnimatePresence in Auditor Dashboard originally, it was just a plain <tr> inside a map. Let's make sure it's valid too.
fs.writeFileSync('src/pages/AuditorDashboard.tsx', content);
console.log("Fixed Auditor map");
