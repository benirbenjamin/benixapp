import postgres from 'postgres';

const ref = 'mdubljdeimlpntyzektn';
const pass = '1202%21birthDATE';

const regions = [
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-south-1',
  'sa-east-1',
  'ca-central-1',
  'me-central-1',
];

async function test() {
  for (const r of regions) {
    const host = `aws-0-${r}.pooler.supabase.com`;
    const connStr = `postgresql://postgres.${ref}:${pass}@${host}:6543/postgres`;
    try {
      const client = postgres(connStr, { ssl: 'require', connect_timeout: 4 });
      await client`SELECT 1`;
      console.log(`✅✅ MATCH FOUND! Region: ${r} (${host})`);
      await client.end();
      return host;
    } catch (err) {
      console.log(`Region ${r}: ${err.message}`);
    }
  }
}

test();
