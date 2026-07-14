const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('api.delete(\'/reconciliations/branch/:branchId\'')) {
  code = code.replace(/api\.get\('\/reconciliations', async \(req, res\) => \{/g, `
api.delete('/reconciliations/branch/:branchId', async (req, res) => {
  try {
    const { branchId } = req.params;
    await db.delete(schema.reconciliations).where(eq(schema.reconciliations.branchId, branchId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

api.get('/reconciliations', async (req, res) => {`);
  fs.writeFileSync('server.ts', code);
}
