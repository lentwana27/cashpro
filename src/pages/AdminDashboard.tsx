import { safeFormat } from '../lib/formatDate';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { User, Branch, SystemLog } from '../lib/types';
import { Users, Building2, Megaphone, CheckCircle, ShieldCheck, MapPin, Edit3, X, Download, Database, Activity, Plus, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

export function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [reconciliations, setReconciliations] = useState<any[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);

  const [updates, setUpdates] = useState<any[]>([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<any>(null);
  const [updateForm, setUpdateForm] = useState({ title: '', features: '', targetRoles: [] as string[] });

  
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [editForm, setEditForm] = useState<Partial<Branch>>({});
  
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const [newBranchForm, setNewBranchForm] = useState<Partial<Branch>>({ name: '', location: '', lat: 0, lng: 0, code: '', hasTills: false, tills: [] });
  const [newTillName, setNewTillName] = useState('');
  const [editTillName, setEditTillName] = useState('');
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userEditForm, setUserEditForm] = useState<Partial<User>>({});

  const [logDateFilter, setLogDateFilter] = useState('');
  const [logSuspiciousOnly, setLogSuspiciousOnly] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [usrs, brs, recs, lgs, upds] = await Promise.all([
        api.get('/updates').catch(() => []),
        api.get('/users'),
        api.get('/branches'),
        api.get('/reconciliations'),
        api.get('/logs').catch(() => [])
      ]);
      setUsers(usrs.filter((u: User) => u.role !== 'ADMIN'));
      setBranches(brs);
      setReconciliations(recs);
      setLogs(lgs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setUpdates(upds.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (e) {
      // Ignore network errors during polling
    }
  };

  const unlockSales = async (id: string) => {
    await api.put(`/reconciliations/${id}`, { salesConfirmed: false });
    loadData();
  };
  const handleUnlockRequest = async (id: string, newStatus: string) => {
    await api.put(`/reconciliations/${id}`, { status: newStatus });
    loadData();
  };

  
  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to delete user');
    }
  };

  const approveUser = async (id: string) => {
    await api.put(`/users/${id}/approve`, {});
    loadData();
  };

  const downloadSystemBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      users,
      branches,
      reconciliations,
      logs
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `system_backup_${safeFormat(new Date(), 'yyyyMMdd_HHmmss')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleEditUser = (u: User) => {
    setEditingUser(u);
    setUserEditForm({ role: u.role, branchId: u.branchId || '', active: u.active });
  };

  const saveUser = async () => {
    if (!editingUser) return;
    await api.put(`/users/${editingUser.id}`, {
      ...userEditForm,
      branchId: userEditForm.branchId === '' ? null : userEditForm.branchId
    });
    setEditingUser(null);
    loadData();
  };

  const handleEditBranch = (b: Branch) => {
    setEditingBranch(b);
    setEditForm({ name: b.name, location: b.location, lat: b.lat || 0, lng: b.lng || 0, hasTills: b.hasTills || false, tills: b.tills || [] });
  };

  const saveBranch = async () => {
    if (!editingBranch) return;
    await api.put(`/branches/${editingBranch.id}`, {
      name: editForm.name,
      location: editForm.location,
      lat: Number(editForm.lat),
      lng: Number(editForm.lng),
      hasTills: editForm.hasTills,
      tills: editForm.tills
    });
    setEditingBranch(null);
    loadData();
  };

  const handleCreateBranch = async () => {
    if (!newBranchForm.name || !newBranchForm.code) return alert('Name and Code are required');
    try {
      await api.post('/branches', newBranchForm);
      setIsCreatingBranch(false);
      setNewBranchForm({ name: '', location: '', lat: 0, lng: 0, code: '', hasTills: false, tills: [] });
      loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to create branch');
    }
  };

  const isSuspicious = (log: SystemLog) => {
    const actionUpper = (log.action || "").toUpperCase();
    const detailsUpper = (log.details || "").toUpperCase();
    return actionUpper.includes('DELETE') || 
           actionUpper.includes('/APPROVE') || 
           (actionUpper.includes('PUT') && actionUpper.includes('/USERS')) ||
           detailsUpper.includes('FALSE');
  };

  const filteredLogs = logs.filter(log => {
    if (logDateFilter && !log.timestamp.startsWith(logDateFilter)) return false;
    if (logSuspiciousOnly && !isSuspicious(log)) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">System Administration</h1>
        <button 
          onClick={downloadSystemBackup}
          className="flex items-center gap-2 px-4 py-2 bg-[#112240] hover:bg-[#1a2d53] border border-[#1e345e] rounded-lg text-sm font-medium transition-colors"
        >
          <Database className="w-4 h-4 text-emerald-400" />
          Backup All Data 
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* USERS PANEL */}
        <div id="users" className="bg-[#0a192f] border border-[#1e345e] rounded-xl shadow-xl flex flex-col h-[600px]">
          <div className="p-4 sm:p-6 border-b border-[#1e345e] flex items-center gap-3">
            <Users className="text-emerald-400 w-5 h-5" />
            <h2 className="text-xl font-bold text-white">User Access Management</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {users.map(u => (
              <div key={u.id} className="bg-[#112240] border border-[#1e345e] p-4 rounded-xl flex items-center justify-between hover:border-[#2a457e] transition-colors relative">
                <div>
                  <div className="font-semibold text-white text-sm flex items-center gap-2">
                    {u.name}
                    <div className={clsx("w-2 h-2 rounded-full", u.isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-slate-500")} title={u.isOnline ? "Online" : "Offline"} />
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{u.email}</div>
                  <div className="flex gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px] font-bold uppercase tracking-wider">{u.role}</span>
                    {u.branchId && <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px] font-medium">{(branches || []).find(b => b.id === u.branchId)?.name || u.branchId}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    {u.active ? (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                        <ShieldCheck className="w-4 h-4" /> Active
                      </div>
                    ) : (
                      <button 
                        onClick={() => approveUser(u.id)}
                        className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-lg transition-all"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                    )}
                    <button 
                      onClick={() => handleEditUser(u)}
                      className="p-1.5 text-slate-400 hover:text-emerald-400 bg-[#0a192f] hover:bg-[#1a2d53] rounded-lg transition-colors border border-[#1e345e]"
                      title="Edit User"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(u.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 bg-[#0a192f] hover:bg-rose-500/10 rounded-lg transition-colors border border-[#1e345e]"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                  </div>
                  {u.lastSeen && !u.isOnline && (
                    <div className="text-[10px] text-slate-500">
                      Last seen: {u.lastSeen ? safeFormat(u.lastSeen, "HH:mm") : "Never"}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BRANCHES PANEL */}
        <div id="branches" className="bg-[#0a192f] border border-[#1e345e] rounded-xl shadow-xl flex flex-col h-[600px]">
           <div className="p-4 sm:p-6 border-b border-[#1e345e] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="text-blue-400 w-5 h-5" />
              <h2 className="text-xl font-bold text-white">Branch Directory ({branches.length})</h2>
            </div>
            <button
              onClick={() => setIsCreatingBranch(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" /> New Branch
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
             {branches.map(b => (
              <div key={b.id} className="bg-[#112240] border border-[#1e345e] p-4 rounded-xl flex items-center justify-between hover:border-[#2a457e] transition-colors group">
                 <div>
                    <div className="font-bold text-white text-base">{b.name}</div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <span className="font-mono text-emerald-400 bg-emerald-500/10 px-1.5 rounded">{b.code}</span>
                      <span>{b.location}</span>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                   <button onClick={() => handleEditBranch(b)} className="text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity p-2">
                     <Edit3 className="w-4 h-4" />
                   </button>
                   <div className={clsx("w-2 h-2 rounded-full", b.active ? "bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-rose-500")} />
                 </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl shadow-xl flex flex-col p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck className="text-rose-400 w-5 h-5" />
          <h2 className="text-xl font-bold text-white">Unlock Requests & Locked Records</h2>
        </div>
        
        {reconciliations.filter(r => r.status === 'UNLOCK_REQUESTED').length > 0 && (
          <div className="mb-6 space-y-3">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Pending Missing Cash-Up Requests</h3>
            {reconciliations.filter(r => r.status === 'UNLOCK_REQUESTED').map(r => (
              <div key={r.id} className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-white text-sm">{(branches || []).find(b => b.id === r.branchId)?.name || r.branchId}</span>
                  <span className="text-xs text-slate-400">{r.date}</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleUnlockRequest(r.id, 'UNLOCK_APPROVED')} className="flex-1 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded transition-colors text-xs font-bold">Approve</button>
                  <button onClick={() => handleUnlockRequest(r.id, 'UNLOCK_DECLINED')} className="flex-1 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded transition-colors text-xs font-bold">Decline</button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Locked Sales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reconciliations.filter(r => r.salesConfirmed).map(r => (
            <div key={r.id} className="bg-[#112240] p-4 rounded-xl border border-[#1e345e] flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <span className="font-bold text-white text-sm">{(branches || []).find(b => b.id === r.branchId)?.name || r.branchId}</span>
                <span className="text-xs text-slate-400">{r.date}</span>
              </div>
              <div className="text-sm font-mono text-emerald-400">
                Sales: ${(Array.isArray(r.totalSales) ? r.totalSales.reduce((a:number,b:any)=>a+b.usdEquivalent,0) : (r.totalSales?.usdEquivalent || 0)).toFixed(2)}
              </div>
              {r.amendmentNotes && r.amendmentNotes.length > 0 && (
                <div className="text-xs text-yellow-500/90 mt-1 line-clamp-2 italic">
                  Amended {r.amendmentNotes.length} time(s)
                </div>
              )}
              <button 
                onClick={() => unlockSales(r.id)}
                className="mt-2 text-xs w-full py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded transition-colors font-semibold"
              >
                Allow Accountant Edit
              </button>
            </div>
          ))}
          {reconciliations.filter(r => r.salesConfirmed).length === 0 && (
            <div className="col-span-full text-slate-500 text-sm py-4">No locked records needing edits.</div>
          )}
        </div>
      </div>

      <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl shadow-xl flex flex-col p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Activity className="text-emerald-400 w-5 h-5" />
            <h2 className="text-xl font-bold text-white">System Activity Logs</h2>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <label className="text-slate-400">Date:</label>
              <input 
                type="date" 
                value={logDateFilter}
                onChange={e => setLogDateFilter(e.target.value)}
                className="bg-[#112240] border border-[#1e345e] text-white text-sm rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
              {logDateFilter && (
                <button onClick={() => setLogDateFilter('')} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white transition-colors">
              <input 
                type="checkbox" 
                checked={logSuspiciousOnly}
                onChange={e => setLogSuspiciousOnly(e.target.checked)}
                className="w-4 h-4 text-emerald-500 bg-[#061121] border-[#1e345e] rounded focus:ring-emerald-500"
              />
              Suspicious Only
            </label>
          </div>
        </div>
        <div className="flex-1 overflow-auto max-h-[500px] rounded-lg border border-[#1e345e] bg-[#061121]">
          <table className="w-full text-left text-sm text-slate-300 relative whitespace-nowrap">
            <thead className="bg-[#112240] text-xs uppercase font-semibold text-slate-400 border-b border-[#1e345e] sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap w-40">Timestamp</th>
                <th className="px-4 py-3 whitespace-nowrap w-48">User</th>
                <th className="px-4 py-3 whitespace-nowrap w-48">Action</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e345e]">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-[#112240]/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-slate-400">
                    {safeFormat(log.timestamp || new Date(), 'yyyy-MM-dd HH:mm:ss')}
                  </td>
                  <td className="px-4 py-3 font-medium text-white whitespace-nowrap">
                    {log.userName}
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx(
                      "px-2 py-1 rounded text-[10px] font-mono tracking-wider font-bold whitespace-nowrap",
                      isSuspicious(log) 
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" 
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    )}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-300 max-w-xl break-words">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLogs.length === 0 && (
            <div className="text-center text-slate-500 py-8">No recent activity.</div>
          )}
        </div>
      </div>

      
      {/* SYSTEM UPDATES MANAGEMENT */}
      <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl shadow-xl flex flex-col p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Megaphone className="text-emerald-400 w-5 h-5" />
            <h2 className="text-xl font-bold text-white">System Updates & Announcements</h2>
          </div>
          <button 
            onClick={() => { setEditingUpdate(null); setUpdateForm({ title: '', features: '', targetRoles: ['ALL'] }); setShowUpdateModal(true); }}
            className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> New Update
          </button>
        </div>
        <div className="space-y-4">
          {updates.map(u => (
            <div key={u.id} className="bg-[#112240] border border-[#1e345e] p-4 rounded-xl">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white">{u.title}</h3>
                    <span className="text-xs bg-[#061121] px-2 py-0.5 rounded text-emerald-400 border border-emerald-500/20">{u.id}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Date: {safeFormat(u.date || new Date(), 'MMM d, yyyy HH:mm')}</div>
                  <div className="text-xs text-blue-400 mt-1">Audience: {(u.targetRoles || ['ALL']).join(', ')}</div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setEditingUpdate(u);
                      setUpdateForm({ title: u.title, features: (u.features || []).join('\n'), targetRoles: u.targetRoles || [] });
                      setShowUpdateModal(true);
                    }}
                    className="p-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={async () => {
                      if (confirm('Delete this update?')) {
                        await api.delete(`/updates/${u.id}`);
                        loadData();
                      }
                    }}
                    className="p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <ul className="list-disc list-inside text-sm text-slate-300 mt-2 space-y-1">
                {(u.features || []).map((f: string, i: number) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          ))}
          {updates.length === 0 && <div className="text-slate-500 text-sm">No updates published.</div>}
        </div>
      </div>

      
      {/* UPDATE MODAL */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">{editingUpdate ? 'Edit Update' : 'New Update'}</h3>
              <button onClick={() => setShowUpdateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Update Title</label>
                <input 
                  type="text" 
                  value={updateForm.title} 
                  onChange={e => setUpdateForm({...updateForm, title: e.target.value})}
                  className="w-full bg-[#061121] border border-[#1e345e] text-white p-2 rounded focus:outline-none focus:border-emerald-500" 
                  placeholder="e.g. Version 1.3.0 - New Features"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Target Audience (Roles)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {['ALL', 'SUPERVISOR', 'ACCOUNTANT', 'HEAD_ACCOUNTANT', 'DIRECTOR', 'AUDITOR'].map(role => (
                    <label key={role} className="flex items-center gap-1.5 bg-[#112240] px-2 py-1 rounded text-xs text-slate-300 border border-[#1e345e] cursor-pointer hover:border-emerald-500/50">
                      <input 
                        type="checkbox"
                        checked={updateForm.targetRoles.includes(role)}
                        onChange={(e) => {
                          let newRoles = [...updateForm.targetRoles];
                          if (e.target.checked) {
                            if (role === 'ALL') newRoles = ['ALL'];
                            else {
                              newRoles = newRoles.filter(r => r !== 'ALL');
                              newRoles.push(role);
                            }
                          } else {
                            newRoles = newRoles.filter(r => r !== role);
                          }
                          setUpdateForm({...updateForm, targetRoles: newRoles});
                        }}
                        className="rounded border-[#1e345e] bg-[#061121] text-emerald-500 focus:ring-0"
                      />
                      {role}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Update Messages / Features (One per line)</label>
                <textarea 
                  value={updateForm.features} 
                  onChange={e => setUpdateForm({...updateForm, features: e.target.value})}
                  className="w-full bg-[#061121] border border-[#1e345e] text-white p-2 rounded focus:outline-none focus:border-emerald-500 h-32" 
                  placeholder="Added new export feature...\nFixed a bug with...\nUpdated dashboard layout..."
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button onClick={() => setShowUpdateModal(false)} className="px-4 py-2 text-slate-400 hover:text-white text-sm">Cancel</button>
                <button 
                  onClick={async () => {
                    const features = updateForm.features.split('\n').map(s => s.trim()).filter(s => s.length > 0);
                    if (!updateForm.title || features.length === 0) return alert('Title and at least one message line required.');
                    
                    const payload = {
                      title: updateForm.title,
                      features,
                      targetRoles: updateForm.targetRoles.length > 0 ? updateForm.targetRoles : ['ALL']
                    };
                    
                    if (editingUpdate) {
                      await api.put(`/updates/${editingUpdate.id}`, payload);
                    } else {
                      await api.post('/updates', {
                        id: `v${Date.now()}`,
                        date: new Date().toISOString(),
                        ...payload
                      });
                    }
                    setShowUpdateModal(false);
                    loadData();
                  }} 
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg shadow-lg text-sm"
                >
                  Save Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT BRANCH MODAL */}
      {editingBranch && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Edit Branch: {editingBranch.code}</h3>
              <button onClick={() => setEditingBranch(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Branch Name</label>
                <input 
                  type="text" 
                  value={editForm.name || ''} 
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  className="w-full bg-[#061121] border border-[#1e345e] text-white p-2 rounded focus:outline-none focus:border-emerald-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Location / Address</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={editForm.location || ''} 
                    onChange={e => setEditForm({...editForm, location: e.target.value})}
                    className="flex-1 bg-[#061121] border border-[#1e345e] text-white p-2 rounded focus:outline-none focus:border-emerald-500" 
                  />
                </div>
              </div>

              {/* Tills */}
              <div className="border border-[#1e345e] rounded-lg p-4 bg-[#061121]/50">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white transition-colors mb-3">
                  <input 
                    type="checkbox" 
                    checked={editForm.hasTills || false}
                    onChange={e => setEditForm({...editForm, hasTills: e.target.checked})}
                    className="w-4 h-4 text-emerald-500 bg-[#061121] border-[#1e345e] rounded focus:ring-emerald-500"
                  />
                  Branch has separate tills
                </label>
                {editForm.hasTills && (
                  <div className="space-y-3 pl-6 border-l-2 border-[#1e345e]">
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         value={editTillName}
                         onChange={e => setEditTillName(e.target.value)}
                         placeholder="e.g. Till 1"
                         className="flex-1 bg-[#061121] border border-[#1e345e] text-white p-1.5 text-sm rounded focus:outline-none focus:border-emerald-500"
                       />
                       <button 
                         onClick={() => {
                           if (!editTillName) return;
                           const t = [...(editForm.tills || []), { id: `till-${Date.now()}`, name: editTillName }];
                           setEditForm({ ...editForm, tills: t });
                           setEditTillName('');
                         }}
                         className="px-3 py-1.5 bg-[#1d2d4a] hover:bg-[#2a3f63] text-emerald-400 text-xs font-medium rounded transition-colors border border-[#1e345e]"
                       >Add</button>
                    </div>
                    {editForm.tills && editForm.tills.map((t: any) => (
                      <div key={t.id} className="flex justify-between items-center bg-[#112240] p-2 rounded border border-[#1e345e] text-sm text-white">
                        <span>{t.name}</span>
                        <button 
                          onClick={() => setEditForm({...editForm, tills: editForm.tills?.filter((x:any) => x.id !== t.id)})}
                          className="text-slate-400 hover:text-rose-400"
                        ><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button onClick={() => setEditingBranch(null)} className="px-4 py-2 text-slate-400 hover:text-white text-sm">Cancel</button>
                <button onClick={saveBranch} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg shadow-lg text-sm">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* CREATE BRANCH MODAL */}
      {isCreatingBranch && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Create New Branch</h3>
              <button onClick={() => setIsCreatingBranch(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Branch Name</label>
                <input 
                  type="text" 
                  value={newBranchForm.name || ''} 
                  onChange={e => setNewBranchForm({...newBranchForm, name: e.target.value})}
                  className="w-full bg-[#061121] border border-[#1e345e] text-white p-2 rounded focus:outline-none focus:border-emerald-500" 
                  placeholder="e.g. Pretoria Main"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Branch Code</label>
                <input 
                  type="text" 
                  value={newBranchForm.code || ''} 
                  onChange={e => setNewBranchForm({...newBranchForm, code: e.target.value.toUpperCase()})}
                  className="w-full bg-[#061121] border border-[#1e345e] text-white p-2 rounded focus:outline-none focus:border-emerald-500" 
                  placeholder="e.g. PTA"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Location / Address</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newBranchForm.location || ''} 
                    onChange={e => setNewBranchForm({...newBranchForm, location: e.target.value})}
                    className="flex-1 bg-[#061121] border border-[#1e345e] text-white p-2 rounded focus:outline-none focus:border-emerald-500" 
                  />
                </div>
              </div>

              {/* Tills */}
              <div className="border border-[#1e345e] rounded-lg p-4 bg-[#061121]/50">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white transition-colors mb-3">
                  <input 
                    type="checkbox" 
                    checked={newBranchForm.hasTills || false}
                    onChange={e => setNewBranchForm({...newBranchForm, hasTills: e.target.checked})}
                    className="w-4 h-4 text-emerald-500 bg-[#061121] border-[#1e345e] rounded focus:ring-emerald-500"
                  />
                  Branch has separate tills
                </label>
                {newBranchForm.hasTills && (
                  <div className="space-y-3 pl-6 border-l-2 border-[#1e345e]">
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         value={newTillName}
                         onChange={e => setNewTillName(e.target.value)}
                         placeholder="e.g. Till 1"
                         className="flex-1 bg-[#061121] border border-[#1e345e] text-white p-1.5 text-sm rounded focus:outline-none focus:border-emerald-500"
                       />
                       <button 
                         onClick={() => {
                           if (!newTillName) return;
                           const t = [...(newBranchForm.tills || []), { id: `till-${Date.now()}`, name: newTillName }];
                           setNewBranchForm({ ...newBranchForm, tills: t });
                           setNewTillName('');
                         }}
                         className="px-3 py-1.5 bg-[#1d2d4a] hover:bg-[#2a3f63] text-emerald-400 text-xs font-medium rounded transition-colors border border-[#1e345e]"
                       >Add</button>
                    </div>
                    {newBranchForm.tills && newBranchForm.tills.map(t => (
                      <div key={t.id} className="flex justify-between items-center bg-[#112240] p-2 rounded border border-[#1e345e] text-sm text-white">
                        <span>{t.name}</span>
                        <button 
                          onClick={() => setNewBranchForm({...newBranchForm, tills: newBranchForm.tills?.filter(x => x.id !== t.id)})}
                          className="text-slate-400 hover:text-rose-400"
                        ><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button onClick={() => setIsCreatingBranch(false)} className="px-4 py-2 text-slate-400 hover:text-white text-sm">Cancel</button>
                <button onClick={handleCreateBranch} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg shadow-lg text-sm">Create Branch</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Edit User: {editingUser.name}</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Role</label>
                <select 
                  value={userEditForm.role || ''} 
                  onChange={e => setUserEditForm({...userEditForm, role: e.target.value as any})}
                  className="w-full bg-[#061121] border border-[#1e345e] text-white p-2 rounded focus:outline-none focus:border-emerald-500 appearance-none" 
                >
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="ACCOUNTANT">Accountant</option>
                  <option value="HEAD_ACCOUNTANT">Head Accountant</option>
                  <option value="DIRECTOR">Director</option>
                  <option value="AUDITOR">Auditor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Assigned Branch (Optional)</label>
                <select 
                  value={userEditForm.branchId || ''} 
                  onChange={e => setUserEditForm({...userEditForm, branchId: e.target.value})}
                  className="w-full bg-[#061121] border border-[#1e345e] text-white p-2 rounded focus:outline-none focus:border-emerald-500 appearance-none" 
                >
                  <option value="">-- No Branch --</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <input 
                  type="checkbox" 
                  id="userActive"
                  checked={userEditForm.active || false}
                  onChange={e => setUserEditForm({...userEditForm, active: e.target.checked})}
                  className="w-4 h-4 rounded border-[#1e345e] bg-[#061121] text-emerald-500 focus:ring-emerald-500 focus:ring-offset-[#0a192f]"
                />
                <label htmlFor="userActive" className="text-sm font-medium text-slate-300">Account is Active</label>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button onClick={() => setEditingUser(null)} className="px-4 py-2 text-slate-400 hover:text-white text-sm">Cancel</button>
                <button onClick={saveUser} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg shadow-lg text-sm">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
