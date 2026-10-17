-- Migration: 00005_platform_analytics.sql
-- Create site_visits table for tracking platform traffic, visitor referrers, duration, devices & browsers

CREATE TABLE IF NOT EXISTS public.site_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  page_path TEXT NOT NULL,
  referrer TEXT NOT NULL DEFAULT 'direct',
  referrer_domain TEXT NOT NULL DEFAULT 'Direct / Bookmark',
  user_agent TEXT,
  device_type TEXT NOT NULL DEFAULT 'desktop',
  browser TEXT NOT NULL DEFAULT 'Chrome',
  country TEXT NOT NULL DEFAULT 'Direct',
  session_duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for analytics aggregation
CREATE INDEX IF NOT EXISTS idx_site_visits_session_id ON public.site_visits(session_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_created_at ON public.site_visits(created_at);
CREATE INDEX IF NOT EXISTS idx_site_visits_referrer_domain ON public.site_visits(referrer_domain);
CREATE INDEX IF NOT EXISTS idx_site_visits_page_path ON public.site_visits(page_path);
CREATE INDEX IF NOT EXISTS idx_site_visits_device_type ON public.site_visits(device_type);

-- Enable RLS
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

-- Allow insert via service role or anon tracking
CREATE POLICY "Allow public insert for site_visits" ON public.site_visits
  FOR INSERT WITH CHECK (true);

-- Allow super admins to read site_visits
CREATE POLICY "Allow super admins to view site_visits" ON public.site_visits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true
    )
  );
