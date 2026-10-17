-- Migration 00007: Artist Ecosystem & Music Marketplace Schema

-- 1. Extend profiles with user_type
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'regular';

-- 2. Create Genres table
CREATE TABLE IF NOT EXISTS genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL DEFAULT 'both', -- 'gospel', 'secular', 'both'
  is_local BOOLEAN NOT NULL DEFAULT false, -- true for Rwandan local genres
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Genres with Rwandan Local and Popular Genres
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

-- 3. Create Artist Profiles table
CREATE TABLE IF NOT EXISTS artist_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  bio TEXT,
  genres TEXT[] DEFAULT '{}',
  music_type TEXT NOT NULL DEFAULT 'gospel', -- 'gospel', 'secular', 'both'
  location TEXT DEFAULT 'Kigali',
  country TEXT DEFAULT 'Rwanda',
  social_links JSONB DEFAULT '{}'::jsonb,
  payout_details JSONB DEFAULT '{}'::jsonb,
  avatar_url TEXT,
  banner_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'suspended'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_artist UNIQUE(user_id)
);

-- 4. Create Marketplace Songs table
CREATE TABLE IF NOT EXISTS marketplace_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  genre_id UUID REFERENCES genres(id) ON DELETE SET NULL,
  music_type TEXT NOT NULL DEFAULT 'gospel', -- 'gospel', 'secular'
  language TEXT DEFAULT 'Kinyarwanda',
  audio_file_path TEXT NOT NULL, -- Private Supabase Storage path
  preview_audio_path TEXT, -- Public preview clip path if separate
  preview_start_time NUMERIC DEFAULT 0, -- seconds
  preview_end_time NUMERIC DEFAULT 30, -- seconds
  cover_image_url TEXT,
  lyrics TEXT,
  price NUMERIC NOT NULL DEFAULT 1000, -- RWF
  currency TEXT NOT NULL DEFAULT 'RWF',
  status TEXT NOT NULL DEFAULT 'published', -- 'draft', 'processing', 'published', 'archived', 'hidden'
  views_count INT DEFAULT 0,
  likes_count INT DEFAULT 0,
  purchases_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create User Purchases table
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

-- 6. Create Song Likes table
CREATE TABLE IF NOT EXISTS song_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES marketplace_songs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT, -- For guest user likes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create Song Comments table
CREATE TABLE IF NOT EXISTS song_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES marketplace_songs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'visible', -- 'visible', 'hidden', 'flagged'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create Financial Ledger table
CREATE TABLE IF NOT EXISTS financial_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  order_id TEXT,
  type TEXT NOT NULL, -- 'sale', 'withdrawal', 'fee', 'adjustment'
  amount NUMERIC NOT NULL,
  platform_fee_amount NUMERIC NOT NULL DEFAULT 0,
  net_artist_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RWF',
  balance_after NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Create Withdrawal Requests table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  fee_amount NUMERIC NOT NULL DEFAULT 0,
  net_payout_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RWF',
  payout_method TEXT NOT NULL DEFAULT 'momo', -- 'momo', 'airtel', 'bank'
  payout_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'paid', 'rejected'
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- 10. Create Marketplace Settings table
CREATE TABLE IF NOT EXISTS marketplace_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  platform_commission_percent NUMERIC NOT NULL DEFAULT 15.0, -- 15% platform commission
  min_withdrawal_amount NUMERIC NOT NULL DEFAULT 50000.0, -- 50,000 RWF minimum withdrawal
  withdrawal_fee_percent NUMERIC NOT NULL DEFAULT 0.0,
  allow_auto_artist_approval BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Marketplace Settings row
INSERT INTO marketplace_settings (id, platform_commission_percent, min_withdrawal_amount)
VALUES ('global', 15.0, 50000.0)
ON CONFLICT (id) DO NOTHING;

-- 11. Enable Row Level Security (RLS)
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_settings ENABLE ROW LEVEL SECURITY;

-- 12. RLS Policies

-- Genres Policies
DROP POLICY IF EXISTS "Genres public read" ON genres;
CREATE POLICY "Genres public read" ON genres FOR SELECT USING (true);
DROP POLICY IF EXISTS "Genres admin write" ON genres;
CREATE POLICY "Genres admin write" ON genres FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true)
);

-- Artist Profiles Policies
DROP POLICY IF EXISTS "Artist profiles public read" ON artist_profiles;
CREATE POLICY "Artist profiles public read" ON artist_profiles FOR SELECT USING (status = 'approved' OR user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true));
DROP POLICY IF EXISTS "Artist profiles insert own" ON artist_profiles;
CREATE POLICY "Artist profiles insert own" ON artist_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Artist profiles update own" ON artist_profiles;
CREATE POLICY "Artist profiles update own" ON artist_profiles FOR UPDATE USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true));

-- Marketplace Songs Policies
DROP POLICY IF EXISTS "Marketplace songs public read" ON marketplace_songs;
CREATE POLICY "Marketplace songs public read" ON marketplace_songs FOR SELECT USING (status = 'published' OR EXISTS (SELECT 1 FROM artist_profiles WHERE artist_profiles.id = marketplace_songs.artist_id AND artist_profiles.user_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true));
DROP POLICY IF EXISTS "Marketplace songs artist insert" ON marketplace_songs;
CREATE POLICY "Marketplace songs artist insert" ON marketplace_songs FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM artist_profiles WHERE artist_profiles.id = marketplace_songs.artist_id AND artist_profiles.user_id = auth.uid()));
DROP POLICY IF EXISTS "Marketplace songs artist update" ON marketplace_songs;
CREATE POLICY "Marketplace songs artist update" ON marketplace_songs FOR UPDATE USING (EXISTS (SELECT 1 FROM artist_profiles WHERE artist_profiles.id = marketplace_songs.artist_id AND artist_profiles.user_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true));

-- User Purchases Policies
DROP POLICY IF EXISTS "User purchases own read" ON user_purchases;
CREATE POLICY "User purchases own read" ON user_purchases FOR SELECT USING (buyer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true));
DROP POLICY IF EXISTS "User purchases insert" ON user_purchases;
CREATE POLICY "User purchases insert" ON user_purchases FOR INSERT WITH CHECK (buyer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true));

-- Song Likes Policies
DROP POLICY IF EXISTS "Song likes read" ON song_likes;
CREATE POLICY "Song likes read" ON song_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Song likes insert" ON song_likes;
CREATE POLICY "Song likes insert" ON song_likes FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Song likes delete own" ON song_likes;
CREATE POLICY "Song likes delete own" ON song_likes FOR DELETE USING (user_id = auth.uid());

-- Song Comments Policies
DROP POLICY IF EXISTS "Song comments read" ON song_comments;
CREATE POLICY "Song comments read" ON song_comments FOR SELECT USING (status = 'visible' OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true));
DROP POLICY IF EXISTS "Song comments insert" ON song_comments;
CREATE POLICY "Song comments insert" ON song_comments FOR INSERT WITH CHECK (true);

-- Financial Ledger Policies
DROP POLICY IF EXISTS "Ledger artist read" ON financial_ledger;
CREATE POLICY "Ledger artist read" ON financial_ledger FOR SELECT USING (
  EXISTS (SELECT 1 FROM artist_profiles WHERE artist_profiles.id = financial_ledger.artist_id AND artist_profiles.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true)
);

-- Withdrawal Requests Policies
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

-- Marketplace Settings Policies
DROP POLICY IF EXISTS "Settings public read" ON marketplace_settings;
CREATE POLICY "Settings public read" ON marketplace_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Settings admin write" ON marketplace_settings;
CREATE POLICY "Settings admin write" ON marketplace_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true)
);
