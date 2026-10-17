import { createClient } from '@supabase/supabase-js';

const url = 'https://mdubljdeimlpntyzektn.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kdWJsamRlaW1scG50eXpla3RuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODE4NDQ4MiwiZXhwIjoyMTAzNzYwNDgyfQ.WkWRGlpRspoSkkZPWgPVDkWiPMhqvAY5xeeMkbxb49c';

const supabase = createClient(url, key);

async function main() {
  console.log('Testing RPC exec_sql...');
  
  const testSql = `
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'regular';
  `;

  try {
    const res = await supabase.rpc('exec_sql', { query: testSql });
    console.log('RPC result:', res);
  } catch (e) {
    console.error('RPC thrown error:', e.message);
  }
}

main();
