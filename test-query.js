import { db } from './src/db/index.js';
import * as schema from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function test() {
  try {
    const users = await db.select().from(schema.users).where(eq(schema.users.email, 'a@gmail.com'));
    console.log("Users:", users);
  } catch(e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
test();
