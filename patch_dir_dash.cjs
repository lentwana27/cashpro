const fs = require('fs');
let code = fs.readFileSync('src/pages/DirectorDashboard.tsx', 'utf8');

code = code.replace(/<\/div>\n\n        <div ref=\{tableRef\} className="bg-\[#0a192f\] border border-\[#1e345e\] rounded-xl p-4 sm:p-6 shadow-xl lg:col-span-2">/g, 
  `</div>\n        \n        <div className="lg:col-span-2">\n          <CashierShortageChart reconciliations={filteredReconciliations} branches={branches} />\n        </div>\n\n        <div ref={tableRef} className="bg-[#0a192f] border border-[#1e345e] rounded-xl p-4 sm:p-6 shadow-xl lg:col-span-2">`);
  
fs.writeFileSync('src/pages/DirectorDashboard.tsx', code);
