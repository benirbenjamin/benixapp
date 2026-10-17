import postgres from 'postgres';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function runStorageFix() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL missing from environment.');
    process.exit(1);
  }

  console.log('🚀 Connecting to Supabase Postgres database...');
  const sql = postgres(dbUrl, { ssl: 'require' });

  try {
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/00003_storage_buckets.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');

    console.log('📦 Applying Storage Public Buckets & Read Policies Fix...');
    await sql.unsafe(sqlContent);
    console.log('✅ SUCCESS! Storage buckets song-audio and song-documents are now PUBLIC with full read access!');

    await sql.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    await sql.end();
    process.exit(1);
  }
}

runStorageFix();
