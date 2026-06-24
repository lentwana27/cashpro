import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
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
