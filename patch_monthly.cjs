const fs = require('fs');
let code = fs.readFileSync('src/components/CashierMonthlyPerformance.tsx', 'utf8');

code = code.replace(
`import { CalendarRange } from 'lucide-react';`,
`import { CalendarRange } from 'lucide-react';\nimport { CashierHistoryModal } from './CashierHistoryModal';\nimport { Branch } from '../lib/types';`
);

code = code.replace(
`export function CashierMonthlyPerformance({ reconciliations }: { reconciliations: DailyReconciliation[] }) {`,
`export function CashierMonthlyPerformance({ reconciliations, branches }: { reconciliations: DailyReconciliation[], branches: Branch[] }) {\n  const [selectedCashier, setSelectedCashier] = useState<{id: string, name: string} | null>(null);`
);

code = code.replace(
`stats[tv.cashierId] = { name: tv.cashierName || 'Unknown', overUSD: 0, underUSD: 0, overZAR: 0, underZAR: 0 };`,
`stats[tv.cashierId] = { id: tv.cashierId, name: tv.cashierName || 'Unknown', overUSD: 0, underUSD: 0, overZAR: 0, underZAR: 0 };`
);

code = code.replace(
`<tr key={idx} className="hover:bg-[#112240]/50 transition-colors">`,
`<tr key={idx} className="hover:bg-[#1e345e] transition-colors cursor-pointer" onClick={() => setSelectedCashier({ id: c.id, name: c.name })}>
`
);

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

fs.writeFileSync('src/components/CashierMonthlyPerformance.tsx', code);
