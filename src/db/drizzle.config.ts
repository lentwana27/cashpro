import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

let dbUrl = process.env.DATABASE_URL;
if (dbUrl && dbUrl.includes('db.kzhdpuvbitlhdzfnzrxf.supabase.co') && dbUrl.includes('[vIsionSibanda18$]')) {
  dbUrl = 'postgresql://postgres.kzhdpuvbitlhdzfnzrxf:vIsionSibanda18%24@aws-0-eu-west-1.pooler.supabase.com:6543/postgres';
}
const sqlHost = process.env.SQL_HOST;
const sqlDbName = process.env.SQL_DB_NAME;
const user = process.env.SQL_ADMIN_USER;
const password = process.env.SQL_ADMIN_PASSWORD;

if (!dbUrl && (!sqlHost || !sqlDbName || !user || !password)) {
  throw new Error("Missing database connection variables");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: dbUrl ? {
    url: dbUrl,
  } : {
    host: sqlHost as string,
    user: user as string,
    password: password as string,
    database: sqlDbName as string,
    ssl: false,
  },
  verbose: true,
});
