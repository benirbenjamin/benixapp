import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, '.env.local') });
dotenv.config({ path: path.join(rootDir, '.env') });

const projRef = process.env.SUPABASE_PROJECT_REF || 'mdubljdeimlpntyzektn';
const pass = process.env.SUPABASE_DB_PASSWORD || 'VoxifySpace2026!';

// Supabase Pooler options testing with project=mdubljdeimlpntyzektn
const poolerHosts = [
  'aws-0-eu-west-1.pooler.supabase.com',
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-0-us-west-1.pooler.supabase.com',
  'aws-0-eu-central-1.pooler.supabase.com',
  'aws-0-ap-southeast-1.pooler.supabase.com',
];

async function runTenantSetup() {
  console.log(`🚀 Connecting to Supabase Pooler for project ${projRef}...`);

  let activeClient = null;

  for (const host of poolerHosts) {
    for (const port of [5432, 6543]) {
      for (const user of ['postgres', `postgres.${projRef}`]) {
        console.log(`🔌 Trying ${host}:${port} (user: ${user})...`);
        const client = new Client({
          host,
          port,
          user,
          password: pass,
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
          await client.query('SELECT 1');
          console.log(`\n✅ SUCCESS! Connected to Supabase via ${host}:${port} (${user})`);
          activeClient = client;
          break;
        } catch (err) {
          console.log(`  ❌ Failed: ${err.message}`);
          await client.end().catch(() => {});
        }
      }
      if (activeClient) break;
    }
    if (activeClient) break;
  }

  if (!activeClient) {
    console.error('\n❌ Could not connect via Supabase Pooler.');
    process.exit(1);
  }

  const client = activeClient;

  try {
    const migrationFiles = [
      'supabase/migrations/00001_initial_schema.sql',
      'supabase/migrations/00002_rls_policies.sql',
      'supabase/migrations/00003_storage_buckets.sql',
      'supabase/migrations/00004_announcement_comments_reactions.sql',
      'supabase/seed.sql'
    ];

    for (const fileRelPath of migrationFiles) {
      const fullPath = path.join(rootDir, fileRelPath);
      console.log(`\n📦 Running Migration: ${fileRelPath}...`);
      const sqlContent = fs.readFileSync(fullPath, 'utf8');
      await client.query(sqlContent);
      console.log(`✅ Successfully executed: ${fileRelPath}`);
    }

    console.log('\n🎉 ALL TABLES, RLS POLICIES, STORAGE BUCKETS AND SAAS PLANS CREATED SUCCESSFULLY IN YOUR SUPABASE PROJECT!');

  } catch (err) {
    console.error('\n❌ Error executing SQL migrations:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runTenantSetup();
