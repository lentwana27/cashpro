import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';

async function update() {
  try {
    await db.execute(sql`ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS sales_inputted_by TEXT;`);
    await db.execute(sql`ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS sales_inputted_by_name TEXT;`);
    await db.execute(sql`ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS auditor_amendment_approval BOOLEAN DEFAULT false;`);
    await db.execute(sql`ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS accountant_amendment_approval BOOLEAN DEFAULT false;`);
    console.log('Database schema altered successfully');
  } catch (err) {
    console.error('Error updating DB:', err);
  }
  process.exit(0);
}
update();
