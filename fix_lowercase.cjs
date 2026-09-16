const fs = require('fs');

let sysUsers = fs.readFileSync('src/pages/SystemUsers.tsx', 'utf8');
sysUsers = sysUsers.replace(
  'u.name.toLowerCase().includes(searchQuery.toLowerCase())',
  '(u.name || "").toLowerCase().includes((searchQuery || "").toLowerCase())'
);
sysUsers = sysUsers.replace(
  'u.email.toLowerCase().includes(searchQuery.toLowerCase())',
  '(u.email || "").toLowerCase().includes((searchQuery || "").toLowerCase())'
);
sysUsers = sysUsers.replace(
  'u.role.toLowerCase().includes(searchQuery.toLowerCase())',
  '(u.role || "").toLowerCase().includes((searchQuery || "").toLowerCase())'
);
sysUsers = sysUsers.replace(
  '((branches || []).find((b) => b.id === u.branchId)?.name || \'\').toLowerCase().includes(searchQuery.toLowerCase())',
  '((branches || []).find((b) => b.id === u.branchId)?.name || "").toLowerCase().includes((searchQuery || "").toLowerCase())'
);
fs.writeFileSync('src/pages/SystemUsers.tsx', sysUsers);

