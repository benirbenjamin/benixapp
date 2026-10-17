import dotenv from 'dotenv';
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mdubljdeimlpntyzektn.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runSetup() {
  console.log('Testing Supabase REST / Management API with Service Role Key...');

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

    CREATE TABLE IF NOT EXISTS public.announcement_reactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        reaction_type TEXT NOT NULL DEFAULT 'love',
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        UNIQUE(announcement_id, user_id, reaction_type)
    );

    ALTER TABLE public.announcement_comments DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.announcement_reactions DISABLE ROW LEVEL SECURITY;

    GRANT ALL ON TABLE public.announcement_comments TO anon, authenticated, service_role;
    GRANT ALL ON TABLE public.announcement_reactions TO anon, authenticated, service_role;
  `;

  // Test SQL API endpoint
  try {
    const res = await fetch(`${url}/rest/v1/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ query: sqlQueries }),
    });

    console.log(`SQL Endpoint HTTP status: ${res.status}`);
    const text = await res.text();
    console.log(`Response: ${text}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}

runSetup();
