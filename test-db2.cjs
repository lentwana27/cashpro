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
test('postgresql://postgres:[vIsionSibanda18$]@db.kzhdpuvbitlhdzfnzrxf.supabase.co:5432/postgres');
