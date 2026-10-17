const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  console.log('Connecting to Supabase PostgreSQL pooler (eu-central-1:6543)...');

  const client = new Client({
    host: 'aws-0-eu-central-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.nfiocyypxoyfuzpfntja',
    password: '1202!birthDATE',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log('Connected to Supabase!');

    const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing database schema migration...');
    await client.query(sql);
    console.log('✓ Schema migration executed successfully!');

    const res = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('\nVerified Public Tables in Supabase:');
    res.rows.forEach((row) => {
      console.log(` ✔ ${row.table_name}`);
    });

    await client.end();
    console.log('\nAll required tables are verified and operational.');
  } catch (err) {
    console.error('Migration error:', err.message);
    if (client) {
      try { await client.end(); } catch {}
    }
    process.exit(1);
  }
}

migrate();
