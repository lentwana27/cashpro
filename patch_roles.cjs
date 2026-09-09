const fs = require('fs');
let content = fs.readFileSync('src/pages/SystemUsers.tsx', 'utf8');

content = content.replace(
  /<option value="ACCOUNTANT">Accountant<\/option>\s*<option value="HEAD_ACCOUNTANT">Head Accountant<\/option>\s*<option value="AUDITOR">Auditor<\/option>\s*<option value="DIRECTOR">Director<\/option>\s*<option value="ADMIN">Admin<\/option>/,
  `{currentUser?.role === 'ADMIN' && (
                    <>
                      <option value="ACCOUNTANT">Accountant</option>
                      <option value="HEAD_ACCOUNTANT">Head Accountant</option>
                      <option value="AUDITOR">Auditor</option>
                      <option value="DIRECTOR">Director</option>
                      <option value="ADMIN">Admin</option>
                    </>
                  )}`
);

fs.writeFileSync('src/pages/SystemUsers.tsx', content);
