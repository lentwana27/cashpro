const fs = require('fs');
let code = fs.readFileSync('src/components/CashierMonthlyPerformance.tsx', 'utf8');

code = code.replace(
`import { CalendarRange } from 'lucide-react';`,
`import { CalendarRange, Search } from 'lucide-react';`
);

code = code.replace(
`  const [selectedCashier, setSelectedCashier] = useState<{id: string, name: string} | null>(null);`,
`  const [selectedCashier, setSelectedCashier] = useState<{id: string, name: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');`
);

code = code.replace(
`        <select 
          value={selectedMonth} 
          onChange={e => setSelectedMonth(e.target.value)}
          className="bg-[#112240] border border-[#1e345e] text-white rounded p-2 focus:outline-none"
        >
          {availableMonths.map(m => (
            <option key={m} value={m}>{format(parseISO(m + '-01'), 'MMMM yyyy')}</option>
          ))}
          {availableMonths.length === 0 && <option value={selectedMonth}>{format(parseISO(selectedMonth + '-01'), 'MMMM yyyy')}</option>}
        </select>
      </div>`,
`        <div className="flex items-center gap-3 w-full sm:w-auto mt-3 sm:mt-0">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search operator..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#112240] border border-[#1e345e] rounded-lg py-1.5 pl-9 pr-4 text-white text-sm focus:outline-none focus:border-blue-500 sm:w-64"
            />
          </div>
          <select 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-[#112240] border border-[#1e345e] text-white rounded py-1.5 px-3 text-sm focus:outline-none flex-1 sm:flex-none"
          >
            {availableMonths.map(m => (
              <option key={m} value={m}>{format(parseISO(m + '-01'), 'MMMM yyyy')}</option>
            ))}
            {availableMonths.length === 0 && <option value={selectedMonth}>{format(parseISO(selectedMonth + '-01'), 'MMMM yyyy')}</option>}
          </select>
        </div>
      </div>`
);

code = code.replace(
`              ) : monthlyStats.map((c, idx) => (`,
`              ) : monthlyStats.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map((c, idx) => (`
);

fs.writeFileSync('src/components/CashierMonthlyPerformance.tsx', code);
