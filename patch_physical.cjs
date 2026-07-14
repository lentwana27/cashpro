const fs = require('fs');
let code = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');
const physicalCode = fs.readFileSync('PhysicalCashListField.txt', 'utf8');

code = code.replace("function ReconListField({", physicalCode + "\n\nfunction ReconListField({");

code = code.replace(
`          <ReconListField
            title="Physical Cash Breakdown"`,
`          <PhysicalCashListField
            title="Physical Cash Breakdown"`);

fs.writeFileSync('src/pages/SupervisorDashboard.tsx', code);
