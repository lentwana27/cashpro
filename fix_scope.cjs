const fs = require('fs');
let content = fs.readFileSync('src/pages/SystemUsers.tsx', 'utf8');

const filteredUsersCode = `const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (branches.find((b) => b.id === u.branchId)?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );`;

// Remove the wrongly placed filteredUsers code
content = content.replace(filteredUsersCode, '');

// Place it right before the actual return statement
content = content.replace(
  '  return (\n    <div className="space-y-6">',
  `  ${filteredUsersCode}\n\n  return (\n    <div className="space-y-6">`
);

fs.writeFileSync('src/pages/SystemUsers.tsx', content);
console.log('Fixed scope');
