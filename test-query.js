import { db } from './src/db/index.js';
import * as schema from './src/db/schema.js';
async function test() {
  try {
    const users = await db.select().from(schema.users);
    console.log("Users:", users.length);
  } catch (err) {
    console.error("DB error:", err);
  }
}
test();
