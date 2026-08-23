require('dotenv').config();
const { Client } = require('pg');
async function test() {
  const client = new Client({
    host: process.env.SQL_HOST,
    user: process.env.SQL_ADMIN_USER,
    password: process.env.SQL_ADMIN_PASSWORD,
    database: process.env.SQL_DB_NAME,
  });
  await client.connect();
  await client.query("UPDATE users SET active = true WHERE email = 'test@cashuppro.com'");
  await client.end();
}
test();
