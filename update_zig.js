const fs = require('fs');

const serverFile = 'server.ts';
let serverCode = fs.readFileSync(serverFile, 'utf8');

serverCode = serverCode.replace(/'er-zmw'/g, "'er-zig'");
serverCode = serverCode.replace(/currencyCode:\s*'ZMW'/g, "currencyCode: 'ZiG'");

fs.writeFileSync(serverFile, serverCode);
console.log('Replaced ZMW with ZiG in server.ts');
