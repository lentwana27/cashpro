const fs = require('fs');
let content = fs.readFileSync('src/pages/DashboardRouter.tsx', 'utf8');

content = content.replace(
  /const \[activeBranchId, setActiveBranchId\] = useState<string>\(user\?\.branchId \|\| ''\);/g,
  "const activeBranchId = user?.branchId || '';"
);

// We need to change the select dropdown to just a div.
const oldSelect = \`<select
            value={activeBranchId}
            onChange={(e) => setActiveBranchId(e.target.value)}
            className="bg-[#061121] border border-[#1e345e] text-white px-4 py-2 rounded-lg focus:outline-none focus:border-emerald-500 min-w-[200px]"
          >
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name} ({b.id})</option>
            ))}
            {branches.length === 0 && <option value={activeBranchId}>Loading branches...</option>}
          </select>\`;

const newSelect = \`<div className="bg-[#061121] border border-[#1e345e] text-white px-4 py-2 rounded-lg font-bold">
            {branches.find(b => b.id === activeBranchId)?.name || 'Loading branch...'}
          </div>\`;

content = content.replace(oldSelect, newSelect);

// Remove the set active branch logic from useEffect
content = content.replace(
  /if \(!activeBranchId && br\.length > 0\) \{\s+setActiveBranchId\(br\[0\]\.id\);\s+\}/g,
  ""
);

fs.writeFileSync('src/pages/DashboardRouter.tsx', content);
console.log("Patched!");
