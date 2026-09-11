const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

content = content.replace(
  '<div className="flex flex-col md:flex-row h-screen bg-[#061121] text-slate-200 overflow-hidden font-sans">',
  '<div className="flex flex-col md:flex-row h-screen h-[100dvh] bg-[#061121] text-slate-200 overflow-hidden font-sans w-full max-w-[100vw]">'
);

content = content.replace(
  '<main className="flex-1 overflow-y-auto relative z-10 w-full overflow-x-hidden">',
  '<main className="flex-1 min-w-0 min-h-0 overflow-y-auto relative z-10 w-full overflow-x-hidden">'
);

fs.writeFileSync('src/components/Layout.tsx', content);
