const fs = require('fs');
let content = fs.readFileSync('src/pages/AuditorDashboard.tsx', 'utf8');
content = content.replace(
  "ChevronUp, AlertTriangle } from 'lucide-react';",
  "ChevronUp, AlertTriangle, AlertOctagon } from 'lucide-react';"
);
fs.writeFileSync('src/pages/AuditorDashboard.tsx', content);
console.log("Patched AlertOctagon");
