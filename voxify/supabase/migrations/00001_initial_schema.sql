-- ==========================================
-- VOXIFY SPACE — CHOIR MANAGEMENT & SONG LEARNING PLATFORM
-- Migration 00001: Initial Schema Architecture
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------
-- 1. PROFILES TABLE (Extends auth.users)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    avatar_url TEXT,
    is_super_admin BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger to create profile automatically on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, avatar_url, is_super_admin)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE((NEW.raw_user_meta_data->>'is_super_admin')::boolean, FALSE)
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------
-- 2. SUBSCRIPTION PLANS TABLE (Dynamic SaaS)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price_monthly NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    is_free BOOLEAN DEFAULT TRUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    features JSONB DEFAULT '[]'::jsonb NOT NULL,
    limits JSONB DEFAULT '{"max_members": 30, "max_storage_mb": 500, "max_choirs": 1, "max_audio_files": 100}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ------------------------------------------
-- 3. CHOIRS TABLE (Multi-Tenant Root)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.choirs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    church_name TEXT,
    logo_url TEXT,
    choir_code VARCHAR(10) NOT NULL UNIQUE,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    settings JSONB DEFAULT '{
        "auto_approve_members": false,
        "allow_code_join": true,
        "allow_invite_links": true,
        "allow_audio_downloads": true,
        "allow_pdf_downloads": true,
        "enable_email_notifications": true,
        "enable_push_notifications": true
    }'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_choirs_code ON public.choirs(choir_code);
CREATE INDEX IF NOT EXISTS idx_choirs_owner ON public.choirs(owner_id);

-- Helper function to generate 5-character unique code
CREATE OR REPLACE FUNCTION public.generate_unique_choir_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result TEXT := '';
    i INTEGER := 0;
    code_exists BOOLEAN := TRUE;
BEGIN
    WHILE code_exists LOOP
        result := '';
        FOR i IN 1..5 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
        END LOOP;
        SELECT EXISTS(SELECT 1 FROM public.choirs WHERE choir_code = result) INTO code_exists;
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------
-- 4. SUBSCRIPTIONS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    choir_id UUID NOT NULL UNIQUE REFERENCES public.choirs(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'expired')) NOT NULL,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ------------------------------------------
-- 5. CHOIR MEMBERS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.choir_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    choir_id UUID NOT NULL REFERENCES public.choirs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'section_leader', 'member')) NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'rejected', 'suspended', 'left')) NOT NULL,
    permissions JSONB DEFAULT '{}'::jsonb NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(choir_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_members_choir_user ON public.choir_members(choir_id, user_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON public.choir_members(status);

-- ------------------------------------------
-- 6. SECTIONS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    choir_id UUID NOT NULL REFERENCES public.choirs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(choir_id, name)
);

-- ------------------------------------------
-- 7. MEMBER SECTIONS TABLE (Many-to-Many)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.member_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES public.choir_members(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    UNIQUE(member_id, section_id)
);

-- ------------------------------------------
-- 8. INVITATIONS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    choir_id UUID NOT NULL REFERENCES public.choirs(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    email TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ,
    max_uses INTEGER DEFAULT 100,
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ------------------------------------------
-- 9. SONGS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    choir_id UUID NOT NULL REFERENCES public.choirs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    composer TEXT,
    arranger TEXT,
    description TEXT,
    language TEXT DEFAULT 'Kinyarwanda',
    category TEXT DEFAULT 'Worship',
    difficulty TEXT DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard', 'Advanced')),
    duration_seconds INTEGER DEFAULT 0,
    lyrics TEXT,
    notes TEXT,
    cover_url TEXT,
    sheet_music_pdf_url TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_songs_choir ON public.songs(choir_id);
CREATE INDEX IF NOT EXISTS idx_songs_category ON public.songs(category);

-- ------------------------------------------
-- 10. SONG PARTS TABLE (Audio Tracks per Voice)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.song_parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
    part_name TEXT NOT NULL CHECK (part_name IN ('Full Mix', 'Soprano', 'Alto', 'Tenor', 'Bass', 'Instrumental', 'Custom')),
    custom_part_label TEXT,
    audio_url TEXT NOT NULL,
    duration_seconds INTEGER DEFAULT 0,
    description TEXT,
    version INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_song_parts_song ON public.song_parts(song_id);

-- ------------------------------------------
-- 11. SONG VERSIONS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.song_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ------------------------------------------
-- 12. EVENTS TABLE (Sunday Services, Concerts)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    choir_id UUID NOT NULL REFERENCES public.choirs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME WITHOUT TIME ZONE NOT NULL,
    end_time TIME WITHOUT TIME ZONE,
    location TEXT,
    description TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'completed', 'cancelled')) NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_choir_date ON public.events(choir_id, event_date);

-- ------------------------------------------
-- 13. EVENT SONGS TABLE (Service Assignments)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 1 NOT NULL,
    notes TEXT,
    target_scope TEXT DEFAULT 'all' CHECK (target_scope IN ('all', 'section', 'members')) NOT NULL,
    target_section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
    target_member_ids JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(event_id, song_id)
);

-- ------------------------------------------
-- 14. REHEARSALS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.rehearsals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    choir_id UUID NOT NULL REFERENCES public.choirs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TIME WITHOUT TIME ZONE NOT NULL,
    end_time TIME WITHOUT TIME ZONE,
    location TEXT,
    description TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ------------------------------------------
-- 15. ATTENDANCE TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rehearsal_id UUID REFERENCES public.rehearsals(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.choir_members(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused')) NOT NULL,
    notes TEXT,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT attendance_target_check CHECK (
        (rehearsal_id IS NOT NULL AND event_id IS NULL) OR 
        (rehearsal_id IS NULL AND event_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_attendance_member ON public.attendance(member_id);

-- ------------------------------------------
-- 16. LEARNING PROGRESS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.learning_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES public.choir_members(id) ON DELETE CASCADE,
    song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
    part_name TEXT NOT NULL,
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'learning', 'ready')) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(member_id, song_id, part_name)
);

-- ------------------------------------------
-- 17. ANNOUNCEMENTS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    choir_id UUID NOT NULL REFERENCES public.choirs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high')) NOT NULL,
    target_scope TEXT DEFAULT 'all' CHECK (target_scope IN ('all', 'section')) NOT NULL,
    target_section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
    attachment_url TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ------------------------------------------
-- 18. NOTIFICATIONS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    choir_id UUID REFERENCES public.choirs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high')) NOT NULL,
    type TEXT DEFAULT 'general' NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);

-- ------------------------------------------
-- 19. AUDIT LOGS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    choir_id UUID REFERENCES public.choirs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ------------------------------------------
-- 20. FAVORITES TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, song_id)
);
