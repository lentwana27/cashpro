const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

content = content.replace(
  "import { Users, Building2, CheckCircle, ShieldCheck, MapPin, Edit3, X, Download, Database, Activity, Plus } from 'lucide-react';",
  "import { Users, Building2, CheckCircle, ShieldCheck, MapPin, Edit3, X, Download, Database, Activity, Plus, Trash2 } from 'lucide-react';"
);

const handleDeleteUserFn = `
  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(\`/users/\${id}\`);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to delete user');
    }
  };
`;

content = content.replace(
  "const approveUser = async (id: string) => {",
  handleDeleteUserFn + "\n  const approveUser = async (id: string) => {"
);

const deleteButton = `
                    <button 
                      onClick={() => handleDeleteUser(u.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 bg-[#0a192f] hover:bg-rose-500/10 rounded-lg transition-colors border border-[#1e345e]"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
`;

content = content.replace(
  '<Edit3 className="w-4 h-4" />\n                    </button>',
  '<Edit3 className="w-4 h-4" />\n                    </button>' + deleteButton
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
console.log('Patched AdminDashboard.tsx!');
