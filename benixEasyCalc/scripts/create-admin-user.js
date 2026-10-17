/**
 * BENIX SPACE EASY CALC - Admin Account Provisioning Script
 * Creates or updates the administrator user in Supabase Auth & public.admin_roles
 */
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nfiocyypxoyfuzpfntja.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_wD2ONoNkZvWfEIIiX_ifbQ_0IgGsVgp';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@benix.space';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'BenixAdmin2026!Secure';

async function setupAdmin() {
  console.log('Connecting to Supabase PostgreSQL pooler...');
  const pgClient = new Client({
    host: 'aws-0-eu-central-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.nfiocyypxoyfuzpfntja',
    password: '1202!birthDATE',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  await pgClient.connect();

  // Check if admin user already exists
  const existingUserRes = await pgClient.query(`SELECT id FROM auth.users WHERE email = $1;`, [ADMIN_EMAIL]);

  let userId;
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  if (existingUserRes.rows.length === 0) {
    console.log(`Creating admin user ${ADMIN_EMAIL} via Supabase Auth...`);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      options: {
        data: {
          name: 'Benix Admin',
          role: 'admin'
        }
      }
    });

    if (signUpError) {
      console.error('SignUp Error:', signUpError);
      await pgClient.end();
      process.exit(1);
    }
    userId = signUpData.user.id;
    console.log(`Admin user created with ID: ${userId}`);
  } else {
    userId = existingUserRes.rows[0].id;
    console.log(`Admin user already exists with ID: ${userId}. Updating password...`);
    await supabase.auth.admin?.updateUserById?.(userId, { password: ADMIN_PASSWORD }).catch(() => {});
  }

  // Ensure email confirmation and tokens are clean
  await pgClient.query(`
    UPDATE auth.users
    SET
      email_confirmed_at = now(),
      confirmation_token = '',
      recovery_token = COALESCE(recovery_token, ''),
      email_change_token_new = COALESCE(email_change_token_new, ''),
      email_change = COALESCE(email_change, ''),
      phone_change = COALESCE(phone_change, ''),
      phone_change_token = COALESCE(phone_change_token, ''),
      reauthentication_token = COALESCE(reauthentication_token, ''),
      email_change_token_current = COALESCE(email_change_token_current, '')
    WHERE id = $1;
  `, [userId]);

  // Ensure verified in auth.identities
  await pgClient.query(`
    UPDATE auth.identities
    SET identity_data = identity_data || '{"email_verified":true}'::jsonb
    WHERE user_id = $1;
  `, [userId]);

  // Grant role in public.admin_roles
  await pgClient.query(`
    INSERT INTO public.admin_roles (user_id, role)
    VALUES ($1, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
  `, [userId]);
  console.log('Promoted user in public.admin_roles.');

  await pgClient.end();

  // Test live login
  console.log('Verifying login credentials...');
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });

  if (loginError) {
    console.error('[x] Verification FAILED:', loginError);
    process.exit(1);
  }

  console.log('================================================================');
  console.log('🎉 SUCCESS: Admin account verified!');
  console.log(`Email:       ${loginData.user.email}`);
  console.log(`User ID:     ${loginData.user.id}`);
  console.log(`Role:        admin`);
  console.log('================================================================');
}

setupAdmin().catch(console.error);
