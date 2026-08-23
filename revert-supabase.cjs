const fs = require('fs');

let index = fs.readFileSync('src/db/index.ts', 'utf8');
index = index.replace(
  `let dbUrl = undefined; // Ignore Supabase secret`,
  `let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl === 'undefined') {
    dbUrl = 'postgresql://postgres.kzhdpuvbitlhdzfnzrxf:vIsionSibanda18%24@aws-0-eu-west-1.pooler.supabase.com:6543/postgres';
  } else if (dbUrl && dbUrl.includes('db.kzhdpuvbitlhdzfnzrxf.supabase.co') && dbUrl.includes('[vIsionSibanda18$]')) {
    dbUrl = 'postgresql://postgres.kzhdpuvbitlhdzfnzrxf:vIsionSibanda18%24@aws-0-eu-west-1.pooler.supabase.com:6543/postgres';
  }`
);
fs.writeFileSync('src/db/index.ts', index);

let config = fs.readFileSync('src/db/drizzle.config.ts', 'utf8');
config = config.replace(
  `let dbUrl = undefined; // Force undefined to ignore Supabase secret`,
  `let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl === 'undefined') {
    dbUrl = 'postgresql://postgres.kzhdpuvbitlhdzfnzrxf:vIsionSibanda18%24@aws-0-eu-west-1.pooler.supabase.com:6543/postgres';
  } else if (dbUrl && dbUrl.includes('db.kzhdpuvbitlhdzfnzrxf.supabase.co') && dbUrl.includes('[vIsionSibanda18$]')) {
    dbUrl = 'postgresql://postgres.kzhdpuvbitlhdzfnzrxf:vIsionSibanda18%24@aws-0-eu-west-1.pooler.supabase.com:6543/postgres';
  }`
);
fs.writeFileSync('src/db/drizzle.config.ts', config);
