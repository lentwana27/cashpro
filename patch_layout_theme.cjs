const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

// 1. Add Sun, Moon to lucide-react imports
content = content.replace(
  "import { LogOut, LayoutDashboard, Building2, Users, FileText, Activity, UserSquare } from 'lucide-react';",
  "import { LogOut, LayoutDashboard, Building2, Users, FileText, Activity, UserSquare, Sun, Moon } from 'lucide-react';"
);

// 2. Add useEffect to React imports
content = content.replace(
  "import { ReactNode, useState } from 'react';",
  "import { ReactNode, useState, useEffect } from 'react';"
);

// 3. Add state and effect for theme
const themeLogic = `
  const [isLightMode, setIsLightMode] = useState(() => {
    return localStorage.getItem('theme') === 'light';
  });

  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLightMode]);
`;

content = content.replace(
  "const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);",
  "const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);\n" + themeLogic
);

// 4. Add the toggle button in the desktop sidebar
const toggleBtn = `
             <button
               onClick={() => setIsLightMode(!isLightMode)}
               className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-[#112240] transition-colors mb-2"
             >
               {isLightMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
               <span className="font-medium">{isLightMode ? 'Dark Mode' : 'Light Mode'}</span>
             </button>
`;

content = content.replace(
  /<button\s+onClick=\{logout\}\s+className="w-full flex items-center gap-3 px-4 py-3/g,
  toggleBtn + '\n             <button\n               onClick={logout}\n               className="w-full flex items-center gap-3 px-4 py-3'
);

// Wait, the regex replace might replace both mobile and desktop sign out buttons, which is perfect!

fs.writeFileSync('src/components/Layout.tsx', content);
console.log('Layout patched!');
