const fs = require('fs');
let code = fs.readFileSync('src/pages/SystemUsers.tsx', 'utf8');

const importLines = `
import { Branch } from '../lib/types';
import { Pencil, Trash2, Plus, Lock } from 'lucide-react';
`;
code = code.replace("import { useAuth } from '../components/AuthProvider';", "import { useAuth } from '../components/AuthProvider';" + importLines);

const stateVars = `
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editUser, setEditUser] = useState<Partial<User> | null>(null);
  const [userPassword, setUserPassword] = useState('');
`;

code = code.replace("const [success, setSuccess] = useState(false);", "const [success, setSuccess] = useState(false);" + stateVars);

const loadFn = `
  const loadUsersAndBranches = async () => {
    try {
      const [usrs, brnchs] = await Promise.all([
        api.get('/users'),
        api.get('/branches')
      ]);
      setBranches(brnchs);
      
      if (currentUser?.role === 'SUPERVISOR') {
        setUsers(usrs.filter((u: User) => u.role === 'CASHIER' && u.branchId === currentUser.branchId && u.id !== currentUser.id));
      } else {
        setUsers(usrs.filter((u: User) => u.id !== currentUser?.id));
      }
    } catch(e) {}
  };
`;
code = code.replace(/const loadUsers = async \(\) => \{[\s\S]*?\};/, loadFn);
code = code.replace(/loadUsers\(\);/g, "loadUsersAndBranches();");
code = code.replace(/loadUsers, 30000/g, "loadUsersAndBranches, 30000");

const saveUserFn = `
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    
    try {
      if (editUser.id) {
        // Update
        const payload = { ...editUser };
        if (userPassword) payload.password = userPassword;
        await api.put(\`/users/\${editUser.id}\`, payload);
      } else {
        // Create
        await api.post('/users', {
          name: editUser.name,
          email: editUser.email,
          password: userPassword || 'password123',
          role: editUser.role || 'CASHIER',
          branchId: editUser.branchId || ''
        });
      }
      setShowUserModal(false);
      setEditUser(null);
      setUserPassword('');
      loadUsersAndBranches();
    } catch (e: any) {
      alert(e.message || 'Failed to save user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(\`/users/\${id}\`);
      loadUsersAndBranches();
    } catch (e) {
      console.error(e);
    }
  };
`;

code = code.replace("const handleSendAlert = async () => {", saveUserFn + "\n  const handleSendAlert = async () => {");

const buttonReplace = `
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">System Users</h1>
          <p className="text-slate-400 mt-1">Manage users, till operators, and access.</p>
        </div>
        {currentUser?.role === 'ADMIN' && (
          <button 
            onClick={() => {
              setEditUser({ role: 'CASHIER', active: true });
              setUserPassword('');
              setShowUserModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" /> Add User
          </button>
        )}
      </div>
`;

code = code.replace(/<div className="flex items-center justify-between">\s*<div>\s*<h1 className="text-3xl font-bold text-white tracking-tight">System Users<\/h1>\s*<p className="text-slate-400 mt-1">Monitor active sessions and send alerts to staff\.<\/p>\s*<\/div>\s*<\/div>/, buttonReplace);

const editButtonsReplace = `
                    <td className="px-6 py-4 text-right">
                      {currentUser?.role === 'ADMIN' && (
                        <>
                          <button 
                            onClick={() => {
                              setEditUser(u);
                              setUserPassword('');
                              setShowUserModal(true);
                            }}
                            className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg mr-2 transition-colors"
                            title="Edit User"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg mr-4 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button 
`;

code = code.replace(/<td className="px-6 py-4 text-right">\s*<button/, editButtonsReplace);

const branchTextReplace = `
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[10px] uppercase font-bold tracking-wider inline-block w-max">
                          {u.role}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {branches.find(b => b.id === u.branchId)?.name || 'No Branch'}
                        </span>
                      </div>
                    </td>
`;

code = code.replace(/<td className="px-6 py-4">\s*<span className="px-2 py-1 bg-blue-500\/10 text-blue-400 border border-blue-500\/20 rounded text-\[10px\] uppercase font-bold tracking-wider">\s*\{u\.role\}\s*<\/span>\s*<\/td>/, branchTextReplace);


const modalHtml = `
      {showUserModal && editUser && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {editUser.id ? 'Edit User' : 'Add New User'}
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">Full Name</label>
                <input 
                  type="text" 
                  required 
                  value={editUser.name || ''} 
                  onChange={e => setEditUser({...editUser, name: e.target.value})}
                  className="w-full bg-[#061121] border border-[#1e345e] text-white p-2.5 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">Email</label>
                <input 
                  type="email" 
                  required 
                  value={editUser.email || ''} 
                  onChange={e => setEditUser({...editUser, email: e.target.value})}
                  className="w-full bg-[#061121] border border-[#1e345e] text-white p-2.5 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">
                  {editUser.id ? 'New Password (Optional)' : 'Password'}
                </label>
                <input 
                  type="password" 
                  required={!editUser.id}
                  value={userPassword} 
                  onChange={e => setUserPassword(e.target.value)}
                  className="w-full bg-[#061121] border border-[#1e345e] text-white p-2.5 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">Role</label>
                <select
                  value={editUser.role || 'CASHIER'}
                  onChange={e => setEditUser({...editUser, role: e.target.value})}
                  className="w-full bg-[#061121] border border-[#1e345e] text-white p-2.5 rounded-lg focus:outline-none focus:border-emerald-500"
                >
                  <option value="CASHIER">Till Operator (Cashier)</option>
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="ACCOUNTANT">Accountant</option>
                  <option value="HEAD_ACCOUNTANT">Head Accountant</option>
                  <option value="AUDITOR">Auditor</option>
                  <option value="DIRECTOR">Director</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">Assigned Branch (Optional)</label>
                <select
                  value={editUser.branchId || ''}
                  onChange={e => setEditUser({...editUser, branchId: e.target.value})}
                  className="w-full bg-[#061121] border border-[#1e345e] text-white p-2.5 rounded-lg focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- No Branch Assigned --</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="activeUser"
                  checked={editUser.active !== false}
                  onChange={e => setEditUser({...editUser, active: e.target.checked})}
                  className="w-4 h-4 accent-emerald-500"
                />
                <label htmlFor="activeUser" className="text-sm text-slate-300">Account is Active (Approved)</label>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowUserModal(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg">Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}
`;

code = code.replace("    </div>\n  );\n}", modalHtml + "\n    </div>\n  );\n}");

fs.writeFileSync('src/pages/SystemUsers.tsx', code);
