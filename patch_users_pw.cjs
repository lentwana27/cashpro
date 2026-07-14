const fs = require('fs');
let code = fs.readFileSync('src/pages/SystemUsers.tsx', 'utf8');

code = code.replace(/password: userPassword \|\| 'password123',/g, "passwordHash: userPassword || 'password123',");
code = code.replace(/if \(userPassword\) payload\.password = userPassword;/g, "if (userPassword) payload.passwordHash = userPassword;");

fs.writeFileSync('src/pages/SystemUsers.tsx', code);
