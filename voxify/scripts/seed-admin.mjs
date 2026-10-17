import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

if (fs.existsSync(path.join(rootDir, '.env.local'))) {
  dotenv.config({ path: path.join(rootDir, '.env.local') });
}
if (fs.existsSync(path.join(rootDir, '.env'))) {
  dotenv.config({ path: path.join(rootDir, '.env') });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mdubljdeimlpntyzektn.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env / .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedAdminUsers() {
  console.log('🚀 Seeding Default Super Admin and Choir Director Accounts in Supabase Auth...');

  // 1. Super Admin Account
  const adminEmail = 'admin@voxify.space';
  const adminPassword = 'AdminPassword123!';

  const { data: adminAuth, error: adminErr } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: {
      full_name: 'Platform Super Admin',
      is_super_admin: true
    }
  });

  if (adminErr) {
    console.log(`Notice (Admin): ${adminErr.message}`);
  } else if (adminAuth?.user) {
    console.log(`✅ Super Admin created: ${adminEmail}`);
    await supabase.from('profiles').update({ is_super_admin: true }).eq('id', adminAuth.user.id);
  }

  // 2. Choir Director Account
  const directorEmail = 'director@voxify.space';
  const directorPassword = 'DirectorPassword123!';

  const { data: directorAuth, error: directorErr } = await supabase.auth.admin.createUser({
    email: directorEmail,
    password: directorPassword,
    email_confirm: true,
    user_metadata: {
      full_name: 'Choir Director',
      is_super_admin: false
    }
  });

  if (directorErr) {
    console.log(`Notice (Director): ${directorErr.message}`);
  } else if (directorAuth?.user) {
    console.log(`✅ Choir Director created: ${directorEmail}`);
  }

  console.log('\n🎉 Default admin accounts seed finished!');
}

seedAdminUsers();
