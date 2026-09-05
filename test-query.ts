import { db } from './src/db/index.js';
import * as schema from './src/db/schema.js';

async function test() {
  try {
    const users = await db.select().from(schema.users).limit(1);
    console.log("Users:", users);
  } catch(e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
test();
