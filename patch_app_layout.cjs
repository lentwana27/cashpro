const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(/<ProtectedRoute allowedRoles=\{\['ADMIN'\]\}>/g, "<ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR']}>");
fs.writeFileSync('src/App.tsx', app);

let layout = fs.readFileSync('src/components/Layout.tsx', 'utf8');
layout = layout.replace(/\{user\.role === 'ADMIN' && \(/g, "{(user.role === 'ADMIN' || user.role === 'SUPERVISOR') && (");
fs.writeFileSync('src/components/Layout.tsx', layout);

