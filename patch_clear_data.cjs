const fs = require('fs');
let code = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');

code = code.replace(
`  const handleClearPastData = async () => {
    if (!confirm("Are you sure you want to clear all past cashup data for this branch? This action cannot be undone and will not affect user accounts.")) return;
    try {
      await api.delete(\`/reconciliations/branch/\${user?.branchId}\`);
      setHistory([]);
      setSubmitted(null);
      alert("Past data cleared successfully.");
      loadData();
    } catch(e) {
      console.error(e);
      alert("Failed to clear past data.");
    }
  };`,
  ``
);

code = code.replace(
`          <button 
            onClick={handleClearPastData}
            className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Clear Past Data
          </button>`,
`          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-indigo-300 font-medium text-sm">{user?.name}</span>
          </div>`
);

fs.writeFileSync('src/pages/SupervisorDashboard.tsx', code);
