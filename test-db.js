import pg from 'pg';
let url = process.env.DATABASE_URL.replace('[vIsionSibanda18$]', encodeURIComponent('vIsionSibanda18$'));
const pool = new pg.Pool({ connectionString: url });
pool.query('SELECT 1').then(() => { console.log('OK without brackets'); process.exit(0); }).catch(e => { console.error('FAIL without brackets:', e); process.exit(1); });
