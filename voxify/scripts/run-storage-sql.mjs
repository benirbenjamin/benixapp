import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('🚀 Connecting to Supabase Database via Pooler...');

  const connectionStrings = [
    'postgresql://postgres:1202%21birthDATE@aws-0-eu-west-1.pooler.supabase.com:5432/postgres',
    'postgresql://postgres:1202%21birthDATE@aws-0-eu-central-1.pooler.supabase.com:5432/postgres',
    'postgresql://postgres:1202%21birthDATE@aws-0-us-east-1.pooler.supabase.com:5432/postgres',
    'postgresql://postgres:1202%21birthDATE@aws-0-us-east-2.pooler.supabase.com:5432/postgres',
  ];

  let sql = null;
  for (const conn of connectionStrings) {
    try {
      console.log(`Testing ${conn.split('@')[1]}...`);
      const client = postgres(conn, { ssl: 'require', connect_timeout: 4 });
      await client`SELECT 1`;
      console.log(`✅ CONNECTED SUCCESSFULLY!`);
      sql = client;
      break;
    } catch (err) {
      console.log(`  ❌ Connection failed: ${err.message}`);
    }
  }

  if (!sql) {
    console.error('Could not connect to database pooler.');
    process.exit(1);
  }

  const sqlFilePath = path.join(process.cwd(), 'supabase/migrations/00003_storage_buckets.sql');
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

  console.log('📦 Applying Storage Buckets & RLS Policy Fixes...');
  await sql.unsafe(sqlContent);
  console.log('🎉 ALL STORAGE BUCKETS & RLS POLICIES UPDATED SUCCESSFULLY!');

  await sql.end();
}

main();
