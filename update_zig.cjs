const fs = require('fs');
let serverCode = fs.readFileSync('server.ts', 'utf8');
serverCode = serverCode.replace(/'er-zmw'/g, "'er-zig'");
serverCode = serverCode.replace(/currencyCode:\s*'ZMW'/g, "currencyCode: 'ZiG'");
fs.writeFileSync('server.ts', serverCode);
console.log('Replaced ZMW with ZiG in server.ts');
