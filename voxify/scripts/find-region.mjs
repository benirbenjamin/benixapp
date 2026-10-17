import pkg from 'pg';
const { Client } = pkg;

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
  'ap-northeast-1',
  'ap-south-1',
  'sa-east-1',
  'ca-central-1'
];

const projRef = 'mdubljdeimlpntyzektn';
const pass = '1202!birthDATE';

async function testRegion() {
  console.log('Testing regions...');

  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    console.log(`Checking region ${region} (${host})...`);

    const client = new Client({
      host,
      port: 6543,
      user: `postgres.${projRef}`,
      password: pass,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 2000,
    });

    try {
      await client.connect();
      console.log(`\n🎉🎉 SUCCESS! Connected to Supabase Region: ${region}!`);
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
      await client.query(sqlQueries);
      console.log('✅ TABLES announcement_comments & announcement_reactions CREATED SUCCESSFULLY IN DATABASE!');
      await client.end();
      return host;
    } catch (err) {
      console.log(`  ${region} error: ${err.message}`);
      await client.end().catch(() => {});
    }
  }

  console.log('Region search complete.');
}

testRegion();
