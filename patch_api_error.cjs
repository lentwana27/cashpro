const fs = require('fs');
let content = fs.readFileSync('src/lib/api.ts', 'utf8');

const errorReplace = `
    if (!res.ok) {
      let msg = 'Server error';
      try {
        const data = await res.json();
        if (data.error) msg = data.error;
      } catch(e) {}
      throw new Error(msg);
    }
`;

content = content.replace(/if \(!res\.ok\) \{\s*throw new Error\('Server error'\);\s*\}/g, errorReplace);

fs.writeFileSync('src/lib/api.ts', content);
console.log('Patched api.ts');
