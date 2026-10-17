-- Migration: 00009_dual_storage_bucket_overflow.sql
-- Description: Unified Dual Storage (Bucket + Google Drive with OAuth Refresh Token) & Bucket Overflow

-- 1. Add bucket quota & tracking columns to platform_settings
ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS bucket_quota_mb NUMERIC NOT NULL DEFAULT 1000,
ADD COLUMN IF NOT EXISTS bucket_used_mb NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS bucket_file_count INT NOT NULL DEFAULT 0;

-- 2. Update default storage mode to unified dual_storage
UPDATE public.platform_settings 
SET storage_mode = 'dual_storage'
WHERE storage_mode IS NULL OR storage_mode != 'dual_storage';

-- 3. Create file_storage_records table to track dual copies & prevent missing files
CREATE TABLE IF NOT EXISTS public.file_storage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  mime_type TEXT,
  size_mb NUMERIC DEFAULT 0,
  bucket_name TEXT,
  bucket_url TEXT,
  drive_file_id TEXT,
  drive_stream_url TEXT,
  drive_account_email TEXT,
  storage_provider TEXT NOT NULL DEFAULT 'dual', -- 'dual', 'google_drive'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_file_storage_records_drive_id ON public.file_storage_records(drive_file_id);
CREATE INDEX IF NOT EXISTS idx_file_storage_records_created ON public.file_storage_records(created_at DESC);

-- Enable RLS
ALTER TABLE public.file_storage_records ENABLE ROW LEVEL SECURITY;

-- Allow public read of file records
CREATE POLICY "Public read for file_storage_records" 
  ON public.file_storage_records 
  FOR SELECT 
  USING (true);

-- Allow service role full access
CREATE POLICY "Service role full access to file_storage_records" 
  ON public.file_storage_records 
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);
