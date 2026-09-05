import { db } from './src/db/index.js';
import * as schema from './src/db/schema.js';

async function test() {
  try {
    const users = await db.select().from(schema.users);
    console.log("Users:", users.map(u => ({ email: u.email, role: u.role })));
  } catch(e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
test();
