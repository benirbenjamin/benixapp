import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import postgres from 'postgres';

export async function POST() {
  try {
    let dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    if (!dbUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'DATABASE_URL environment variable is missing in Vercel settings.',
        },
        { status: 400 }
      );
    }

    // Handle db.[ref].supabase.co hostname resolution issues by trying direct connection or pooler host
    const migrationFiles = [
      'supabase/migrations/00001_initial_schema.sql',
      'supabase/migrations/00002_rls_policies.sql',
      'supabase/migrations/00003_storage_buckets.sql',
      'supabase/migrations/00004_announcement_comments_reactions.sql',
      'supabase/migrations/00005_platform_analytics.sql',
      'supabase/migrations/00006_platform_settings_and_discounts.sql',
      'supabase/migrations/00007_artist_marketplace_schema.sql',
      'supabase/migrations/00008_storage_provider_schema.sql',
      'supabase/seed.sql',
    ];

    let sql;
    let connected = false;
    let lastErr = null;

    // List of candidate URLs to attempt
    const candidateUrls = [dbUrl];
    const pass = dbUrl.split(':')[2]?.split('@')[0] || '1202%21birthDATE';
    const ref = 'mdubljdeimlpntyzektn';

    const poolerRegions = [
      'aws-0-eu-central-1',
      'aws-0-eu-west-1',
      'aws-0-eu-west-2',
      'aws-0-eu-west-3',
      'aws-0-us-east-1',
      'aws-0-us-east-2',
      'aws-0-us-west-1',
      'aws-0-us-west-2',
      'aws-0-ap-southeast-1',
      'aws-0-ap-southeast-2',
      'aws-0-ap-south-1',
      'aws-0-sa-east-1',
      'aws-0-ca-central-1',
      'aws-0-me-central-1',
      'aws-0-af-south-1',
    ];

    for (const r of poolerRegions) {
      candidateUrls.push(
        `postgresql://postgres.${ref}:${pass}@${r}.pooler.supabase.com:6543/postgres`,
        `postgresql://postgres.${ref}:${pass}@${r}.pooler.supabase.com:5432/postgres`
      );
    }

    const results: string[] = [];

    const embedded00007Sql = `
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'regular';

CREATE TABLE IF NOT EXISTS genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL DEFAULT 'both',
  is_local BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO genres (name, slug, category, is_local, description) VALUES
  ('Sebene', 'sebene', 'both', true, 'Energetic Congolese/Rwandan rhythmic guitar dance tempo'),
  ('Igisirimba', 'igisirimba', 'gospel', true, 'Vibrant Rwandan praise and worship rhythmic gospel style'),
  ('Zoulu', 'zoulu', 'both', true, 'Rwandan traditional-modern pulse beat'),
  ('Zulu Reggae', 'zulu-reggae', 'both', true, 'Rwandan-African reggae groove with traditional basslines'),
  ('Reggae', 'reggae', 'both', false, 'Classic reggae and roots music'),
  ('Zouk', 'zouk', 'both', true, 'Smooth Caribbean-Rwandan tropical rhythm'),
  ('Ikinimba', 'ikinimba', 'both', true, 'Northern Rwandan high-energy traditional dance rhythm'),
  ('Ikinyemera', 'ikinyemera', 'both', true, 'Graceful traditional Rwandan royal movement tempo'),
  ('Umukunga', 'umukunga', 'both', true, 'Expressive cultural storytelling rhythmic music'),
  ('Trois Temps', 'trois-temps', 'both', true, 'Classic 3/4 time traditional Rwandan hymn and waltz style'),
  ('Gospel Praise', 'gospel-praise', 'gospel', false, 'Modern high-energy Christian praise and worship'),
  ('Gospel Worship', 'gospel-worship', 'gospel', false, 'Soaking, meditative spiritual Christian worship'),
  ('Choral Music', 'choral-music', 'both', false, 'Classical and sacred multi-part vocal choir arrangements'),
  ('Afrobeats', 'afrobeats', 'both', false, 'Contemporary West & East African pop and dance rhythm'),
  ('Acoustic / Vocal', 'acoustic-vocal', 'both', false, 'Stripped back acoustic instrumentals and vocal ballads')
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS artist_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  bio TEXT,
  genres TEXT[] DEFAULT '{}',
  music_type TEXT NOT NULL DEFAULT 'gospel',
  location TEXT DEFAULT 'Kigali',
  country TEXT DEFAULT 'Rwanda',
  social_links JSONB DEFAULT '{}'::jsonb,
  payout_details JSONB DEFAULT '{}'::jsonb,
  avatar_url TEXT,
  banner_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_artist UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS marketplace_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  genre_id UUID REFERENCES genres(id) ON DELETE SET NULL,
  music_type TEXT NOT NULL DEFAULT 'gospel',
  language TEXT DEFAULT 'Kinyarwanda',
  audio_file_path TEXT NOT NULL,
  preview_audio_path TEXT,
  preview_start_time NUMERIC DEFAULT 0,
  preview_end_time NUMERIC DEFAULT 30,
  cover_image_url TEXT,
  lyrics TEXT,
  price NUMERIC NOT NULL DEFAULT 1000,
  currency TEXT NOT NULL DEFAULT 'RWF',
  status TEXT NOT NULL DEFAULT 'published',
  views_count INT DEFAULT 0,
  likes_count INT DEFAULT 0,
  purchases_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES marketplace_songs(id) ON DELETE CASCADE,
  order_ref TEXT NOT NULL UNIQUE,
  amount_paid NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RWF',
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_buyer_song UNIQUE(buyer_id, song_id)
);

CREATE TABLE IF NOT EXISTS song_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES marketplace_songs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS song_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES marketplace_songs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'visible',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS financial_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  order_id TEXT,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  platform_fee_amount NUMERIC NOT NULL DEFAULT 0,
  net_artist_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RWF',
  balance_after NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  fee_amount NUMERIC NOT NULL DEFAULT 0,
  net_payout_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RWF',
  payout_method TEXT NOT NULL DEFAULT 'momo',
  payout_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS marketplace_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  platform_commission_percent NUMERIC NOT NULL DEFAULT 15.0,
  min_withdrawal_amount NUMERIC NOT NULL DEFAULT 5000.0,
  withdrawal_fee_percent NUMERIC NOT NULL DEFAULT 0.0,
  allow_auto_artist_approval BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO marketplace_settings (id, platform_commission_percent, min_withdrawal_amount)
VALUES ('global', 15.0, 5000.0)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Genres public read" ON genres;
CREATE POLICY "Genres public read" ON genres FOR SELECT USING (true);
DROP POLICY IF EXISTS "Genres admin write" ON genres;
CREATE POLICY "Genres admin write" ON genres FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true)
);

DROP POLICY IF EXISTS "Artist profiles public read" ON artist_profiles;
CREATE POLICY "Artist profiles public read" ON artist_profiles FOR SELECT USING (status = 'approved' OR user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true));
DROP POLICY IF EXISTS "Artist profiles insert own" ON artist_profiles;
CREATE POLICY "Artist profiles insert own" ON artist_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Artist profiles update own" ON artist_profiles;
CREATE POLICY "Artist profiles update own" ON artist_profiles FOR UPDATE USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true));

DROP POLICY IF EXISTS "Marketplace songs public read" ON marketplace_songs;
CREATE POLICY "Marketplace songs public read" ON marketplace_songs FOR SELECT USING (status = 'published' OR EXISTS (SELECT 1 FROM artist_profiles WHERE artist_profiles.id = marketplace_songs.artist_id AND artist_profiles.user_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true));
DROP POLICY IF EXISTS "Marketplace songs artist insert" ON marketplace_songs;
CREATE POLICY "Marketplace songs artist insert" ON marketplace_songs FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM artist_profiles WHERE artist_profiles.id = marketplace_songs.artist_id AND artist_profiles.user_id = auth.uid()));
DROP POLICY IF EXISTS "Marketplace songs artist update" ON marketplace_songs;
CREATE POLICY "Marketplace songs artist update" ON marketplace_songs FOR UPDATE USING (EXISTS (SELECT 1 FROM artist_profiles WHERE artist_profiles.id = marketplace_songs.artist_id AND artist_profiles.user_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true));

DROP POLICY IF EXISTS "User purchases own read" ON user_purchases;
CREATE POLICY "User purchases own read" ON user_purchases FOR SELECT USING (buyer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true));
DROP POLICY IF EXISTS "User purchases insert" ON user_purchases;
CREATE POLICY "User purchases insert" ON user_purchases FOR INSERT WITH CHECK (buyer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true));

DROP POLICY IF EXISTS "Song likes read" ON song_likes;
CREATE POLICY "Song likes read" ON song_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Song likes insert" ON song_likes;
CREATE POLICY "Song likes insert" ON song_likes FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Song likes delete own" ON song_likes;
CREATE POLICY "Song likes delete own" ON song_likes FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Song comments read" ON song_comments;
CREATE POLICY "Song comments read" ON song_comments FOR SELECT USING (status = 'visible' OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true));
DROP POLICY IF EXISTS "Song comments insert" ON song_comments;
CREATE POLICY "Song comments insert" ON song_comments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Ledger artist read" ON financial_ledger;
CREATE POLICY "Ledger artist read" ON financial_ledger FOR SELECT USING (
  EXISTS (SELECT 1 FROM artist_profiles WHERE artist_profiles.id = financial_ledger.artist_id AND artist_profiles.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true)
);

DROP POLICY IF EXISTS "Withdrawal artist read" ON withdrawal_requests;
CREATE POLICY "Withdrawal artist read" ON withdrawal_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM artist_profiles WHERE artist_profiles.id = withdrawal_requests.artist_id AND artist_profiles.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true)
);
DROP POLICY IF EXISTS "Withdrawal artist insert" ON withdrawal_requests;
CREATE POLICY "Withdrawal artist insert" ON withdrawal_requests FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM artist_profiles WHERE artist_profiles.id = withdrawal_requests.artist_id AND artist_profiles.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Withdrawal admin update" ON withdrawal_requests;
CREATE POLICY "Withdrawal admin update" ON withdrawal_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true)
);

DROP POLICY IF EXISTS "Settings public read" ON marketplace_settings;
CREATE POLICY "Settings public read" ON marketplace_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Settings admin write" ON marketplace_settings;
CREATE POLICY "Settings admin write" ON marketplace_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true)
);
`;

    for (const urlStr of candidateUrls) {
      try {
        sql = postgres(urlStr, { ssl: { rejectUnauthorized: false }, connect_timeout: 10 });
        for (const relPath of migrationFiles) {
          const fullPath = path.join(/*turbopackIgnore: true*/ process.cwd(), relPath);
          if (fs.existsSync(fullPath)) {
            const sqlContent = fs.readFileSync(fullPath, 'utf8');
            await sql.unsafe(sqlContent);
            results.push(`Executed: ${relPath}`);
          }
        }
        // Always execute embedded migration 00007 as well to guarantee artist marketplace tables exist
        await sql.unsafe(embedded00007Sql);
        results.push('Executed: embedded_00007_artist_marketplace');

        // Execute embedded migration 00008 for storage provider schema
        const embedded00008Sql = `
ALTER TABLE public.platform_settings
ADD COLUMN IF NOT EXISTS storage_mode TEXT NOT NULL DEFAULT 'dual_storage',
ADD COLUMN IF NOT EXISTS storage_fallback_enabled BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS bucket_quota_mb NUMERIC NOT NULL DEFAULT 1000,
ADD COLUMN IF NOT EXISTS bucket_used_mb NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS bucket_file_count INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.google_drive_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_email TEXT NOT NULL UNIQUE,
  folder_id TEXT NOT NULL DEFAULT '',
  credentials_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  max_storage_mb NUMERIC NOT NULL DEFAULT 15000,
  used_storage_mb NUMERIC NOT NULL DEFAULT 0,
  file_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_google_drive_accounts_status ON public.google_drive_accounts(status, created_at);

CREATE OR REPLACE FUNCTION update_google_drive_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_google_drive_accounts_updated_at ON public.google_drive_accounts;
CREATE TRIGGER trg_google_drive_accounts_updated_at
  BEFORE UPDATE ON public.google_drive_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_google_drive_accounts_updated_at();

ALTER TABLE public.google_drive_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage google_drive_accounts" ON public.google_drive_accounts;
CREATE POLICY "Super admins can manage google_drive_accounts"
  ON public.google_drive_accounts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid()
      AND public.profiles.is_super_admin = true
    )
  );

DROP POLICY IF EXISTS "Service role full access to google_drive_accounts" ON public.google_drive_accounts;
CREATE POLICY "Service role full access to google_drive_accounts"
  ON public.google_drive_accounts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
`;
        await sql.unsafe(embedded00008Sql);
        results.push('Executed: embedded_00008_storage_provider_schema');

        await sql.end();
        connected = true;
        break;
      } catch (err: any) {
        lastErr = err;
        if (sql) await sql.end().catch(() => {});
      }
    }

    if (!connected) {
      return NextResponse.json({
        success: false,
        error: lastErr?.message || 'Failed to connect to database pooler.',
        details: [lastErr?.stack || 'Handled pooler connection error'],
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'All Supabase database tables, Row Level Security policies, storage buckets, announcement comments/reactions, initial SaaS plans, and Artist Marketplace schema created successfully!',
      details: results,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Handled setup error',
      details: [error.stack || 'Handled setup error'],
    }, { status: 500 });
  }
}
