import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, serviceKey);

async function inspectSongs() {
  const { data: songs, error } = await supabase
    .from('marketplace_songs')
    .select('*');

  console.log('Marketplace songs count:', songs?.length, error);
  for (const s of songs || []) {
    console.log({
      id: s.id,
      title: s.title,
      purchases_count: s.purchases_count,
      audio_file_path: s.audio_file_path,
      preview_audio_path: s.preview_audio_path,
      status: s.status,
    });
  }

  const { data: purchases, error: pErr } = await supabase
    .from('user_purchases')
    .select('*');
  console.log('Purchases:', purchases, pErr);
  process.exit(0);
}

inspectSongs().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});

