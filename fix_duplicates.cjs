const fs = require('fs');

const duplicateBlock = `<div className="bg-[#0a192f] p-4 sm:p-6 border-t border-[#1e345e] grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                                        <div>
                                          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Expected Cash</div>
                                          <div className="text-2xl font-mono text-white">$\\{expected.toFixed(2)\\}</div>
                                        </div>
                                        <div>
                                          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Physical Cash Counted</div>
                                          <div className="text-2xl font-mono text-white">$\\{actualCash.toFixed(2)\\}</div>
                                        </div>
                                        <div>
                                          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Variance</div>
                                          <div className=\\{clsx\\("text-2xl font-mono font-bold", variance > 0 \\? "text-emerald-400" : variance < 0 \\? "text-rose-400" : "text-slate-300"\\)\\}>
                                            \\{variance > 0 \\? '\\+' : ''\\}\\{variance.toFixed\\(2\\)\\}
                                          </div>
                                      </div>`;

['src/pages/SupervisorDashboard.tsx', 'src/pages/AuditorDashboard.tsx'].forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Actually it's easier to just match from the first `div className="bg-[#0a192f]...` to the second one
    const replaceRegex = /<div className="bg-\[#0a192f\] p-4 sm:p-6 border-t border-\[#1e345e\] grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">[\s\S]*?<div className="bg-\[#0a192f\] p-4 sm:p-6 border-t border-\[#1e345e\] grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">/m;
    content = content.replace(replaceRegex, '<div className="bg-[#0a192f] p-4 sm:p-6 border-t border-[#1e345e] grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">');
    
    fs.writeFileSync(file, content);
    console.log("Cleaned " + file);
});
