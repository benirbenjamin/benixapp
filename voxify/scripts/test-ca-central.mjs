import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

async function main() {
  const ref = 'mdubljdeimlpntyzektn';
  const pass = '1202%21birthDATE';

  const candidates = [
    `postgresql://postgres.${ref}:${pass}@aws-0-ca-central-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.${ref}:${pass}@aws-0-ca-central-1.pooler.supabase.com:5432/postgres`,
  ];

  let sql = null;
  for (const conn of candidates) {
    try {
      console.log(`Connecting to ${conn.split('@')[1]}...`);
      const client = postgres(conn, { ssl: 'require', connect_timeout: 15, prepare: false });
      await client`SELECT 1`;
      console.log(`🎉 CONNECTED SUCCESSFULLY to ${conn.split('@')[1]}!`);
      sql = client;
      break;
    } catch (err) {
      console.log(`  ❌ Failed: ${err.message}`);
    }
  }

  if (!sql) {
    console.error('Connection failed.');
    process.exit(1);
  }

  const sqlFilePath = path.join(process.cwd(), 'supabase/migrations/00007_artist_marketplace_schema.sql');
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

  console.log('📦 Executing Migration 00007 (Artist & Marketplace Schema)...');
  await sql.unsafe(sqlContent);
  console.log('🎉 ALL MARKETPLACE TABLES AND RLS POLICIES APPLIED SUCCESSFULLY!');
  await sql.end();
}

main();
