const fs = require('fs');

let sysUsers = fs.readFileSync('src/pages/SystemUsers.tsx', 'utf8');
sysUsers = sysUsers.replace(
  'branchId: editUser.branchId || \'\'',
  'branchId: editUser.branchId || null'
);
sysUsers = sysUsers.replace(
  'const payload = { ...editUser };',
  'const payload = { ...editUser, branchId: editUser.branchId || null };'
);
fs.writeFileSync('src/pages/SystemUsers.tsx', sysUsers);

let adminDash = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');
adminDash = adminDash.replace(
  'branchId: userEditForm.branchId === \'\' ? undefined : userEditForm.branchId',
  'branchId: userEditForm.branchId === \'\' ? null : userEditForm.branchId'
);
fs.writeFileSync('src/pages/AdminDashboard.tsx', adminDash);
