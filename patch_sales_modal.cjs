const fs = require('fs');
let content = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');

const regexSelectOnChange = /onChange=\{e => \{\s*const newVars = \[\.\.\.tillVariances\];\s*newVars\[idx\]\.cashierId = e\.target\.value;\s*setTillVariances\(newVars\);\s*\}\}/;

const replacement = `onChange={e => {
                      const newVars = [...tillVariances];
                      newVars[idx].cashierId = e.target.value;
                      setTillVariances(newVars);
                      if (e.target.value === 'none') {
                        const newSales = [...sales];
                        if (newSales[idx]) {
                          newSales[idx].amount = 0;
                          newSales[idx].usdEquivalent = 0;
                          setSales(newSales);
                        }
                      }
                    }}`;

content = content.replace(regexSelectOnChange, replacement);

const regexReconListFieldCall = /<ReconListField\s*title="Total Sales \(from POS System\)"\s*items=\{sales\}\s*setItems=\{setSales\}\s*currencies=\{currencies\}\s*getUsd=\{getUsd\}\s*\/>/;

const reconReplacement = `<ReconListField
          title="Total Sales (from POS System)"
          items={sales}
          setItems={setSales}
          currencies={currencies}
          getUsd={getUsd}
          hiddenIndices={tillVariances.map((tv, i) => tv.cashierId === 'none' ? i : -1).filter(i => i !== -1)}
        />`;

content = content.replace(regexReconListFieldCall, reconReplacement);

fs.writeFileSync('src/pages/SupervisorDashboard.tsx', content);
console.log('Patched SalesInputModal');
