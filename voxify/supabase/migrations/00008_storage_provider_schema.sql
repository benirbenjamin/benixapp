-- Migration: 00008_storage_provider_schema.sql
-- Description: Platform Storage Settings & Google Drive Multi-Account Rotation Pool

-- 1. Extend platform_settings with storage config
ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS storage_mode TEXT NOT NULL DEFAULT 'supabase_primary',
ADD COLUMN IF NOT EXISTS storage_fallback_enabled BOOLEAN NOT NULL DEFAULT true;

-- 2. Create google_drive_accounts table
CREATE TABLE IF NOT EXISTS public.google_drive_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_email TEXT NOT NULL UNIQUE,
  folder_id TEXT NOT NULL DEFAULT '',
  credentials_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'full', 'disabled'
  max_storage_mb NUMERIC NOT NULL DEFAULT 15000, -- 15 GB free tier standard
  used_storage_mb NUMERIC NOT NULL DEFAULT 0,
  file_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick active account lookup
CREATE INDEX IF NOT EXISTS idx_google_drive_accounts_status ON public.google_drive_accounts(status, created_at);

-- Trigger to update updated_at timestamp
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

-- RLS Policies
ALTER TABLE public.google_drive_accounts ENABLE ROW LEVEL SECURITY;

-- Allow super_admin users to manage google drive accounts
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

-- Allow service role full access
CREATE POLICY "Service role full access to google_drive_accounts"
  ON public.google_drive_accounts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
