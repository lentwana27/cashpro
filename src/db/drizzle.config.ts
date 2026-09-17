import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

const sqlHost = process.env.SQL_HOST;
const sqlDbName = process.env.SQL_DB_NAME;
const user = process.env.SQL_ADMIN_USER;
const password = process.env.SQL_ADMIN_PASSWORD;

let dbUrl = process.env.DATABASE_URL;
if (!dbUrl || dbUrl === 'undefined') {
  dbUrl = undefined;
}

if (!dbUrl && (!sqlHost || !sqlDbName || !user || !password)) {
  throw new Error("Missing database connection variables");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: dbUrl ? {
    url: dbUrl,
  } : {
    host: sqlHost as string,
    user: user as string,
    password: password as string,
    database: sqlDbName as string,
  },
  verbose: true,
});
