const fs = require('fs');
let content = fs.readFileSync('src/pages/SystemUsers.tsx', 'utf8');

const oldEditButtonCheck = `                      {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERVISOR' || currentUser?.role === 'AUDITOR') && (`;

const newEditButtonCheck = `                      {((currentUser?.role === 'ADMIN') || 
                         (currentUser?.role === 'SUPERVISOR' && u.role === 'CASHIER') || 
                         (currentUser?.role === 'AUDITOR' && (u.role === 'CASHIER' || u.role === 'SUPERVISOR'))) && (`;

if (content.includes(oldEditButtonCheck)) {
  content = content.replace(oldEditButtonCheck, newEditButtonCheck);
  fs.writeFileSync('src/pages/SystemUsers.tsx', content);
  console.log("Patched edit button check");
} else {
  console.log("Could not find edit button check");
}
