const fs = require('fs');
let code = fs.readFileSync('src/components/Layout.tsx', 'utf8');

// Also import Users icon if not already there, wait Users is already there from lucide-react. 
// I'll use Contact or UserSquare for the icon. Let's use `UserSquare`.
if (!code.includes('UserSquare')) {
  code = code.replace(/import \{ ([^}]+) \} from 'lucide-react';/, "import { $1, UserSquare } from 'lucide-react';");
}

code = code.replace(/<span className="font-medium">Branches<\/span>\s*<\/Link>/g, 
  `<span className="font-medium">Branches</span>
              </Link>
              <Link to="/till-operators" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-[#112240] hover:text-emerald-400 transition-colors">
                <UserSquare className="w-5 h-5" />
                <span className="font-medium">Till Operators</span>
              </Link>`);

// The mobile menu click handler might not be perfect for the second replacement, let's fix it if needed:
code = code.replace(/<span className="font-medium">Till Operators<\/span>\s*<\/Link>/g, match => {
  return match;
});

fs.writeFileSync('src/components/Layout.tsx', code);
