const fs = require('fs');
let content = fs.readFileSync('src/pages/AuditorDashboard.tsx', 'utf8');

// 1. Remove the misplaced modal logic
const misplacedLogic = `
      {editingSalesId && (
        <InputSalesModal 
          currentUser={user}
          reconciliation={reconciliations.find(r => r.id === editingSalesId)} 
          rates={rates} 
          onClose={() => setEditingSalesId(null)}
          onUpdate={() => {
            setEditingSalesId(null);
            loadData();
          }}
        />
      )}`;

content = content.replace(misplacedLogic, '');

// 2. Insert it just before the end of AuditorDashboard component.
// To find the end of AuditorDashboard, we search for `export function AuditorDashboard() {` 
// and its closing `return ( ... ); }`
// Actually, I can just search for `<CashierShortageChart reconciliations={filteredRecon} branches={branches} />`
// and place it right after that block.

const chartBlock = `<CashierShortageChart reconciliations={filteredRecon} branches={branches} />
        </div>
      </div>`;

const newChartBlock = `<CashierShortageChart reconciliations={filteredRecon} branches={branches} />
        </div>
      </div>
      
      {editingSalesId && (
        <InputSalesModal 
          currentUser={user}
          reconciliation={reconciliations.find(r => r.id === editingSalesId)} 
          rates={rates} 
          onClose={() => setEditingSalesId(null)}
          onUpdate={() => {
            setEditingSalesId(null);
            loadData();
          }}
        />
      )}`;

content = content.replace(chartBlock, newChartBlock);
fs.writeFileSync('src/pages/AuditorDashboard.tsx', content);
console.log("Fixed Auditor Dashboard modal placement");
