import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema.js';

export const createPool = () => {
  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl && dbUrl !== 'undefined') {
    return mysql.createPool({
      uri: dbUrl,
      connectTimeout: 15000,
    });
  }

  if (process.env.SQL_HOST) {
    return mysql.createPool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      connectTimeout: 15000,
    });
  }

  throw new Error('No database connection configured: set DATABASE_URL or SQL_HOST/SQL_USER/SQL_PASSWORD/SQL_DB_NAME');
};

const pool = createPool();
console.log('Connecting to DB host:', process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL.replace('mysql://', 'http://')).hostname : process.env.SQL_HOST);

export const db = drizzle(pool, { schema, mode: 'default' });
