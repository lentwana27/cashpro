const fs = require('fs');
let code = fs.readFileSync('src/components/CashierPerformance.tsx', 'utf8');

code = code.replace(
`import { Users } from 'lucide-react';`,
`import { Users, Search } from 'lucide-react';`
);

code = code.replace(
`  const [selectedCashier, setSelectedCashier] = useState<{id: string, name: string} | null>(null);`,
`  const [selectedCashier, setSelectedCashier] = useState<{id: string, name: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');`
);

code = code.replace(
`        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-400" /> Cashier Performance (Shortages per Till Operator)
        </h2>
      </div>`,
`        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-400" /> Cashier Performance (Shortages per Till Operator)
        </h2>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search operator..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-[#112240] border border-[#1e345e] rounded-lg py-1.5 pl-9 pr-4 text-white text-sm focus:outline-none focus:border-blue-500 w-48 sm:w-64"
          />
        </div>
      </div>`
);

code = code.replace(
`{cashierStats.map((c, idx) => (`,
`{cashierStats.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map((c, idx) => (`
);

fs.writeFileSync('src/components/CashierPerformance.tsx', code);
