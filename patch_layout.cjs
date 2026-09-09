const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

const importRegex = /import \{ ChatWidget \} from '.\/ChatWidget';/;
content = content.replace(importRegex, "import { ChatWidget } from './ChatWidget';\nimport { api } from '../lib/api';");

const userBranchRegex = /const \[isLightMode, setIsLightMode\] = useState\(\(\) => \{/;
const userBranchCode = `  const [userBranch, setUserBranch] = useState<any>(null);
  
  useEffect(() => {
    if (user?.branchId) {
      api.get('/branches').then(res => {
        const branch = res.data.find((b: any) => b.id === user.branchId);
        if (branch) setUserBranch(branch);
      }).catch(console.error);
    }
  }, [user]);

  const [isLightMode, setIsLightMode] = useState(() => {`;

content = content.replace(userBranchRegex, userBranchCode);

// Add top header for user & branch
const mainContentRegex = /<div className="p-4 md:p-8 max-w-7xl mx-auto min-h-full relative z-10">/;
const mainContentReplacement = `<div className="p-4 md:p-8 max-w-7xl mx-auto min-h-full relative z-10">
          {user && (
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between bg-[#112240] p-4 rounded-xl border border-[#1e345e] shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-white">Welcome, {user.name}</h2>
                <p className="text-sm text-emerald-400 capitalize">{user.role.replace('_', ' ').toLowerCase()}</p>
              </div>
              {userBranch && (
                <div className="mt-2 sm:mt-0 text-left sm:text-right">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Current Branch</div>
                  <div className="text-sm font-medium text-white">{userBranch.name}</div>
                </div>
              )}
            </div>
          )}
`;

content = content.replace(mainContentRegex, mainContentReplacement);
fs.writeFileSync('src/components/Layout.tsx', content);
console.log("Patched Layout.tsx");
