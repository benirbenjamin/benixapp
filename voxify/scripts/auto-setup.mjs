import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!serviceRoleKey) {
  console.error('❌ Service Role Key missing!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runAutoSetup() {
  console.log('🚀 Running Administrative Supabase Setup for project mdubljdeimlpntyzektn...');

  // 1. Create Storage Buckets
  const buckets = [
    { name: 'profile-images', public: true },
    { name: 'choir-logos', public: true },
    { name: 'song-audio', public: false },
    { name: 'song-parts', public: false },
    { name: 'song-documents', public: false },
    { name: 'announcement-attachments', public: false },
  ];

  console.log('\n📦 Creating Storage Buckets...');
  for (const b of buckets) {
    const { data, error } = await supabase.storage.createBucket(b.name, { public: b.public });
    if (error) {
      console.log(`  - Bucket '${b.name}': ${error.message}`);
    } else {
      console.log(`  - Bucket '${b.name}': ✅ Created successfully!`);
    }
  }

  // 2. Test SQL execution via Supabase API or query
  console.log('\n⚡ Testing Supabase API SQL Query Endpoint...');
  const migrationFiles = [
    'supabase/migrations/00001_initial_schema.sql',
    'supabase/migrations/00002_rls_policies.sql',
    'supabase/migrations/00003_storage_buckets.sql',
    'supabase/seed.sql'
  ];

  for (const fileRelPath of migrationFiles) {
    const fullPath = path.join(rootDir, fileRelPath);
    console.log(`\n📦 Processing: ${fileRelPath}...`);
    const sqlContent = fs.readFileSync(fullPath, 'utf8');

    // Send SQL query via REST endpoint if query API is accessible
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        },
        body: JSON.stringify({ query: sqlContent })
      });
      console.log(`  - Exec response status: ${res.status}`);
    } catch (e) {
      console.log(`  - RPC exec notice: ${e.message}`);
    }
  }

  console.log('\n🎉 Administrative setup script execution complete!');
}

runAutoSetup();
