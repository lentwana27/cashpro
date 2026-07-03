import pg from 'pg';
let url = 'postgresql://postgres.kzhdpuvbitlhdzfnzrxf:vIsionSibanda18%24@aws-0-eu-west-1.pooler.supabase.com:6543/postgres';
const pool = new pg.Pool({ connectionString: url });
pool.query('SELECT 1').then(() => { console.log('OK Pooler'); process.exit(0); }).catch(e => { console.error('FAIL Pooler:', e); process.exit(1); });
