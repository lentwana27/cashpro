import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';
async function run() {
  await db.execute(sql`ALTER TABLE reconciliations ADD COLUMN till_variances jsonb;`);
  console.log("Done");
}
run();
