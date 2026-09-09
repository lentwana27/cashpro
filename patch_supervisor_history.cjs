const fs = require('fs');
let content = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');

// 1. Add imports
if (!content.includes('ChevronDown')) {
    content = content.replace(
        '} from "lucide-react";',
        '  ChevronDown,\n  ChevronUp,\n} from "lucide-react";\nimport { motion, AnimatePresence } from "framer-motion";'
    );
}

// 2. Add expandedId state
if (!content.includes('const [expandedId, setExpandedId] = useState<string | null>(null);')) {
    content = content.replace(
        'const [history, setHistory] = useState<DailyReconciliation[]>([]);',
        'const [history, setHistory] = useState<DailyReconciliation[]>([]);\n  const [expandedId, setExpandedId] = useState<string | null>(null);'
    );
}

// 3. Add BreakdownSection at the very bottom (if not already there)
if (!content.includes('const BreakdownSection =')) {
    content += `\n\nconst BreakdownSection = ({ title, items }: { title: string, items: any }) => {
  const arr = Array.isArray(items) ? items : items ? [items] : [];
  if (arr.length === 0) return null;
  const total = arr.reduce((a:number,b:any)=>a+(b.usdEquivalent||0), 0);
  
  return (
    <div className="mb-4">
      <div className="flex justify-between font-medium text-slate-300 text-sm mb-2">
        <span>{title}</span>
        <span className="font-mono text-white">\${total.toFixed(2)}</span>
      </div>
      <div className="space-y-1.5 border-l-2 border-[#1e345e] ml-1 pl-3">
        {arr.map((item: any, idx: number) => (
          <div key={idx} className="flex justify-between text-xs">
            <span className="text-slate-400">
              {item.description || 'Unnamed'} 
              {(item.amount || item.amount === 0) && <span className="text-slate-500 ml-1">({item.amount} {item.currencyCode})</span>}
            </span>
            <span className="text-slate-300 font-mono">\${(item.usdEquivalent||0).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};\n`;
}

// 4. Update the table in SupervisorDashboard
// Add cursor-pointer to the <tr> and onClick to toggle expandedId
const trRegex = /<tr\s*key=\{r\.id\}\s*className="hover:bg-\[#112240\]\/50 transition-colors"\s*>/;
content = content.replace(trRegex, `<tr
                  key={r.id}
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  className={clsx("transition-colors cursor-pointer", expandedId === r.id ? "bg-[#112240]" : "hover:bg-[#112240]/50")}
                >`);

// Add the expand chevron cell, maybe next to Date? Or add a new column for actions/expand.
// Wait, they can just click the row. Let's add the AnimatePresence below the row.
const tbodyRegex = /(<td className="px-6 py-4 text-center">[\s\S]*?<\/td>\s*<\/tr>)/;
// Wait, I need to match the specific </tr> inside the map.
// Let's use string splitting or a more precise regex.

fs.writeFileSync('src/pages/SupervisorDashboard.tsx', content);
console.log("Patched SupervisorDashboard Part 1");
