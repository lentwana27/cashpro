const fs = require('fs');
let content = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');

const regexPhysicalOnChange = /onChange=\{\(e\) => \{\s*const newArr = \[\.\.\.items\];\s*newArr\[idx\]\.cashierId = e\.target\.value;\s*const c = cashiers\.find\(\(x: any\) => x\.id === e\.target\.value\);\s*newArr\[idx\]\.cashierName = c \? c\.name : "";\s*setItems\(newArr\);\s*\}\}/;

const physicalReplacement = `onChange={(e) => {
                    const newArr = [...items];
                    newArr[idx].cashierId = e.target.value;
                    const c = cashiers.find((x: any) => x.id === e.target.value);
                    newArr[idx].cashierName = c ? c.name : (e.target.value === 'none' ? 'None' : '');
                    if (e.target.value === 'none') {
                      newArr[idx].amount = 0;
                      newArr[idx].usdEquivalent = 0;
                    }
                    setItems(newArr);
                  }}`;

content = content.replace(regexPhysicalOnChange, physicalReplacement);

// We can also add hiddenIndices to PhysicalCashListField
content = content.replace(
  'showCashierName,\n  cashiers = []\n}: any) {',
  'showCashierName,\n  cashiers = [],\n  hiddenIndices = []\n}: any) {'
);

const regexMapStartPhysical = /\{items\.map\(\(item: any, idx: number\) => \(\s*<div\s*key=\{item\.id \|\| idx\}/;
const mapStartReplacementPhysical = `{items.map((item: any, idx: number) => {
          if (hiddenIndices && hiddenIndices.includes(idx)) return null;
          return (
          <div
            key={item.id || idx}`;

content = content.replace(regexMapStartPhysical, mapStartReplacementPhysical);

const regexMapEndPhysical = /<\/button>\s*<\/div>\s*<\/div>\s*\)\)}\s*<\/div>/;
const mapEndReplacementPhysical = `</button>
            </div>
          </div>
          );
        })}
      </div>`;

content = content.replace(regexMapEndPhysical, mapEndReplacementPhysical);

fs.writeFileSync('src/pages/SupervisorDashboard.tsx', content);
console.log('Patched PhysicalCashListField');
