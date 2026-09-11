const fs = require('fs');
let content = fs.readFileSync('src/pages/SystemUsers.tsx', 'utf8');

// 1. Restrict role options dropdown
const oldRoleOptions = `                  {(currentUser?.role === 'ADMIN' || currentUser?.role === 'AUDITOR') && (
                    <>
                      <option value="ACCOUNTANT">Accountant</option>
                      <option value="HEAD_ACCOUNTANT">Head Accountant</option>
                      <option value="AUDITOR">Auditor</option>
                      <option value="DIRECTOR">Director</option>`;

const newRoleOptions = `                  {currentUser?.role === 'ADMIN' && (
                    <>
                      <option value="ACCOUNTANT">Accountant</option>
                      <option value="HEAD_ACCOUNTANT">Head Accountant</option>
                      <option value="AUDITOR">Auditor</option>
                      <option value="DIRECTOR">Director</option>`;

if(content.includes(oldRoleOptions)) {
    content = content.replace(oldRoleOptions, newRoleOptions);
} else {
    // If exact match fails, use regex
    content = content.replace(
      /\{\(currentUser\?\.role === 'ADMIN' \|\| currentUser\?\.role === 'AUDITOR'\) && \(\s*<>\s*<option value="ACCOUNTANT">/g,
      "{currentUser?.role === 'ADMIN' && (\n                    <>\n                      <option value=\"ACCOUNTANT\">"
    );
}

// 2. Restrict transfer to audit
const oldTransfer = `                          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'AUDITOR') && (
                            <button 
                              onClick={() => handleTransferToAudit(u.id)}`;

const newTransfer = `                          {currentUser?.role === 'ADMIN' && (
                            <button 
                              onClick={() => handleTransferToAudit(u.id)}`;

if(content.includes(oldTransfer)) {
    content = content.replace(oldTransfer, newTransfer);
} else {
    content = content.replace(
      /\{\(currentUser\?\.role === 'ADMIN' \|\| currentUser\?\.role === 'AUDITOR'\) && \(\s*<button\s*onClick=\{\(\) => handleTransferToAudit\(u\.id\)\}/g,
      "{currentUser?.role === 'ADMIN' && (\n                            <button \n                              onClick={() => handleTransferToAudit(u.id)}"
    );
}


fs.writeFileSync('src/pages/SystemUsers.tsx', content);
console.log('Patched SystemUsers.tsx roles for Auditor');
