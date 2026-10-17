import dns from 'dns';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

// Set DNS resolution to verbatim (allows IPv6 AAAA records on dual-stack/IPv6 networks)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('verbatim');
}

async function main() {
  console.log('Resolving db.mdubljdeimlpntyzektn.supabase.co DNS...');
  
  try {
    const addresses = await dns.promises.lookup('db.mdubljdeimlpntyzektn.supabase.co', { all: true });
    console.log('DNS Lookup results:', addresses);
  } catch (err) {
    console.error('DNS Lookup error:', err.message);
  }

  const pass = '1202%21birthDATE';
  const dbUrl = `postgresql://postgres:${pass}@db.mdubljdeimlpntyzektn.supabase.co:5432/postgres`;

  console.log('Connecting to db.mdubljdeimlpntyzektn.supabase.co:5432...');

  try {
    const sql = postgres(dbUrl, { ssl: 'require', connect_timeout: 10 });
    await sql`SELECT 1`;
    console.log('🎉 DIRECT POSTGRES CONNECTED SUCCESSFULLY!');

    const sqlFilePath = path.join(process.cwd(), 'supabase/migrations/00007_artist_marketplace_schema.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('📦 Applying Migration 00007 (Artist Ecosystem & Marketplace Schema)...');
    await sql.unsafe(sqlContent);
    console.log('🎉 ALL MARKETPLACE TABLES AND RLS POLICIES CREATED SUCCESSFULLY!');

    await sql.end();
  } catch (err) {
    console.error('Postgres connection failed:', err.message);
  }
}

main();
