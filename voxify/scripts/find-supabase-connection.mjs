import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

async function main() {
  const ref = 'mdubljdeimlpntyzektn';
  const pass = '1202%21birthDATE';

  const poolerHosts = [
    'aws-0-eu-central-1.pooler.supabase.com',
    'aws-0-eu-west-1.pooler.supabase.com',
    'aws-0-eu-west-2.pooler.supabase.com',
    'aws-0-eu-west-3.pooler.supabase.com',
    'aws-0-us-east-1.pooler.supabase.com',
    'aws-0-us-east-2.pooler.supabase.com',
    'aws-0-us-west-1.pooler.supabase.com',
    'aws-0-us-west-2.pooler.supabase.com',
    'aws-0-ap-southeast-1.pooler.supabase.com',
    'aws-0-ap-southeast-2.pooler.supabase.com',
    'aws-0-ap-south-1.pooler.supabase.com',
    'aws-0-sa-east-1.pooler.supabase.com',
    'aws-0-ca-central-1.pooler.supabase.com',
  ];

  const candidateUsers = [
    `postgres.${ref}`,
    `postgres`,
    `service_role.${ref}`,
    `service_role`,
  ];

  const sqlFilePath = path.join(process.cwd(), 'supabase/migrations/00007_artist_marketplace_schema.sql');
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

  let activeClient = null;

  for (const host of poolerHosts) {
    for (const user of candidateUsers) {
      for (const port of [5432, 6543]) {
        const connStr = `postgresql://${user}:${pass}@${host}:${port}/postgres`;
        try {
          const client = postgres(connStr, { ssl: 'require', connect_timeout: 4 });
          await client`SELECT 1`;
          console.log(`\n🎉 CONNECTED SUCCESSFULLY to ${host}:${port} as ${user}!`);
          activeClient = client;
          break;
        } catch (err) {
          if (!err.message.includes('ENOTFOUND') && !err.message.includes('tenant/user')) {
            console.log(`Attempt ${host}:${port} user=${user} -> ${err.message}`);
          }
        }
      }
      if (activeClient) break;
    }
    if (activeClient) break;
  }

  if (!activeClient) {
    console.error('\n❌ Could not find an active pooler route.');
    process.exit(1);
  }

  console.log('📦 Executing Migration 00007 (Artist & Marketplace Schema)...');
  await activeClient.unsafe(sqlContent);
  console.log('✅ MIGRATION 00007 EXECUTED SUCCESSFULLY ON SUPABASE DB!');
  await activeClient.end();
}

main();
