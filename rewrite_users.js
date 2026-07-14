const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { User, Branch, UserRole } from '../lib/types';
import { Users, AlertTriangle, Send, X, ShieldCheck, Plus, Edit2, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../components/AuthProvider';

export function SystemUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [alertTarget, setAlertTarget] = useState<User | null>(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);

  useEffect(() => {
    loadUsers();
    loadBranches();
    const interval = setInterval(loadUsers, 30000); // Polling for last seen
    return () => clearInterval(interval);
  }, []);

  const loadUsers = async () => {
    try {
      const usrs = await api.get('/users');
      setUsers(usrs.filter((u: User) => u.id !== currentUser?.id));
    } catch(e) {
      console.error(e);
    }
  };

  const loadBranches = async () => {
    try {
      const brs = await api.get('/branches');
      setBranches(brs);
    } catch(e) {
      console.error(e);
    }
  };

  const handleSendAlert = async () => {
    if (!alertTarget || !currentUser || !alertMessage.trim()) return;
    setSending(true);
    setSuccess(false);
    try {
      await api.post('/messages', {
        fromId: currentUser.id,
        toId: alertTarget.id,
        content: \`🚨 ALERT FROM ADMIN: \${alertMessage}\`
      });
      setSuccess(true);
      setAlertMessage('');
      setTimeout(() => {
        setAlertTarget(null);
        setSuccess(false);
      }, 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
    } else {
      setEditingUser({ name: '', email: '', role: 'CASHIER', active: true, branchId: '' });
    }
    setIsModalOpen(true);
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser?.id) {
        await api.put(\`/users/\${editingUser.id}\`, editingUser);
      } else {
        await api.post('/users', { ...editingUser, passwordHash: 'default123' }); // default password
      }
      setIsModalOpen(false);
      loadUsers();
    } catch(e) {
      console.error(e);
      alert('Error saving user');
    }
  };

  const deleteUser = async (id: string) => {
    if(!confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(\`/users/\${id}\`);
      loadUsers();
    } catch(e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">System Users</h1>
          <p className="text-slate-400 mt-1">Manage staff, till operators, and monitor sessions.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-[#1e345e] bg-[#061121]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" /> User Directory
          </h2>
        </div>
        <div className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#112240] text-slate-400 border-b border-[#1e345e]">
                <tr>
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Role & Branch</th>
                  <th className="px-6 py-4 font-medium">Status / Last Seen</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e345e]">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-[#112240]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1e345e] flex items-center justify-center text-white font-bold text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-white">{u.name}</div>
                          <div className="text-xs text-slate-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[10px] uppercase font-bold tracking-wider">
                          {u.role}
                        </span>
                        {u.branchId && (
                           <span className="text-xs text-slate-400">
                             {branches.find(b => b.id === u.branchId)?.name || 'Unknown Branch'}
                           </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={clsx("w-2.5 h-2.5 rounded-full", u.isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-slate-500")} />
                        <span className={clsx("font-medium", u.isOnline ? "text-emerald-400" : "text-slate-400")}>
                          {u.isOnline ? 'Online' : (u.lastSeen ? \`Last seen \${formatDistanceToNow(new Date(u.lastSeen))} ago\` : 'Offline')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setAlertTarget(u)}
                          disabled={!u.active}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => openModal(u)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-bold transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => deleteUser(u.id)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-bold transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      No other users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl p-6 w-full max-w-md relative overflow-hidden">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">{editingUser.id ? 'Edit User' : 'Add User'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
             </div>
             <form onSubmit={saveUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
                  <input required type="text" value={editingUser.name || ''} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full bg-[#061121] border border-[#1e345e] rounded-lg px-4 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                  <input required type="email" value={editingUser.email || ''} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="w-full bg-[#061121] border border-[#1e345e] rounded-lg px-4 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Role</label>
                  <select required value={editingUser.role || 'CASHIER'} onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})} className="w-full bg-[#061121] border border-[#1e345e] rounded-lg px-4 py-2 text-white">
                    <option value="ADMIN">Admin</option>
                    <option value="DIRECTOR">Director</option>
                    <option value="ACCOUNTANT">Accountant</option>
                    <option value="AUDITOR">Auditor</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="CASHIER">Cashier (Till Operator)</option>
                  </select>
                </div>
                {(editingUser.role === 'SUPERVISOR' || editingUser.role === 'CASHIER') && (
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Branch</label>
                    <select value={editingUser.branchId || ''} onChange={e => setEditingUser({...editingUser, branchId: e.target.value})} className="w-full bg-[#061121] border border-[#1e345e] rounded-lg px-4 py-2 text-white">
                      <option value="">Select Branch</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" id="active" checked={editingUser.active ?? true} onChange={e => setEditingUser({...editingUser, active: e.target.checked})} className="rounded bg-[#061121] border-[#1e345e]" />
                  <label htmlFor="active" className="text-sm text-slate-400">Active Account</label>
                </div>
                <div className="flex justify-end pt-4 gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium">Save</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {alertTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#0a192f] border border-rose-500/30 rounded-xl shadow-[0_0_50px_rgba(244,63,94,0.1)] p-4 sm:p-6 w-full max-w-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-orange-500" />
            
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" /> 
                Alert to {alertTarget.name}
              </h3>
              <button onClick={() => setAlertTarget(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {success ? (
                <div className="flex flex-col items-center justify-center py-6 text-emerald-400">
                  <ShieldCheck className="w-12 h-12 mb-3" />
                  <p className="font-bold">Alert Sent Successfully!</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">Message Content</label>
                    <textarea 
                      value={alertMessage}
                      onChange={e => setAlertMessage(e.target.value)}
                      placeholder="Type your urgent alert here..."
                      className="w-full bg-[#061121] border border-[#1e345e] text-white p-3 rounded-lg focus:outline-none focus:border-rose-500 h-32 resize-none"
                      autoFocus
                    />
                  </div>
                  <div className="pt-2 flex justify-end gap-3">
                    <button onClick={() => setAlertTarget(null)} className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium">Cancel</button>
                    <button 
                      onClick={handleSendAlert} 
                      disabled={sending || !alertMessage.trim()}
                      className="px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-medium rounded-lg shadow-lg text-sm flex items-center gap-2 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      {sending ? 'Sending...' : 'Send Alert'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/pages/SystemUsers.tsx', code);
