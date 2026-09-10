import { db } from './src/db/index.js';
import * as schema from './src/db/schema.js';

async function clearDB() {
  console.log("Clearing messages...");
  await db.delete(schema.messages);
  console.log("Clearing system logs...");
  await db.delete(schema.systemLogs);
  console.log("Clearing reconciliations...");
  await db.delete(schema.reconciliations);
  console.log("Clearing branches...");
  await db.delete(schema.branches);
  console.log("Clearing exchange rate history...");
  await db.delete(schema.exchangeRateHistory);
  console.log("Clearing exchange rates...");
  await db.delete(schema.exchangeRates);
  console.log("Clearing users...");
  await db.delete(schema.users);
  console.log("All data cleared.");
  process.exit(0);
}

clearDB().catch(console.error);
