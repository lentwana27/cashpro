const fs = require('fs');
let code = fs.readFileSync('src/pages/SystemBranches.tsx', 'utf8');

code = code.replace(/<p className="text-sm text-slate-400 mb-6">/g, 
  `<p className="text-sm text-slate-400 mb-4">`);

code = code.replace(/Select an existing Cashier \/ Till Operator to transfer them to <strong>\{selectedBranch\.name\}<\/strong>\. Their past history remains intact\.\s*<\/p>/g,
  `Select an existing Cashier / Till Operator to transfer them to <strong>{selectedBranch.name}</strong>. Their past history remains intact.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs p-3 rounded-lg mb-6 flex items-start gap-2">
              <span className="shrink-0 mt-0.5">ℹ️</span>
              <span>Need to add a completely new operator? Go to the <strong><a href="/users" className="underline hover:text-white">Users</a></strong> tab to register them first.</span>
            </div>`);

fs.writeFileSync('src/pages/SystemBranches.tsx', code);
