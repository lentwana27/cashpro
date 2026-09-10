import { db } from './src/db/index.js';
import * as schema from './src/db/schema.js';

async function checkDB() {
  const users = await db.select().from(schema.users);
  console.log("Users:", users);
  process.exit(0);
}

checkDB().catch(console.error);
