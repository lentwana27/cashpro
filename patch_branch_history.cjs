const fs = require('fs');
let code = fs.readFileSync('src/components/BranchHistoryModal.tsx', 'utf8');

const heatmapCode = `
  const heatmapData = useMemo(() => {
    const days = 30;
    const end = new Date();
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(end.getDate() - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      
      const dayRecords = history.filter(h => h.date.startsWith(dateStr));
      const totalVar = dayRecords.reduce((acc, curr) => acc + curr.variance, 0);
      
      data.push({
        date: dateStr,
        variance: dayRecords.length > 0 ? totalVar : null
      });
    }
    return data;
  }, [history]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0a192f] border border-[#1e345e] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-[#1e345e] flex justify-between items-center bg-[#112240] rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">{branch.name}</h2>
            <p className="text-slate-400 text-sm mt-1">Past Performance History</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-400 mb-2">Last 30 Days Variance</h3>
            <div className="flex flex-wrap gap-1">
              {heatmapData.map(d => (
                <div 
                  key={d.date} 
                  title={\`\${format(new Date(d.date), 'MMM dd')}: \${d.variance === null ? 'No Data' : (d.variance > 0 ? '+' : '') + d.variance.toFixed(2)}\`}
                  className={clsx(
                    "w-6 h-6 rounded-sm cursor-pointer hover:ring-2 hover:ring-white transition-all",
                    d.variance === null ? "bg-[#1e345e]" : 
                    d.variance === 0 ? "bg-slate-500" :
                    d.variance > 0 ? "bg-emerald-500" : "bg-rose-500"
                  )}
                  onClick={() => setSearchDate(d.date)}
                />
              ))}
            </div>
          </div>

          <div className="mb-6 relative">
`;

code = code.replace(
`  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0a192f] border border-[#1e345e] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-[#1e345e] flex justify-between items-center bg-[#112240] rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">{branch.name}</h2>
            <p className="text-slate-400 text-sm mt-1">Past Performance History</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="mb-6 relative">`,
heatmapCode
);

fs.writeFileSync('src/components/BranchHistoryModal.tsx', code);
