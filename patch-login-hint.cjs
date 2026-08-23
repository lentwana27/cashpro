const fs = require('fs');
let code = fs.readFileSync('src/pages/Login.tsx', 'utf8');
code = code.replace(
  'Please enter the 6-digit authentication code to verify your identity (Hint: 123456).',
  'Please enter your 6-digit authentication code to verify your identity.'
);
fs.writeFileSync('src/pages/Login.tsx', code);
