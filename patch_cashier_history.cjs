const fs = require('fs');
let code = fs.readFileSync('src/components/CashierHistoryModal.tsx', 'utf8');

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

  const filtered = searchDate ? history.filter(h => h.date.includes(searchDate)) : history;
`;

code = code.replace(
  `const filtered = searchDate ? history.filter(h => h.date.includes(searchDate)) : history;`,
  heatmapCode
);

const heatmapUI = `
        <div className="p-6 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-400 mb-2">Last 30 Days Variance</h3>
            <div className="flex flex-wrap gap-1">
              {heatmapData.map(d => (
                <div 
                  key={d.date} 
                  title={\`\${format(new Date(d.date), 'MMM dd')}: \${d.variance === null ? 'No Data' : (d.variance > 0 ? '+' : '') + (d.variance !== null ? d.variance.toFixed(2) : '')}\`}
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
`;

code = code.replace(
  `<div className="p-6 overflow-y-auto">`,
  heatmapUI
);

fs.writeFileSync('src/components/CashierHistoryModal.tsx', code);
