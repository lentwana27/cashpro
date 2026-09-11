const fs = require('fs');
let content = fs.readFileSync('src/pages/AuditorDashboard.tsx', 'utf8');

const target = `      <CashierShortageChart reconciliations={filteredRecon} branches={branches} />
    </div>
  );
}`;

const replacement = `      <CashierShortageChart reconciliations={filteredRecon} branches={branches} />
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
      )}
    </div>
  );
}`;

if(content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/pages/AuditorDashboard.tsx', content);
  console.log("Patched modal!");
} else {
  console.log("Target not found!");
}
