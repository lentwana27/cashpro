const fs = require('fs');
let content = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');

// Add "none" to Select Cashier options in SalesInputModal
content = content.replace(
  '<option value="">Select Cashier for {tv.tillName}...</option>',
  '<option value="">Select Cashier for {tv.tillName}...</option>\n                    <option value="none">None - Not Working</option>'
);

// Add "none" to Cashier Assignment in the main form (if applicable)
content = content.replace(
  '<option value="">Select Till Operator...</option>',
  '<option value="">Select Till Operator...</option>\n                  <option value="none">None - Not Working</option>'
);

// For sales array mapping, if cashier is "none", hide the input in ReconListField?
// Wait, ReconListField takes `items`. Let's just modify the `SalesInputModal` render logic:
// Instead of modifying ReconListField, we can just hide it inside ReconListField by adding a hidden property.
// But ReconListField is used for other fields too.

fs.writeFileSync('src/pages/SupervisorDashboard.tsx', content);
console.log('Patched options');
