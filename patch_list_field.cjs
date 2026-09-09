const fs = require('fs');
let content = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');

content = content.replace(
  'showCashierName,\n  cashiers = []\n}: any) {',
  'showCashierName,\n  cashiers = [],\n  hiddenIndices = []\n}: any) {'
);

// We need to carefully replace the arrow function for items.map.
const regexMapStart = /\{items\.map\(\(item: any, idx: number\) => \(\s*<div\s*key=\{item\.id \|\| idx\}/;
const mapStartReplacement = `{items.map((item: any, idx: number) => {
          if (hiddenIndices && hiddenIndices.includes(idx)) return null;
          return (
          <div
            key={item.id || idx}`;

content = content.replace(regexMapStart, mapStartReplacement);

const regexMapEnd = /<\/button>\s*<\/div>\s*<\/div>\s*\)\)}\s*<\/div>/;
const mapEndReplacement = `</button>
            </div>
          </div>
          );
        })}
      </div>`;

content = content.replace(regexMapEnd, mapEndReplacement);

fs.writeFileSync('src/pages/SupervisorDashboard.tsx', content);
console.log('Patched list field');
