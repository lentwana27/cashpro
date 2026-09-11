const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

content = content.replace(
  'className="flex-1 overflow-y-auto max-h-[500px] rounded-lg border border-[#1e345e] bg-[#061121]"',
  'className="flex-1 overflow-auto max-h-[500px] rounded-lg border border-[#1e345e] bg-[#061121]"'
);

// also let's check for any whitespace-nowrap missing
content = content.replace(
  '<table className="w-full text-left text-sm text-slate-300 relative">',
  '<table className="w-full text-left text-sm text-slate-300 relative whitespace-nowrap">'
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
