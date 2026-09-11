const fs = require('fs');
let content = fs.readFileSync('src/pages/AuditorDashboard.tsx', 'utf8');

// add useAuth
if (!content.includes('useAuth')) {
  content = content.replace(
    "import { format } from 'date-fns';",
    "import { format } from 'date-fns';\nimport { useAuth } from '../components/AuthProvider';"
  );
}

// add rates state & current user
if (!content.includes('const { user } = useAuth();')) {
  content = content.replace(
    "const [expandedId, setExpandedId] = useState<string | null>(null);",
    "const [expandedId, setExpandedId] = useState<string | null>(null);\n  const [rates, setRates] = useState<any[]>([]);\n  const [editingSalesId, setEditingSalesId] = useState<string | null>(null);\n  const { user } = useAuth();"
  );
}

// update loadData to load rates
if (!content.includes("api.get('/rates')")) {
  content = content.replace(
    "const [recons, brs] = await Promise.all([",
    "const [recons, brs, rts] = await Promise.all([\n        api.get('/rates'),\n"
  );
  content = content.replace(
    "api.get('/reconciliations'),\n        api.get('/branches')",
    "api.get('/reconciliations'),\n        api.get('/branches')"
  );
  // Actually, let's just do it cleanly
}

fs.writeFileSync('src/pages/AuditorDashboard.tsx', content);
console.log("Patched imports");
