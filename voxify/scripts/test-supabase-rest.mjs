import { createClient } from '@supabase/supabase-js';

const url = 'https://mdubljdeimlpntyzektn.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kdWJsamRlaW1scG50eXpla3RuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODE4NDQ4MiwiZXhwIjoyMTAzNzYwNDgyfQ.WkWRGlpRspoSkkZPWgPVDkWiPMhqvAY5xeeMkbxb49c';

const supabase = createClient(url, key);

async function main() {
  console.log('Testing Supabase REST API connection...');
  
  // Test profiles table query
  const { data: profiles, error: profErr } = await supabase.from('profiles').select('id, full_name, user_type').limit(3);
  console.log('Profiles table result:', { count: profiles?.length, profErr });

  // Test artist_profiles query
  const { data: artists, error: artErr } = await supabase.from('artist_profiles').select('*').limit(3);
  console.log('Artist profiles table result:', { count: artists?.length, artErr });

  // Test marketplace_settings query
  const { data: settings, error: setErr } = await supabase.from('marketplace_settings').select('*').limit(1);
  console.log('Marketplace settings table result:', { settings, setErr });
}

main();
