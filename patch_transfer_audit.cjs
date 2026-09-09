const fs = require('fs');
let content = fs.readFileSync('src/pages/SystemUsers.tsx', 'utf8');

const transferFn = `
  const handleTransferToAudit = async (id: string) => {
    if (!confirm('Are you sure you want to transfer this user to Audit (change role to AUDITOR)?')) return;
    try {
      await api.put(\`/users/\${id}\`, { role: 'AUDITOR' });
      loadUsersAndBranches();
    } catch (e: any) {
      alert(e.message || 'Failed to transfer user');
    }
  };

  const handleDeleteUser = async (id: string) => {`;

content = content.replace("  const handleDeleteUser = async (id: string) => {", transferFn);

const transferBtn = `
                          <button 
                            onClick={() => handleTransferToAudit(u.id)}
                            className="p-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg mr-2 transition-colors"
                            title="Transfer to Audit"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(u.id)}`;

content = content.replace("                          <button \n                            onClick={() => handleDeleteUser(u.id)}", transferBtn);

// Ensure ShieldAlert is imported
if (!content.includes('ShieldAlert')) {
  content = content.replace('Trash2, ShieldCheck, Search, Activity, Mail', 'Trash2, ShieldCheck, Search, Activity, Mail, ShieldAlert');
}

fs.writeFileSync('src/pages/SystemUsers.tsx', content);
