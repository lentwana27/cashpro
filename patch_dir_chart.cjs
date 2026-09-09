const fs = require('fs');
let content = fs.readFileSync('src/pages/DirectorDashboard.tsx', 'utf8');

// replace the Bar inside BarChart
const oldBar = '<Bar dataKey="variance" fill="#f43f5e" radius={[4, 4, 0, 0]} />';
const newBar = `<Bar dataKey="variance" name="Variance (USD)" radius={[4, 4, 0, 0]}>
                  {charData.map((entry, index) => (
                    <Cell key={\`cell-\${index}\`} fill={entry.variance > 0 ? '#10b981' : entry.variance < 0 ? '#f43f5e' : '#64748b'} />
                  ))}
                </Bar>`;

content = content.replace(oldBar, newBar);

// We need to make sure Cell is imported from recharts
if (!content.includes('Cell } from \'recharts\'')) {
  content = content.replace(/ResponsiveContainer, BarChart, Bar } from 'recharts'/, 'ResponsiveContainer, BarChart, Bar, Cell } from \'recharts\'');
}

fs.writeFileSync('src/pages/DirectorDashboard.tsx', content);
console.log('Patched DirectorDashboard.tsx!');
