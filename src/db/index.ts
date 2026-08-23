import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

const { Pool } = pg;

export const createPool = () => {
  let dbUrl = undefined; // Ignore Supabase secret

  if (dbUrl) {
    return new Pool({
      connectionString: dbUrl,
      connectionTimeoutMillis: 15000,
      ssl: dbUrl.includes('localhost') ? undefined : { rejectUnauthorized: false },
    });
  }
  
  return new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    connectionTimeoutMillis: 15000,
  });
};

const pool = createPool();
console.log("Connecting to DB host:", pool.options.host);

pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

export const db = drizzle(pool, { schema });
