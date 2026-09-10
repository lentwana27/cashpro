const fs = require('fs');
let content = fs.readFileSync('src/pages/SystemUsers.tsx', 'utf8');

// 1. Add Search to imports
content = content.replace(
  "import { Pencil, Trash2, Plus, Lock } from 'lucide-react';",
  "import { Pencil, Trash2, Plus, Lock, Search } from 'lucide-react';"
);

// 2. Add searchQuery state
content = content.replace(
  "const [users, setUsers] = useState<User[]>([]);",
  "const [users, setUsers] = useState<User[]>([]);\n  const [searchQuery, setSearchQuery] = useState('');"
);

// 3. Add filteredUsers before return
content = content.replace(
  "return (",
  `const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (branches.find((b) => b.id === u.branchId)?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (`
);

// 4. Update the header to include the search input
const oldHeader = `<div className="p-4 sm:p-6 border-b border-[#1e345e] bg-[#061121]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" /> User Directory
          </h2>
        </div>`;
const newHeader = `<div className="p-4 sm:p-6 border-b border-[#1e345e] bg-[#061121] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 shrink-0">
            <Users className="w-5 h-5 text-blue-400" /> User Directory
          </h2>
          <div className="relative w-full sm:w-64 shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-500" />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#112240] border border-[#1e345e] text-white pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition-colors placeholder-slate-500"
            />
          </div>
        </div>`;
content = content.replace(oldHeader, newHeader);

// 5. Update users.map to filteredUsers.map
content = content.replace(/\{users\.map\(u => \(/g, "{filteredUsers.map(u => (");

// 6. Update users.length === 0 to filteredUsers.length === 0
content = content.replace(/\{users\.length === 0 && \(/g, "{filteredUsers.length === 0 && (");

fs.writeFileSync('src/pages/SystemUsers.tsx', content);
console.log("Patched SystemUsers.tsx");
