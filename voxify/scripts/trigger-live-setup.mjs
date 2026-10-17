import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

async function main() {
  const ref = 'mdubljdeimlpntyzektn';
  const pass = '1202%21birthDATE';

  const poolerHosts = [
    'aws-0-eu-central-1.pooler.supabase.com',
    'aws-0-eu-west-1.pooler.supabase.com',
    'aws-0-eu-west-2.pooler.supabase.com',
    'aws-0-eu-west-3.pooler.supabase.com',
    'aws-0-us-east-1.pooler.supabase.com',
    'aws-0-us-east-2.pooler.supabase.com',
    'aws-0-us-west-1.pooler.supabase.com',
    'aws-0-us-west-2.pooler.supabase.com',
    'aws-0-ap-southeast-1.pooler.supabase.com',
    'aws-0-ca-central-1.pooler.supabase.com',
    'aws-0-sa-east-1.pooler.supabase.com',
  ];

  const sqlFilePath = path.join(process.cwd(), 'supabase/migrations/00007_artist_marketplace_schema.sql');
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

  let activeClient = null;

  for (const host of poolerHosts) {
    for (const port of [6543, 5432]) {
      const connStr = `postgresql://postgres.${ref}:${pass}@${host}:${port}/postgres`;
      try {
        console.log(`Connecting to ${host}:${port} ...`);
        const client = postgres(connStr, { ssl: 'require', connect_timeout: 12, prepare: false });
        await client`SELECT 1`;
        console.log(`🎉 CONNECTED SUCCESSFULLY to ${host}:${port}!`);
        activeClient = client;
        break;
      } catch (err) {
        console.log(`  ❌ Failed: ${err.message}`);
      }
    }
    if (activeClient) break;
  }

  if (!activeClient) {
    console.error('All pooler hosts failed.');
    process.exit(1);
  }

  console.log('📦 Executing Migration 00007 (Artist & Marketplace Schema)...');
  await activeClient.unsafe(sqlContent);
  console.log('🎉 ALL MARKETPLACE TABLES AND RLS POLICIES APPLIED SUCCESSFULLY!');
  await activeClient.end();
}

main();
