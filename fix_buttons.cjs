const fs = require('fs');
let content = fs.readFileSync('src/pages/SystemUsers.tsx', 'utf8');

const regex = /<td className="px-6 py-4 text-right">[\s\S]*?<\/td>/;

const replacement = `<td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                      {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERVISOR' || currentUser?.role === 'AUDITOR') && (
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
                    </td>`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/pages/SystemUsers.tsx', content);
