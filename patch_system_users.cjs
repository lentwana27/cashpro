const fs = require('fs');
let content = fs.readFileSync('src/pages/SystemUsers.tsx', 'utf8');

// 1. Allow Supervisor to Add User
content = content.replace(
  "{currentUser?.role === 'ADMIN' && (",
  "{(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERVISOR') && ("
);

// 2. Allow Supervisor to Edit/Delete User
content = content.replace(
  "{currentUser?.role === 'ADMIN' && (",
  "{(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERVISOR') && ("
);

// We need to implement "Transfer to Audit". 
// It could just be a button that calls `handleTransferToAudit(u.id)` which updates the role to AUDITOR.

fs.writeFileSync('src/pages/SystemUsers.tsx', content);
