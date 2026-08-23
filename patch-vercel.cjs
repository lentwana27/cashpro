const fs = require('fs');

// 1. package.json
let pkg = fs.readFileSync('package.json', 'utf8');
pkg = pkg.replace(
  /"build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist\/server.cjs && cp dist\/server.cjs api\/server-build.cjs"/,
  `"build": "vite build && esbuild server.ts --bundle --platform=node --format=esm --packages=external --sourcemap --outfile=dist/server.js && cp dist/server.js api/index.js"`
);
pkg = pkg.replace(
  /"start": "node dist\/server.cjs"/,
  `"start": "node dist/server.js"`
);
fs.writeFileSync('package.json', pkg);

// 2. vercel.json
const vercel = {
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.js"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
};
fs.writeFileSync('vercel.json', JSON.stringify(vercel, null, 2));

// 3. remove old cjs files
if (fs.existsSync('api/index.cjs')) fs.unlinkSync('api/index.cjs');
if (fs.existsSync('api/server-build.cjs')) fs.unlinkSync('api/server-build.cjs');
