const fs = require('fs');
let code = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');

// The call site for MissingSalesForm is:
// <MissingSalesForm recon={submitted} rates={rates} branch={branch} onCancel={() => setSubmitted(null)} onSuccess={() => { ... }} />
// I should pass cashiers={cashiers} to it.

code = code.replace(/<MissingSalesForm\s+recon=\{submitted\}\s+rates=\{rates\}\s+branch=\{branch\}\s+onCancel/g, 
  "<MissingSalesForm recon={submitted} rates={rates} branch={branch} cashiers={cashiers} onCancel");

code = code.replace(/function MissingSalesForm\(\{ recon, rates, branch, onCancel, onSuccess \}: any\) \{/g, 
  "function MissingSalesForm({ recon, rates, branch, cashiers, onCancel, onSuccess }: any) {\n  const [tillVariances, setTillVariances] = useState<any[]>(recon?.tillVariances || []);\n  const cashBreakdown = recon?.cashBreakdown || [];");

// We need to add import for useState if it's not present inside the function, but it's already at file level.

fs.writeFileSync('src/pages/SupervisorDashboard.tsx', code);
