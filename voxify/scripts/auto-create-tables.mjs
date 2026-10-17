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

const projRef = process.env.SUPABASE_PROJECT_REF || '';
const pass = process.env.SUPABASE_DB_PASSWORD || '';

const poolerHosts = [
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-0-us-east-2.pooler.supabase.com',
  'aws-0-us-west-1.pooler.supabase.com',
  'aws-0-us-west-2.pooler.supabase.com',
  'aws-0-eu-central-1.pooler.supabase.com',
  'aws-0-eu-west-1.pooler.supabase.com',
  'aws-0-eu-west-2.pooler.supabase.com',
  'aws-0-eu-west-3.pooler.supabase.com',
  'aws-0-eu-north-1.pooler.supabase.com',
  'aws-0-ap-southeast-1.pooler.supabase.com',
  'aws-0-ap-southeast-2.pooler.supabase.com',
  'aws-0-ap-northeast-1.pooler.supabase.com',
  'aws-0-ap-northeast-2.pooler.supabase.com',
  'aws-0-ap-south-1.pooler.supabase.com',
  'aws-0-sa-east-1.pooler.supabase.com',
  'aws-0-ca-central-1.pooler.supabase.com',
  'aws-0-af-south-1.pooler.supabase.com',
];

async function createTablesAuto() {
  console.log('🚀 Sweeping Supabase Poolers for project mdubljdeimlpntyzektn...');

  let activeClient = null;

  for (const host of poolerHosts) {
    const user = `postgres.${projRef}`;
    console.log(`🔌 Testing Pooler: ${host}...`);

    const client = new Client({
      host,
      port: 6543,
      user,
      password: pass,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 2500,
    });

    try {
      await client.connect();
      await client.query('SELECT 1');
      console.log(`\n✅ FOUND ACTIVE POOLER! Connected to ${host}:6543`);
      activeClient = client;
      break;
    } catch (err) {
      await client.end().catch(() => {});
    }
  }

  if (!activeClient) {
    console.error('\n❌ Pooler sweep did not locate active pooler region automatically.');
    console.log('Please copy your exact Pooler URI from Supabase Dashboard → Settings → Database → Connection String.');
    process.exit(1);
  }

  const client = activeClient;

  try {
    const migrationFiles = [
      'supabase/migrations/00001_initial_schema.sql',
      'supabase/migrations/00002_rls_policies.sql',
      'supabase/migrations/00003_storage_buckets.sql',
      'supabase/seed.sql'
    ];

    for (const fileRelPath of migrationFiles) {
      const fullPath = path.join(rootDir, fileRelPath);
      console.log(`\n📦 Creating Tables & Policies: ${fileRelPath}...`);
      const sqlContent = fs.readFileSync(fullPath, 'utf8');
      await client.query(sqlContent);
      console.log(`✅ Executed ${fileRelPath} successfully!`);
    }

    console.log('\n🎉 ALL 20 DATABASE TABLES, RLS POLICIES, AND SAAS PLANS CREATED SUCCESSFULLY!');

  } catch (err) {
    console.error('\n❌ Error executing SQL migrations:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createTablesAuto();
