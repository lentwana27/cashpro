import { db } from './src/db/index.js';
import * as schema from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function update() {
  try {
    await db.update(schema.exchangeRates).set({ currencyCode: 'ZiG' }).where(eq(schema.exchangeRates.currencyCode, 'ZMW'));
    console.log('Database updated successfully: ZMW -> ZiG');
  } catch (err) {
    console.error('Error updating DB:', err);
  }
  process.exit(0);
}
update();
