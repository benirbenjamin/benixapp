-- Migration 00006: Platform Payment Settings & Subscription Plan Multi-Month Discounts

-- 1. Create platform_settings table
CREATE TABLE IF NOT EXISTS platform_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  google_pay_enabled BOOLEAN NOT NULL DEFAULT true,
  flutterwave_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial platform settings row if missing
INSERT INTO platform_settings (id, google_pay_enabled, flutterwave_enabled)
VALUES ('global', true, true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on platform_settings
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform settings read policy" ON platform_settings;
CREATE POLICY "Platform settings read policy" ON platform_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Platform settings update policy" ON platform_settings;
CREATE POLICY "Platform settings update policy" ON platform_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- 2. Add multi-month discount percentage columns to subscription_plans
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS discount_3_months NUMERIC DEFAULT 10,
ADD COLUMN IF NOT EXISTS discount_6_months NUMERIC DEFAULT 20,
ADD COLUMN IF NOT EXISTS discount_12_months NUMERIC DEFAULT 30;
