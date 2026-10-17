import pkg from 'pg';
const { Client } = pkg;

const projRef = 'mdubljdeimlpntyzektn';
const pass = '1202!birthDATE';

const poolerHosts = [
  'aws-0-eu-west-1.pooler.supabase.com',
  'aws-0-eu-west-2.pooler.supabase.com',
  'aws-0-eu-west-3.pooler.supabase.com',
  'aws-0-eu-central-1.pooler.supabase.com',
  'aws-0-eu-north-1.pooler.supabase.com',
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-0-us-east-2.pooler.supabase.com',
  'aws-0-us-west-1.pooler.supabase.com',
  'aws-0-us-west-2.pooler.supabase.com',
  'aws-0-ap-southeast-1.pooler.supabase.com',
  'aws-0-ap-southeast-2.pooler.supabase.com',
  'aws-0-ap-northeast-1.pooler.supabase.com',
  'aws-0-ap-northeast-2.pooler.supabase.com',
  'aws-0-ap-south-1.pooler.supabase.com',
  'aws-0-sa-east-1.pooler.supabase.com',
  'aws-0-ca-central-1.pooler.supabase.com',
  'aws-0-af-south-1.pooler.supabase.com',
];

async function fixStorageRLS() {
  console.log('🚀 Connecting to Supabase Pooler to fix Storage RLS policies...');

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
      connectionTimeoutMillis: 3000,
    });

    try {
      await client.connect();
      await client.query('SELECT 1');
      console.log(`\n✅ CONNECTED TO POOLER at ${host}:6543!`);
      activeClient = client;
      break;
    } catch (err) {
      await client.end().catch(() => {});
    }
  }

  if (!activeClient) {
    console.error('❌ Could not connect to pooler host.');
    process.exit(1);
  }

  const client = activeClient;

  const sqlQuery = `
    -- Ensure storage buckets are public
    UPDATE storage.buckets
    SET public = true
    WHERE id IN ('song-audio', 'song-parts', 'song-documents', 'announcement-attachments', 'profile-images', 'choir-logos');

    -- Drop old restrictive storage policies
    DROP POLICY IF EXISTS "Authenticated admins upload song files" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated admins update song files" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users access song audio" ON storage.objects;
    DROP POLICY IF EXISTS "Public read song audio" ON storage.objects;
    DROP POLICY IF EXISTS "Profile images public access" ON storage.objects;
    DROP POLICY IF EXISTS "Users upload profile images" ON storage.objects;
    DROP POLICY IF EXISTS "Choir logos public access" ON storage.objects;
    DROP POLICY IF EXISTS "Admins upload choir logos" ON storage.objects;
    DROP POLICY IF EXISTS "Allow song storage insert" ON storage.objects;
    DROP POLICY IF EXISTS "Allow song storage select" ON storage.objects;
    DROP POLICY IF EXISTS "Allow song storage update" ON storage.objects;
    DROP POLICY IF EXISTS "Allow song storage delete" ON storage.objects;

    -- Create permissive storage object policies for song media & documents
    CREATE POLICY "Allow song storage insert"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id IN ('song-audio', 'song-parts', 'song-documents', 'announcement-attachments', 'profile-images', 'choir-logos'));

    CREATE POLICY "Allow song storage select"
    ON storage.objects FOR SELECT
    USING (bucket_id IN ('song-audio', 'song-parts', 'song-documents', 'announcement-attachments', 'profile-images', 'choir-logos'));

    CREATE POLICY "Allow song storage update"
    ON storage.objects FOR UPDATE
    WITH CHECK (bucket_id IN ('song-audio', 'song-parts', 'song-documents', 'announcement-attachments', 'profile-images', 'choir-logos'));

    CREATE POLICY "Allow song storage delete"
    ON storage.objects FOR DELETE
    USING (bucket_id IN ('song-audio', 'song-parts', 'song-documents', 'announcement-attachments', 'profile-images', 'choir-logos'));
  `;

  try {
    console.log('📦 Executing Storage RLS Fix SQL...');
    await client.query(sqlQuery);
    console.log('🎉 SUCCESS! Storage RLS policies updated cleanly! Storage uploads will no longer fail with RLS errors!');
  } catch (err) {
    console.error('❌ SQL Execution error:', err);
  } finally {
    await client.end();
  }
}

fixStorageRLS();
