const fs = require('fs');
let content = fs.readFileSync('src/pages/AuditorDashboard.tsx', 'utf8');

if (!content.includes("framer-motion")) {
  content = content.replace(
    "import { useAuth } from '../components/AuthProvider';",
    "import { useAuth } from '../components/AuthProvider';\nimport { motion, AnimatePresence } from 'framer-motion';"
  );
}

if (!content.includes("AlertOctagon")) {
  content = content.replace("AlertTriangle }", "AlertTriangle, AlertOctagon }");
}

fs.writeFileSync('src/pages/AuditorDashboard.tsx', content);
console.log("Fixed imports again");
