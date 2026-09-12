import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { User } from '../lib/types';
import { Users, AlertTriangle, Send, X, ShieldCheck, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../components/AuthProvider';
import { Branch } from '../lib/types';
import { Pencil, Trash2, Plus, Lock, Search } from 'lucide-react';


export function SystemUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [alertTarget, setAlertTarget] = useState<User | null>(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editUser, setEditUser] = useState<Partial<User> | null>(null);
  const [userPassword, setUserPassword] = useState('');


  useEffect(() => {
    loadUsersAndBranches();
    const interval = setInterval(loadUsersAndBranches, 5000); // Polling for last seen
    

  return () => clearInterval(interval);
  }, []);

  
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


  
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    
    try {
      if (editUser.id) {
        // Update
        const payload = { ...editUser };
        if (userPassword) payload.passwordHash = userPassword;
        await api.put(`/users/${editUser.id}`, payload);
      } else {
        // Create
        await api.post('/users', {
          name: editUser.name,
          email: editUser.email,
          passwordHash: userPassword || 'password123',
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


  const handleTransferToAudit = async (id: string) => {
    if (!confirm('Are you sure you want to transfer this user to Audit (change role to AUDITOR)?')) return;
    try {
      await api.put(`/users/${id}`, { role: 'AUDITOR' });
      loadUsersAndBranches();
    } catch (e: any) {
      alert(e.message || 'Failed to transfer user');
    }
  };

    const handleRequestDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to request deletion for this account? System Admin must confirm.')) return;
    try {
      await api.put(`/users/${id}`, { pendingDeletion: true });
      loadUsersAndBranches();
    } catch (e: any) {
      alert(e.message || 'Failed to request deletion');
    }
  };

  const handleConfirmDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to PERMANENTLY delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      loadUsersAndBranches();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectDeleteUser = async (id: string) => {
    try {
      await api.put(`/users/${id}`, { pendingDeletion: false });
      loadUsersAndBranches();
    } catch (e) {
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
        content: `🚨 ALERT FROM ADMIN: ${alertMessage}`
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

  const filteredUsers = (users || []).filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ((branches || []).find((b) => b.id === u.branchId)?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">System Users</h1>
          <p className="text-slate-400 mt-1">Manage users, till operators, and access.</p>
        </div>
        {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERVISOR' || currentUser?.role === 'AUDITOR') && (
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


      <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-[#1e345e] bg-[#061121] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
        </div>
        <div className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#112240] text-slate-400 border-b border-[#1e345e]">
                <tr>
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Status / Last Seen</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e345e]">
                {filteredUsers.map(u => (
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
                      <div className="flex flex-col gap-1">
                        <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[10px] uppercase font-bold tracking-wider inline-block w-max">
                          {u.role}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {(branches || []).find(b => b.id === u.branchId)?.name || 'No Branch'}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={clsx("w-2.5 h-2.5 rounded-full", u.isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-slate-500")} />
                        <span className={clsx("font-medium", u.isOnline ? "text-emerald-400" : "text-slate-400")}>
                          {u.isOnline ? 'Online' : (u.lastSeen ? `Last seen ${formatDistanceToNow(new Date(u.lastSeen))} ago` : 'Offline')}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                      {((currentUser?.role === 'ADMIN') || 
                         (currentUser?.role === 'SUPERVISOR' && u.role === 'CASHIER') || 
                         (currentUser?.role === 'AUDITOR' && (u.role === 'CASHIER' || u.role === 'SUPERVISOR'))) && (
                        <>
                          <button 
                            onClick={() => {
                              setEditUser(u);
                              setUserPassword('');
                              setShowUserModal(true);
                            }}
                            className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          
                          {currentUser?.role === 'ADMIN' && (
                            <button 
                              onClick={() => handleTransferToAudit(u.id)}
                              className="p-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-colors"
                              title="Transfer to Audit"
                            >
                              <ShieldAlert className="w-4 h-4" />
                            </button>
                          )}

                          {u.pendingDeletion && currentUser?.role === 'ADMIN' ? (
                            <>
                              <button 
                                onClick={() => handleRejectDeleteUser(u.id)}
                                className="px-2 py-1 bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 rounded-lg text-xs font-bold transition-colors"
                                title="Reject Deletion"
                              >
                                Cancel Del
                              </button>
                              <button 
                                onClick={() => handleConfirmDeleteUser(u.id)}
                                className="px-2 py-1 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-lg transition-colors"
                                title="Confirm Delete"
                              >
                                Confirm Del
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
                        </>
                      )}
                      
                      <button 
                        onClick={() => setAlertTarget(u)}
                        disabled={!u.active}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Alert
                      </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
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
                  {currentUser?.role === 'ADMIN' && (
                    <>
                      <option value="ACCOUNTANT">Accountant</option>
                      <option value="HEAD_ACCOUNTANT">Head Accountant</option>
                      <option value="AUDITOR">Auditor</option>
                      <option value="DIRECTOR">Director</option>
                      <option value="ADMIN">Admin</option>
                    </>
                  )}
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

    </div>
  );
}
