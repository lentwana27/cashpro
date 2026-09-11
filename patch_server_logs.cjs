const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const oldPut = `api.put('/reconciliations/:id', async (req, res) => {
  await db.update(schema.reconciliations).set({ ...req.body, updatedAt: new Date().toISOString() }).where(eq(schema.reconciliations.id, req.params.id));
  const recs = await db.select().from(schema.reconciliations).where(eq(schema.reconciliations.id, req.params.id));
  res.json(recs[0] || {});
});`;

const newPut = `api.put('/reconciliations/:id', async (req, res) => {
  const uid = req.headers['x-user-id'];
  const uname = req.headers['x-user-name'];
  
  if (uid && uname) {
    if (req.body.salesConfirmed === true) {
      logAction(uid, uname, 'CONFIRM SALES', \`Locked sales for reconciliation \${req.params.id}\`);
    }
    if (req.body.salesInputtedByName) {
      logAction(uid, uname, 'INPUT SALES', \`Inputted sales for reconciliation \${req.params.id}\`);
    }
    if (req.body.auditorAmendmentApproval) {
      logAction(uid, uname, 'AUDITOR AMENDMENT APPROVAL', \`Auditor approved amendment for \${req.params.id}\`);
    }
    if (req.body.accountantAmendmentApproval) {
      logAction(uid, uname, 'ACCT AMENDMENT APPROVAL', \`Accountant approved amendment for \${req.params.id}\`);
    }
    if (req.body.status) {
      logAction(uid, uname, 'UPDATE STATUS', \`Status changed to \${req.body.status} for \${req.params.id}\`);
    }
  }

  await db.update(schema.reconciliations).set({ ...req.body, updatedAt: new Date().toISOString() }).where(eq(schema.reconciliations.id, req.params.id));
  const recs = await db.select().from(schema.reconciliations).where(eq(schema.reconciliations.id, req.params.id));
  res.json(recs[0] || {});
});`;

if (content.includes(oldPut)) {
  content = content.replace(oldPut, newPut);
  fs.writeFileSync('server.ts', content);
  console.log("Patched server.ts logs");
} else {
  console.log("Could not find api.put in server.ts");
}
