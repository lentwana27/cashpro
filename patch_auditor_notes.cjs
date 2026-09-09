const fs = require('fs');
let content = fs.readFileSync('src/pages/AuditorDashboard.tsx', 'utf8');

const replacement = `
                                      </div>
                                      
                                      <div className="bg-[#0a192f] p-4 sm:p-6 border-t border-[#1e345e] grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                                        <div>
                                          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Expected Cash</div>
                                          <div className="text-2xl font-mono text-white">$\${expected.toFixed(2)}</div>
                                        </div>
                                        <div>
                                          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Physical Cash Counted</div>
                                          <div className="text-2xl font-mono text-white">$\${actualCash.toFixed(2)}</div>
                                        </div>
                                        <div>
                                          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Variance</div>
                                          <div className={"text-2xl font-mono font-bold " + (variance > 0 ? "text-emerald-400" : variance < 0 ? "text-rose-400" : "text-slate-300")}>
                                            {variance > 0 ? '+' : ''}{variance.toFixed(2)}
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {(r.notes || r.signature || (r.amendmentNotes && r.amendmentNotes.length > 0)) && (
                                        <div className="px-6 pb-6 mt-2 border-t border-[#1e345e] pt-6">
                                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-[#1e345e] pb-2">Notes & Verification</h4>
                                          {r.amendmentNotes && r.amendmentNotes.length > 0 && (
                                            <div className="mb-4 space-y-2">
                                              <p className="text-xs text-slate-500 mb-1">Amendment History</p>
                                              {r.amendmentNotes.map((note: string, i: number) => (
                                                <div key={i} className="text-sm text-yellow-500/90 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20 leading-relaxed font-medium">
                                                  {note}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          {r.notes && (
                                            <div className="mb-4">
                                              <p className="text-xs text-slate-500 mb-1">Additional Notes</p>
                                              <p className="text-sm text-slate-300 bg-[#061121] p-3 rounded-lg border border-[#1e345e]">{r.notes}</p>
                                            </div>
                                          )}
                                          {r.signature && (
                                            <div>
                                              <p className="text-xs text-slate-500 mb-1">Digitally Signed By</p>
                                              <p className="text-lg text-emerald-400 font-serif italic">{r.signature}</p>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </>
`;

const regex = /<\/div>\s*<\/div>\s*<\/>/m;
content = content.replace(regex, replacement);
fs.writeFileSync('src/pages/AuditorDashboard.tsx', content);
