const { Client } = require('pg');
async function test(url) {
  const client = new Client({ connectionString: url, connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
    console.log("SUCCESS for", url);
    await client.end();
  } catch (e) {
    console.log("ERROR for", url, e.message);
  }
}
test('postgresql://postgres.kzhdpuvbitlhdzfnzrxf:vIsionSibanda18%24@aws-0-eu-west-1.pooler.supabase.com:6543/postgres');
