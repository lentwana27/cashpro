const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const oldLogsContent = `<div className="flex-1 overflow-y-auto max-h-[400px] pr-2 space-y-3">
          {filteredLogs.length > 0 ? (
            filteredLogs.map(log => (
              <div key={log.id} className="bg-[#112240] border border-[#1e345e] p-3 rounded-lg flex flex-col gap-1 hover:border-[#2a457e] transition-colors">
                <div className="flex justify-between items-start">
                  <div className="font-semibold text-white text-sm">{log.userName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                  </div>
                </div>
                <div className="text-xs text-emerald-400 tracking-wide font-mono uppercase">{log.action}</div>
                <div className="text-xs text-slate-500 mt-1 truncate" title={log.details}>
                  {log.details.length > 100 ? log.details.substring(0, 100) + '...' : log.details}
                </div>
              </div>
            ))
          ) : (
             <div className="text-slate-500 text-sm py-4">No recent activity.</div>
          )}
        </div>`;

const newLogsContent = `<div className="flex-1 overflow-y-auto max-h-[500px] rounded-lg border border-[#1e345e] bg-[#061121]">
          <table className="w-full text-left text-sm text-slate-300 relative">
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
                    {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
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
        </div>`;

if (content.includes(oldLogsContent)) {
  content = content.replace(oldLogsContent, newLogsContent);
  fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
  console.log("Patched successfully");
} else {
  console.log("Could not find the target string.");
}
