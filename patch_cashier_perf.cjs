const fs = require('fs');
let code = fs.readFileSync('src/components/CashierPerformance.tsx', 'utf8');

// Add imports
code = code.replace(
`import { Users } from 'lucide-react';`,
`import { Users } from 'lucide-react';\nimport { CashierHistoryModal } from './CashierHistoryModal';\nimport { Branch } from '../lib/types';\nimport { useState } from 'react';`
);

// Update props
code = code.replace(
`export function CashierPerformance({ reconciliations, }: { reconciliations: DailyReconciliation[], }) {`,
`export function CashierPerformance({ reconciliations, branches }: { reconciliations: DailyReconciliation[], branches: Branch[] }) {\n  const [selectedCashier, setSelectedCashier] = useState<{id: string, name: string} | null>(null);`
);

// Update tr logic to make it clickable
code = code.replace(
`<tr key={idx} className="hover:bg-[#112240]/50 transition-colors">`,
`<tr key={idx} className="hover:bg-[#1e345e] transition-colors cursor-pointer" onClick={() => setSelectedCashier({ id: c.id, name: c.name })}>
`
);

// Ensure the map provides c.id
code = code.replace(
`stats[tv.cashierId] = { name: tv.cashierName || 'Unknown', sales: 0, cash: 0, variance: 0, totalOvers: 0, totalUnders: 0, counts: 0 };`,
`stats[tv.cashierId] = { id: tv.cashierId, name: tv.cashierName || 'Unknown', sales: 0, cash: 0, variance: 0, totalOvers: 0, totalUnders: 0, counts: 0 };`
);

// Add the modal at the end before final div
code = code.replace(
`      </div>
    </div>
  );`,
`      </div>
      {selectedCashier && (
        <CashierHistoryModal
          cashierId={selectedCashier.id}
          cashierName={selectedCashier.name}
          reconciliations={reconciliations}
          branches={branches}
          onClose={() => setSelectedCashier(null)}
        />
      )}
    </div>
  );`
);

fs.writeFileSync('src/components/CashierPerformance.tsx', code);
