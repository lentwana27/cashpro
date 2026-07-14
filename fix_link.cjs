const fs = require('fs');
let code = fs.readFileSync('src/pages/SystemBranches.tsx', 'utf8');

code = code.replace(/<a href="\/users"/g, `<Link to="/users"`);
code = code.replace(/<\/a><\/strong>/g, `</Link></strong>`);

if (!code.includes("import { Link } from 'react-router-dom';")) {
  code = `import { Link } from 'react-router-dom';\n` + code;
}

fs.writeFileSync('src/pages/SystemBranches.tsx', code);
