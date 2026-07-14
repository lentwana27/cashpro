const fs = require('fs');
let code = fs.readFileSync('src/pages/SystemUsers.tsx', 'utf8');

// Update loadUsers
code = code.replace(/setUsers\(usrs\.filter\(\(u: User\) => u\.id !== currentUser\?\.id\)\);/g, `
      if (currentUser?.role === 'SUPERVISOR') {
        setUsers(usrs.filter((u: User) => u.role === 'CASHIER' && u.branchId === currentUser.branchId && u.id !== currentUser.id));
      } else {
        setUsers(usrs.filter((u: User) => u.id !== currentUser?.id));
      }
`);

// Update loadBranches
code = code.replace(/setBranches\(brs\);/g, `
      if (currentUser?.role === 'SUPERVISOR') {
        setBranches(brs.filter((b: any) => b.id === currentUser.branchId));
      } else {
        setBranches(brs);
      }
`);

// Update openModal
code = code.replace(/setEditingUser\(\{ name: '', email: '', role: 'CASHIER', active: true, branchId: '' \}\);/g, `
      setEditingUser({ 
        name: '', 
        email: '', 
        role: 'CASHIER', 
        active: true, 
        branchId: currentUser?.role === 'SUPERVISOR' ? currentUser?.branchId : '' 
      });
`);

// In the select for role:
code = code.replace(/<select required value=\{editingUser\.role \|\| 'CASHIER'\} onChange=\{e => setEditingUser\(\{\.\.\.editingUser, role: e\.target\.value as UserRole\}\)\} className="w-full bg-\[#061121\] border border-\[#1e345e\] rounded-lg px-4 py-2 text-white">/g, `<select required value={editingUser.role || 'CASHIER'} onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})} className="w-full bg-[#061121] border border-[#1e345e] rounded-lg px-4 py-2 text-white" disabled={currentUser?.role === 'SUPERVISOR'}>`);

// Disable branch selection for supervisor
code = code.replace(/<select value=\{editingUser\.branchId \|\| ''\} onChange=\{e => setEditingUser\(\{\.\.\.editingUser, branchId: e\.target\.value\}\)\} className="w-full bg-\[#061121\] border border-\[#1e345e\] rounded-lg px-4 py-2 text-white">/g, `<select value={editingUser.branchId || ''} onChange={e => setEditingUser({...editingUser, branchId: e.target.value})} className="w-full bg-[#061121] border border-[#1e345e] rounded-lg px-4 py-2 text-white" disabled={currentUser?.role === 'SUPERVISOR'}>`);

fs.writeFileSync('src/pages/SystemUsers.tsx', code);

