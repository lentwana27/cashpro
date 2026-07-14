const fs = require('fs');
let code = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');

code = code.replace(/function ReconListField\(\{\n  title,\n  items,\n  setItems,\n  currencies,\n  getUsd,\n  showCashierName,\n\}: any\) \{/g, 
`function ReconListField({
  title,
  items,
  setItems,
  currencies,
  getUsd,
  showCashierName,
  cashiers = []
}: any) {`);

code = code.replace(/\{showCashierName && \(\n\s*<input\n\s*type="text"\n\s*value=\{item.cashierName \|\| ""\}\n\s*onKeyDown=\{\(e\) => \{\n\s*if \(e.key === "Enter"\) e.preventDefault\(\);\n\s*\}\}\n\s*onChange=\{\(e\) => \{\n\s*const newArr = \[\.\.\.items\];\n\s*newArr\[idx\].cashierName = e.target.value;\n\s*setItems\(newArr\);\n\s*\}\}\n\s*placeholder="Cashier Name \(Optional\)\.\.\."\n\s*className="w-full bg-transparent text-xs text-blue-300 focus:outline-none mb-2"\n\s*\/>\n\s*\)\}/g,
`              {showCashierName && (
                <select
                  required
                  value={item.cashierId || ""}
                  onChange={(e) => {
                    const newArr = [...items];
                    newArr[idx].cashierId = e.target.value;
                    const c = cashiers.find((x: any) => x.id === e.target.value);
                    newArr[idx].cashierName = c ? c.name : "";
                    setItems(newArr);
                  }}
                  className="w-full bg-[#061121] text-xs text-blue-300 focus:outline-none mb-2 border border-[#1e345e] p-1.5 rounded"
                >
                  <option value="">Select Till Operator...</option>
                  {cashiers.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}`);

// Also update CashUpForm's ReconListField call for Cash Breakdown to pass cashiers
code = code.replace(/<ReconListField\n\s*title="Physical Cash Breakdown"\n\s*items=\{cashBreakdown\}\n\s*setItems=\{setCashBreakdown\}\n\s*currencies=\{currencies\}\n\s*getUsd=\{getUsd\}\n\s*showCashierName=\{true\}\n\s*\/>/g,
`<ReconListField
            title="Physical Cash Breakdown"
            items={cashBreakdown}
            setItems={setCashBreakdown}
            currencies={currencies}
            getUsd={getUsd}
            showCashierName={true}
            cashiers={cashiers}
          />`);

fs.writeFileSync('src/pages/SupervisorDashboard.tsx', code);
