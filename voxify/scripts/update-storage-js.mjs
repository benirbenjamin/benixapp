import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function main() {
  console.log('🚀 Updating Supabase Storage buckets via Service Role Client...');

  const buckets = ['song-audio', 'song-parts', 'song-documents', 'announcement-attachments', 'profile-images', 'choir-logos'];

  for (const b of buckets) {
    console.log(`Checking bucket '${b}'...`);
    const { data, error } = await supabase.storage.updateBucket(b, { public: true });
    if (error) {
      console.log(`  Updating '${b}' returned: ${error.message}. Attempting createBucket...`);
      const { error: createErr } = await supabase.storage.createBucket(b, { public: true });
      if (createErr) {
        console.log(`  ❌ Failed creating '${b}': ${createErr.message}`);
      } else {
        console.log(`  ✅ Created bucket '${b}' with public = true!`);
      }
    } else {
      console.log(`  ✅ Successfully set bucket '${b}' to public = true!`);
    }
  }

  console.log('🎉 Storage bucket public permissions updated successfully!');
}

main();
