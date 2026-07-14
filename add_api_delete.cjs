const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf8');

if (!code.includes('async delete(endpoint: string)')) {
  code = code.replace(/export const api = \{/g, `export const api = {
  async delete(endpoint: string) {
    const res = await fetch(\`\${API_BASE}\${endpoint}\`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Server error');
    }
    const textRes = await res.text();
    try { return JSON.parse(textRes); } catch(e) { return {}; }
  },`);
  fs.writeFileSync('src/lib/api.ts', code);
}
