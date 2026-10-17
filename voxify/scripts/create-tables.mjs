import pkg from 'pg';
const { Client } = pkg;

const poolerHosts = [
  'aws-0-eu-west-1.pooler.supabase.com',
  'aws-0-eu-central-1.pooler.supabase.com',
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-0-us-west-1.pooler.supabase.com',
  'aws-0-ap-southeast-1.pooler.supabase.com',
  'aws-0-sa-east-1.pooler.supabase.com',
  'aws-0-ca-central-1.pooler.supabase.com'
];

const passwords = ['1202!birthDATE', 'VoxifySpace2026!'];
const projRef = 'mdubljdeimlpntyzektn';

const sqlQueries = `
CREATE TABLE IF NOT EXISTS public.announcement_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES public.announcement_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_announcement ON public.announcement_comments(announcement_id);

CREATE TABLE IF NOT EXISTS public.announcement_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL DEFAULT 'love',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(announcement_id, user_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_reactions_announcement ON public.announcement_reactions(announcement_id);

ALTER TABLE public.announcement_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reactions DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.announcement_comments TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.announcement_reactions TO anon, authenticated, service_role;
`;

async function main() {
  console.log('Testing Supabase direct connections...');
  let connected = false;

  for (const password of passwords) {
    for (const host of poolerHosts) {
      for (const port of [6543, 5432]) {
        for (const user of [`postgres.${projRef}`, 'postgres']) {
          console.log(`Trying ${host}:${port} (${user})...`);
          const client = new Client({
            host,
            port,
            user,
            password,
            database: 'postgres',
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 3000,
          });

          try {
            await client.connect();
            console.log(`\n✅ CONNECTED TO SUPABASE via ${host}:${port}!`);
            await client.query(sqlQueries);
            console.log('✅ TABLES announcement_comments & announcement_reactions CREATED SUCCESSFULLY!');
            await client.end();
            connected = true;
            break;
          } catch (err) {
            console.log(`  Failed: ${err.message}`);
            await client.end().catch(() => {});
          }
        }
        if (connected) break;
      }
      if (connected) break;
    }
    if (connected) break;
  }

  if (!connected) {
    console.error('Could not connect directly via IPv4 pooler hosts.');
  }
}

main();
