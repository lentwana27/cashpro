import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Branch, User, DailyReconciliation } from '../lib/types';
import { Building2, X, CheckCircle, Activity, Search, Target, MessageCircle, AlertTriangle, Send, ShieldCheck, Plus } from 'lucide-react';
import clsx from 'clsx';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuth } from '../components/AuthProvider';
import { ReconModal } from '../components/ReconModal';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export function SystemBranches() {
  const { user: currentUser } = useAuth();
  const [alertTarget, setAlertTarget] = useState<User | null>(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reconciliations, setReconciliations] = useState<DailyReconciliation[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [viewReconId, setViewReconId] = useState<string | null>(null);

  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Branch>>({ active: true, tills: [], hasTills: false });
  const [editTillName, setEditTillName] = useState('');

  const loadData = () => {
    Promise.all([
      api.get('/branches'),
      api.get('/users'),
      api.get('/reconciliations')
    ]).then(([brs, usrs, recons]) => {
      setBranches(brs);
      setUsers(usrs);
      setReconciliations(recons);
    }).catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const getSupervisorsForBranch = (bId: string) => {
    const currentAssigned = users.filter(u => u.branchId === bId && u.role === 'SUPERVISOR');
    const branchRecons = reconciliations.filter(r => r.branchId === bId);
    const pastUserIds = Array.from(new Set(branchRecons.map(r => r.supervisorId)));
    
    const allRelated = [...currentAssigned];
    pastUserIds.forEach(uid => {
      if (uid && !allRelated.some(u => u.id === uid)) {
        const u = users.find(x => x.id === uid);
        if (u) allRelated.push(u);
      }
    });
    return allRelated;
  };

  const handleSendAlert = async () => {
    if (!alertTarget || !currentUser || !alertMessage.trim()) return;
    setSending(true);
    setSuccess(false);
    try {
      await api.post('/messages', {
        fromId: currentUser.id,
        toId: alertTarget.id,
        content: `🚨 ALERT: ${alertMessage}`
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

  const saveBranch = async () => {
    try {
      if (editForm.id) {
        await api.put(`/branches/${editForm.id}`, editForm);
      } else {
        await api.post('/branches', editForm);
      }
      setIsAddingBranch(false);
      setEditForm({ active: true, tills: [], hasTills: false });
      loadData();
    } catch (e) {
      alert("Error saving branch. Make sure the code is unique.");
    }
  };

  const getCashUpsForSupervisorAndBranch = (supId: string, bId: string) => {
    return reconciliations.filter(r => r.supervisorId === supId && r.branchId === bId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">System Branches</h1>
          <p className="text-slate-400 mt-1">Select a branch to view supervisors and performance.</p>
        </div>
        {currentUser?.role === 'ADMIN' && (
          <button 
            onClick={() => {
              setEditForm({ active: true, tills: [], hasTills: false });
              setIsAddingBranch(true);
              setSelectedBranch(null);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" /> Add New Branch
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 border border-[#1e345e] bg-[#0a192f] rounded-xl shadow-xl flex flex-col h-[700px]">
          <div className="p-4 border-b border-[#1e345e] bg-[#061121] rounded-t-xl">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" /> All Branches
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {branches.map(b => (
              <button 
                key={b.id} 
                onClick={() => setSelectedBranch(b)}
                className={clsx(
                  "w-full text-left p-4 border rounded-xl transition-all shadow-md group",
                  selectedBranch?.id === b.id 
                    ? "bg-[#112240] border-emerald-500 shadow-[0_0_15px_rgba(52,211,153,0.1)]" 
                    : "bg-[#061121] border-[#1e345e] hover:border-[#2a457e] hover:bg-[#112240]"
                )}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-white text-base group-hover:text-emerald-400 transition-colors">{b.name}</div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1"><MapPinIcon className="w-3 h-3"/> {b.location}</div>
                  </div>
                  <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-xs border border-emerald-500/20">{b.code}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 border border-[#1e345e] bg-[#0a192f] rounded-xl shadow-xl flex flex-col h-[700px]">
          {isAddingBranch || (selectedBranch && editForm.id === selectedBranch.id) ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 border-b border-[#1e345e] flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {editForm.id ? 'Edit Branch Options' : 'Register New Branch'}
                </h2>
                <button onClick={() => { setIsAddingBranch(false); setEditForm({}); }} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Branch Name</label>
                    <input type="text" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-[#061121] border border-[#1e345e] text-white p-2 rounded focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Branch Code (Unique)</label>
                    <input type="text" value={editForm.code || ''} onChange={e => setEditForm({...editForm, code: e.target.value.toUpperCase()})} className="w-full bg-[#061121] border border-[#1e345e] text-white p-2 rounded focus:outline-none focus:border-emerald-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Location Address</label>
                  <input type="text" value={editForm.location || ''} onChange={e => setEditForm({...editForm, location: e.target.value})} className="w-full bg-[#061121] border border-[#1e345e] text-white p-2 rounded focus:outline-none focus:border-emerald-500" />
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
                           className="px-3 py-1.5 bg-[#1d2d4a] text-emerald-400 text-xs rounded border border-[#1e345e]"
                         >Add</button>
                      </div>
                      {editForm.tills && editForm.tills.map((t: any) => (
                        <div key={t.id} className="flex justify-between items-center bg-[#112240] p-2 rounded border border-[#1e345e] text-sm text-white">
                          <span>{t.name}</span>
                          <button onClick={() => setEditForm({...editForm, tills: editForm.tills?.filter((x:any) => x.id !== t.id)})} className="text-slate-400 hover:text-rose-400"><X className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <button onClick={saveBranch} className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors">
                    Save Branch Configuration
                  </button>
                </div>
              </div>
            </div>
          ) : selectedBranch ? (
            <>
              <div className="p-6 border-b border-[#1e345e] bg-[#061121] rounded-t-xl flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedBranch.name} Dashboard</h2>
                  <p className="text-slate-400 text-sm mt-1">{selectedBranch.location}</p>
                </div>
                {currentUser?.role === 'ADMIN' && (
                  <button onClick={() => { setEditForm({...selectedBranch}); setIsAddingBranch(true); }} className="text-sm px-4 py-2 bg-[#112240] border border-[#1e345e] text-slate-300 rounded hover:text-white transition-colors">
                    Configure Branch
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {getSupervisorsForBranch(selectedBranch.id).length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    No supervisors or cash-up history for this branch.
                  </div>
                ) : (
                  getSupervisorsForBranch(selectedBranch.id).map(sup => {
                    const cashUps = getCashUpsForSupervisorAndBranch(sup.id, selectedBranch.id);
                    const totalVariance = cashUps.reduce((acc, c) => acc + (c.varianceUsd || 0), 0);
                    
                    // Prepare graph data
                    const chartData = [...cashUps]
                      .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map(c => ({
                        date: format(new Date(c.date), 'MMM dd'),
                        variance: c.varianceUsd || 0
                      }));

                    return (
                      <div key={sup.id} className="bg-[#061121] border border-[#1e345e] rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-[#1e345e] flex items-center justify-between bg-[#0a192f]">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#112240] border border-[#1e345e] flex items-center justify-center text-white font-bold">
                              {sup.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-white flex items-center gap-2">
                                {sup.name}
                                <div className={clsx("w-2 h-2 rounded-full", sup.isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-slate-500")} title={sup.isOnline ? "Online" : "Offline"} />
                                {sup.branchId !== selectedBranch.id && (
                                  <span className="text-[10px] uppercase bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full ml-2">Past Assigned</span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5">
                                {sup.isOnline ? 'Online now' : (sup.lastSeen ? `Last seen ${formatDistanceToNow(new Date(sup.lastSeen))} ago` : 'Never logged in')}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex-1 flex justify-center px-4 max-w-xs">
                            {chartData.length > 0 && (
                              <div className="w-full h-12 flex items-end">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={chartData}>
                                    <Tooltip
                                      contentStyle={{ backgroundColor: '#0a192f', border: '1px solid #1e345e', fontSize: '10px' }}
                                      cursor={{ fill: '#1e345e', opacity: 0.4 }}
                                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Variance']}
                                      labelStyle={{ color: '#94a3b8' }}
                                    />
                                    <Bar dataKey="variance">
                                      {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.variance > 0 ? '#34d399' : entry.variance < 0 ? '#fb7185' : '#60a5fa'} />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm whitespace-nowrap">
                            <div className="text-right">
                              <div className="text-slate-400 text-xs">Total Variances</div>
                              <div className={clsx("font-bold text-sm", totalVariance > 0 ? "text-emerald-400" : totalVariance < 0 ? "text-rose-400" : "text-blue-400")}>
                                {totalVariance > 0 ? '+' : ''}{totalVariance.toFixed(2)} USD
                              </div>
                            </div>
                            <div className="border-l border-[#1e345e] h-8 mx-2" />
                            <div>
                              <span className="text-slate-400">Cash-ups: </span>
                              <span className="text-white font-bold">{cashUps.length}</span>
                            </div>
                            <button 
                              onClick={() => setAlertTarget(sup)}
                              className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded flex items-center gap-2 transition-colors font-medium text-xs"
                              title="Send Message"
                            >
                              <MessageCircle className="w-4 h-4" /> Message
                            </button>
                          </div>
                        </div>
                        <div className="p-0">
                          {cashUps.length === 0 ? (
                            <div className="p-4 text-center text-sm text-slate-500">No cash-ups posted yet.</div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-[#112240] text-slate-400">
                                  <tr>
                                    <th className="px-4 py-2 font-medium">Date</th>
                                    <th className="px-4 py-2 font-medium">Sales (USD)</th>
                                    <th className="px-4 py-2 font-medium">Variance (USD)</th>
                                    <th className="px-4 py-2 font-medium">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1e345e]">
                                  {cashUps.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(c => {
                                    const ts = Array.isArray(c.totalSales) ? c.totalSales.reduce((a,b)=>a+(b.usdEquivalent||0),0) : (c.totalSales?.usdEquivalent || 0);
                                    return (
                                      <tr key={c.id} onClick={() => setViewReconId(c.id)} className="hover:bg-[#112240] transition-colors cursor-pointer">
                                        <td className="px-4 py-3 font-mono text-slate-300">{format(new Date(c.date), 'MMM dd, yyyy')}</td>
                                        <td className="px-4 py-3 font-medium text-white">${ts.toFixed(2)}</td>
                                        <td className="px-4 py-3">
                                          <span className={clsx("font-medium", c.varianceUsd < 0 ? "text-rose-400" : c.varianceUsd > 0 ? "text-emerald-400" : "text-white")}>
                                            {c.varianceUsd > 0 ? '+' : ''}{c.varianceUsd.toFixed(2)}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3">
                                          <span className={clsx(
                                            "px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border",
                                            c.status === 'APPROVED' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                            c.status === 'FLAGGED' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                                            "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                          )}>
                                            {c.status}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 h-full p-6 text-center">
              <Building2 className="w-16 h-16 opacity-30 mb-4" />
              <p>Select a branch to view its supervisors and their posted cash-ups.</p>
            </div>
          )}
        </div>
      </div>

      {alertTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#0a192f] border border-blue-500/30 rounded-xl shadow-[0_0_50px_rgba(59,130,246,0.1)] p-6 w-full max-w-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-500" />
            
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-400" /> 
                Message to {alertTarget.name}
              </h3>
              <button onClick={() => setAlertTarget(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {success ? (
                <div className="flex flex-col items-center justify-center py-6 text-emerald-400">
                  <ShieldCheck className="w-12 h-12 mb-3" />
                  <p className="font-bold">Message Sent Successfully!</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">Message Content</label>
                    <textarea 
                      value={alertMessage}
                      onChange={e => setAlertMessage(e.target.value)}
                      placeholder="Type your message here..."
                      className="w-full bg-[#061121] border border-[#1e345e] text-white p-3 rounded-lg focus:outline-none focus:border-blue-500 h-32 resize-none"
                      autoFocus
                    />
                  </div>
                  <div className="pt-2 flex justify-end gap-3">
                    <button onClick={() => setAlertTarget(null)} className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium">Cancel</button>
                    <button 
                      onClick={handleSendAlert} 
                      disabled={sending || !alertMessage.trim()}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium rounded-lg shadow-lg text-sm flex items-center gap-2 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      {sending ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {viewReconId && (
        <ReconModal 
          recon={reconciliations.find(r => r.id === viewReconId)}
          onClose={() => setViewReconId(null)}
        />
      )}
    </div>
  );
}

function MapPinIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  );
}
