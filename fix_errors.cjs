const fs = require('fs');

// 1. AccountantDashboard.tsx
let acct = fs.readFileSync('src/pages/AccountantDashboard.tsx', 'utf8');
acct = acct.replace(
  "const updates = { accountantAmendmentApproval: true };",
  "const updates: any = { accountantAmendmentApproval: true };"
);
fs.writeFileSync('src/pages/AccountantDashboard.tsx', acct);

// 2. SupervisorDashboard.tsx
let sup = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');
sup = sup.replace(
  "function CashUpForm({",
  "function CashUpForm({ currentUser,"
);
sup = sup.replace(
  "<CashUpForm",
  "<CashUpForm currentUser={user}"
);
sup = sup.replace(
  "salesInputtedBy: existingData?.salesInputtedBy || user?.id,",
  "salesInputtedBy: existingData?.salesInputtedBy || currentUser?.id,"
);
sup = sup.replace(
  "salesInputtedByName: existingData?.salesInputtedByName || user?.name,",
  "salesInputtedByName: existingData?.salesInputtedByName || currentUser?.name,"
);
fs.writeFileSync('src/pages/SupervisorDashboard.tsx', sup);

// 3. AuditorDashboard.tsx
let aud = fs.readFileSync('src/pages/AuditorDashboard.tsx', 'utf8');
aud = aud.replace(
  "const updates = { auditorAmendmentApproval: true };",
  "const updates: any = { auditorAmendmentApproval: true };"
);

// Add missing imports
if (!aud.includes("motion")) {
  aud = aud.replace(
    "import { format } from 'date-fns';",
    "import { format } from 'date-fns';\nimport { motion, AnimatePresence } from 'framer-motion';"
  );
}
if (!aud.includes("AlertOctagon")) {
  aud = aud.replace("AlertTriangle }", "AlertTriangle, AlertOctagon }");
}

// Ensure editingSalesId and user are defined inside AuditorDashboard
if (!aud.includes("const [editingSalesId")) {
  aud = aud.replace(
    "const [expandedId, setExpandedId] = useState<string | null>(null);",
    "const [expandedId, setExpandedId] = useState<string | null>(null);\n  const [rates, setRates] = useState<any[]>([]);\n  const [editingSalesId, setEditingSalesId] = useState<string | null>(null);\n  const { user } = useAuth();"
  );
}

fs.writeFileSync('src/pages/AuditorDashboard.tsx', aud);

console.log("Fixed errors");
