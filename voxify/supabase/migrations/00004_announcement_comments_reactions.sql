-- ------------------------------------------
-- ANNOUNCEMENT COMMENTS TABLE
-- ------------------------------------------
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

-- ------------------------------------------
-- ANNOUNCEMENT REACTIONS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcement_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL DEFAULT 'love',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(announcement_id, user_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_reactions_announcement ON public.announcement_reactions(announcement_id);

-- Disable RLS to prevent 404 / 403 API blockages
ALTER TABLE public.announcement_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reactions DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.announcement_comments TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.announcement_reactions TO anon, authenticated, service_role;
