const fs = require('fs');
let content = fs.readFileSync('src/pages/SystemUsers.tsx', 'utf8');

// Update conditions
content = content.replace(
  /\{\(currentUser\?.role === 'ADMIN' \|\| currentUser\?.role === 'SUPERVISOR'\) && \(/g,
  "{(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERVISOR' || currentUser?.role === 'AUDITOR') && ("
);

// Add new handler methods
const handleRequestDelete = `  const handleRequestDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to request deletion for this account? System Admin must confirm.')) return;
    try {
      await api.put(\`/users/\${id}\`, { pendingDeletion: true });
      loadUsersAndBranches();
    } catch (e: any) {
      alert(e.message || 'Failed to request deletion');
    }
  };

  const handleConfirmDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to PERMANENTLY delete this user?')) return;
    try {
      await api.delete(\`/users/\${id}\`);
      loadUsersAndBranches();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectDeleteUser = async (id: string) => {
    try {
      await api.put(\`/users/\${id}\`, { pendingDeletion: false });
      loadUsersAndBranches();
    } catch (e) {
      console.error(e);
    }
  };`;

content = content.replace(/const handleDeleteUser = async [\s\S]*?\};\n/, handleRequestDelete + '\n');

// Update buttons
const buttonsRegex = /<button \s*onClick=\{\(\) => handleDeleteUser\(u\.id\)\}[\s\S]*?<\/button>/;
const newButtons = `<div className="flex gap-2 mr-4">
                            {u.pendingDeletion && currentUser?.role === 'ADMIN' ? (
                              <>
                                <button 
                                  onClick={() => handleRejectDeleteUser(u.id)}
                                  className="p-1.5 bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 rounded-lg transition-colors"
                                  title="Reject Deletion"
                                >
                                  Cancel
                                </button>
                                <button 
                                  onClick={() => handleConfirmDeleteUser(u.id)}
                                  className="px-2 py-1 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-lg transition-colors"
                                  title="Confirm Delete"
                                >
                                  Confirm Deletion
                                </button>
                              </>
                            ) : currentUser?.role === 'ADMIN' ? (
                              <button 
                                onClick={() => handleConfirmDeleteUser(u.id)}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                               <button 
                                onClick={() => handleRequestDeleteUser(u.id)}
                                disabled={u.pendingDeletion}
                                className={"p-1.5 rounded-lg transition-colors " + (u.pendingDeletion ? "bg-slate-500/20 text-slate-500 cursor-not-allowed" : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400")}
                                title={u.pendingDeletion ? "Deletion Requested" : "Request Deletion"}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>`;
                          
content = content.replace(buttonsRegex, newButtons);

// Need to also show a badge for "Pending Deletion"
const activeBadgeRegex = /<span className=\{\`inline-flex items-center px-2\.5 py-0\.5 rounded-full text-xs font-medium \$\{[\s\S]*?<\/span>/;
const newActiveBadge = `<div className="flex flex-col gap-1 items-start">
                        <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${u.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}\`}>
                          {u.active ? 'Active' : 'Inactive'}
                        </span>
                        {u.pendingDeletion && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            Pending Deletion
                          </span>
                        )}
                      </div>`;

content = content.replace(activeBadgeRegex, newActiveBadge);

fs.writeFileSync('src/pages/SystemUsers.tsx', content);
