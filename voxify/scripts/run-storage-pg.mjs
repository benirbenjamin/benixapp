import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';

const projRef = 'mdubljdeimlpntyzektn';
const pass = '1202!birthDATE';

const poolerHosts = [
  'aws-0-eu-west-1.pooler.supabase.com',
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-0-us-east-2.pooler.supabase.com',
  'aws-0-us-west-1.pooler.supabase.com',
  'aws-0-eu-central-1.pooler.supabase.com',
  'aws-0-ap-southeast-1.pooler.supabase.com',
];

async function main() {
  console.log(`🚀 Connecting to Supabase Pooler for project ${projRef}...`);

  let activeClient = null;

  for (const host of poolerHosts) {
    for (const port of [5432, 6543]) {
      const user = `postgres.${projRef}`;
      console.log(`🔌 Testing ${host}:${port}...`);
      const client = new Client({
        host,
        port,
        user,
        password: pass,
        database: 'postgres',
        ssl: {
          rejectUnauthorized: false,
          servername: `db.${projRef}.supabase.co`,
        },
        connectionTimeoutMillis: 3000,
      });

      try {
        await client.connect();
        await client.query('SELECT 1');
        console.log(`\n✅ SUCCESS! Connected to Supabase Pooler at ${host}:${port}!`);
        activeClient = client;
        break;
      } catch (err) {
        await client.end().catch(() => {});
      }
    }
    if (activeClient) break;
  }

  if (!activeClient) {
    console.error('❌ Could not connect to Supabase pooler.');
    process.exit(1);
  }

  const client = activeClient;

  try {
    const sqlFilePath = path.join(process.cwd(), 'supabase/migrations/00003_storage_buckets.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('📦 Executing Storage Buckets & RLS Policy Migration...');
    await client.query(sqlContent);
    console.log('\n🎉 ALL STORAGE BUCKETS & RLS POLICIES UPDATED SUCCESSFULLY ON LIVE SUPABASE DB!');
  } catch (err) {
    console.error('❌ SQL Migration Error:', err);
  } finally {
    await client.end();
  }
}

main();
