import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

async function main() {
  const ref = 'mdubljdeimlpntyzektn';
  const pass = '1202%21birthDATE';

  const regions = [
    'aws-0-eu-central-1',
    'aws-0-eu-west-1',
    'aws-0-eu-west-2',
    'aws-0-eu-west-3',
    'aws-0-us-east-1',
    'aws-0-us-west-1',
    'aws-0-ap-southeast-1',
    'aws-0-af-south-1',
  ];

  const candidateUrls = [
    `postgresql://postgres:${pass}@db.${ref}.supabase.co:5432/postgres`,
    `postgresql://postgres:${pass}@db.${ref}.supabase.co:6543/postgres`,
  ];

  for (const r of regions) {
    candidateUrls.push(
      `postgresql://postgres.${ref}:${pass}@${r}.pooler.supabase.com:6543/postgres?pgbouncer=true`,
      `postgresql://postgres.${ref}:${pass}@${r}.pooler.supabase.com:5432/postgres`
    );
  }

  let sql = null;
  let connectedUrl = '';

  for (const conn of candidateUrls) {
    try {
      const host = conn.split('@')[1];
      process.stdout.write(`Testing ${host.substring(0, 50)} ... `);
      const client = postgres(conn, { ssl: 'require', connect_timeout: 5 });
      await client`SELECT 1`;
      console.log('✅ SUCCESS!');
      sql = client;
      connectedUrl = conn;
      break;
    } catch (err) {
      console.log(`❌ (${err.message.substring(0, 60)})`);
    }
  }

  if (!sql) {
    console.error('Could not connect to any Supabase Postgres pooler endpoint.');
    process.exit(1);
  }

  const sqlFilePath = path.join(process.cwd(), 'supabase/migrations/00007_artist_marketplace_schema.sql');
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

  console.log(`\n📦 Applying Migration 00007 to ${connectedUrl.split('@')[1]}...`);
  await sql.unsafe(sqlContent);
  console.log('🎉 ALL MARKETPLACE TABLES, GENRES, AND RLS POLICIES APPLIED SUCCESSFULLY!');

  await sql.end();
}

main();
