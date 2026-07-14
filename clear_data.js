import { db } from './src/db/index.js';
import * as schema from './src/db/schema.js';

async function run() {
  await db.delete(schema.messages);
  await db.delete(schema.reconciliations);
  await db.delete(schema.systemLogs);
  await db.delete(schema.exchangeRateHistory);
  console.log("Past data cleared, accounts kept");
}
run();
