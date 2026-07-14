const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

if (!app.includes('TillOperators')) {
  app = app.replace(/import \{ SystemUsers \} from '\.\/pages\/SystemUsers';/, "import { SystemUsers } from './pages/SystemUsers';\nimport { TillOperators } from './pages/TillOperators';");
  
  app = app.replace(/<Route path="\/branches" element=\{/g, 
    `<Route path="/till-operators" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'ACCOUNTANT', 'HEAD_ACCOUNTANT', 'DIRECTOR', 'AUDITOR', 'SUPERVISOR']}>
              <Layout>
                <TillOperators />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/branches" element={`);
          
  fs.writeFileSync('src/App.tsx', app);
}
