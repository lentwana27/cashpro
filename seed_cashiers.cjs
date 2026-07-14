import { db } from './src/db/index.js';
import * as schema from './src/db/schema.js';

async function seed() {
  await db.insert(schema.users).values([
    { id: 'c1', name: 'Alice Cashier', email: 'alice@cashuppro.com', role: 'CASHIER', active: true, branchId: 'HQ01' },
    { id: 'c2', name: 'Bob Till', email: 'bob@cashuppro.com', role: 'CASHIER', active: true, branchId: 'HQ01' }
  ]).onConflictDoNothing();
  console.log("Seeded cashiers");
}
seed();
