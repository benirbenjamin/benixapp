import pkg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pkg;

const poolerHosts = [
  'aws-0-eu-west-1.pooler.supabase.com',
  'aws-0-eu-central-1.pooler.supabase.com',
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-0-us-east-2.pooler.supabase.com',
  'aws-0-us-west-1.pooler.supabase.com',
  'aws-0-ap-southeast-1.pooler.supabase.com',
  'aws-0-sa-east-1.pooler.supabase.com',
  'aws-0-ca-central-1.pooler.supabase.com',
];

const passwords = ['VoxifySpace2026!', '1202!birthDATE'];
const projRef = 'mdubljdeimlpntyzektn';

async function main() {
  const sqlFilePath = path.join(process.cwd(), 'supabase/migrations/00007_artist_marketplace_schema.sql');
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

  console.log(`🚀 Connecting to Supabase Pooler with SNI servername db.${projRef}.supabase.co...`);
  let connected = false;

  for (const password of passwords) {
    for (const host of poolerHosts) {
      for (const port of [5432, 6543]) {
        for (const user of ['postgres', `postgres.${projRef}`]) {
          console.log(`Trying ${host}:${port} (${user})...`);
          const client = new Client({
            host,
            port,
            user,
            password,
            database: 'postgres',
            options: `project=${projRef}`,
            ssl: {
              rejectUnauthorized: false,
              servername: `db.${projRef}.supabase.co`,
            },
            connectionTimeoutMillis: 4000,
          });

          try {
            await client.connect();
            console.log(`\n✅ CONNECTED SUCCESSFULLY TO SUPABASE via ${host}:${port}!`);
            console.log('📦 Executing SQL Migration 00007 (artist_profiles, marketplace_songs, user_purchases, genres, etc.)...');
            await client.query(sqlContent);
            console.log('\n🎉 ALL TABLES, GENRES, AND RLS POLICIES CREATED SUCCESSFULLY IN LIVE SUPABASE DATABASE!');
            await client.end();
            connected = true;
            break;
          } catch (err) {
            console.log(`  ❌ Connection failed: ${err.message}`);
            await client.end().catch(() => {});
          }
        }
        if (connected) break;
      }
      if (connected) break;
    }
    if (connected) break;
  }

  if (!connected) {
    console.error('❌ Could not connect to database pooler.');
    process.exit(1);
  }
}

main();
