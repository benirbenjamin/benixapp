import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

async function main() {
  const ref = 'mdubljdeimlpntyzektn';
  const pass = '1202%21birthDATE';

  const sqlFilePath = path.join(process.cwd(), 'supabase/migrations/00007_artist_marketplace_schema.sql');
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

  // Supabase pooler test configurations
  const configs = [
    // Direct IP or hostname with SNI
    `postgresql://postgres.${ref}:${pass}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?options=project%3D${ref}`,
    `postgresql://postgres.${ref}:${pass}@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?options=project%3D${ref}`,
    `postgresql://postgres.${ref}:${pass}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?options=project%3D${ref}`,
    `postgresql://postgres.${ref}:${pass}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?options=project%3D${ref}`,
    `postgresql://postgres.${ref}:${pass}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?options=project%3D${ref}`,
    `postgresql://postgres.${ref}:${pass}@aws-0-us-east-1.pooler.supabase.com:5432/postgres?options=project%3D${ref}`,
    // Supabase Direct IPv4 / Pooler variations
    `postgresql://postgres:${pass}@db.${ref}.supabase.co:5432/postgres?sslmode=require`,
    `postgresql://postgres:${pass}@db.${ref}.supabase.co:6543/postgres?sslmode=require`,
    `postgresql://postgres.${ref}:${pass}@db.${ref}.supabase.co:5432/postgres`,
    `postgresql://postgres.${ref}:${pass}@db.${ref}.supabase.co:6543/postgres`,
  ];

  let sql = null;
  for (const conn of configs) {
    try {
      console.log(`Connecting to ${conn.split('@')[1]} ...`);
      const client = postgres(conn, {
        ssl: 'require',
        connect_timeout: 5,
        prepare: false, // Disables prepared statements for PgBouncer / Supavisor pooler
      });
      await client`SELECT 1`;
      console.log(`🎉 SUCCESSful connection to ${conn.split('@')[1]}!`);
      sql = client;
      break;
    } catch (err) {
      console.log(`  ❌ Failed: ${err.message}`);
    }
  }

  if (!sql) {
    console.error('All connection attempts failed.');
    process.exit(1);
  }

  console.log('📦 Executing Migration 00007 (Artist & Marketplace Schema)...');
  await sql.unsafe(sqlContent);
  console.log('🎉 ALL MARKETPLACE TABLES AND RLS POLICIES CREATED SUCCESSFULLY!');
  await sql.end();
}

main();
