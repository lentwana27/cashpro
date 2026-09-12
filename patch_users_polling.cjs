const fs = require('fs');
let content = fs.readFileSync('src/pages/SystemUsers.tsx', 'utf8');

content = content.replace(
  'const interval = setInterval(loadUsersAndBranches, 30000);',
  'const interval = setInterval(loadUsersAndBranches, 5000);'
);

fs.writeFileSync('src/pages/SystemUsers.tsx', content);
