-- ==========================================
-- VOXIFY SPACE — DEMO & DEFAULT SEED DATA
-- ==========================================

-- Insert Default Dynamic SaaS Subscription Plans
INSERT INTO public.subscription_plans (id, name, description, price_monthly, is_free, is_active, features, limits)
VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'Community Free',
    'Perfect for small church choirs & local singing groups getting started.',
    0.00,
    TRUE,
    TRUE,
    '["song_management", "voice_parts", "events", "rehearsals", "announcements", "basic_analytics"]'::jsonb,
    '{"max_members": 25, "max_storage_mb": 500, "max_choirs": 1, "max_audio_files": 50, "max_events_per_month": 10}'::jsonb
),
(
    '22222222-2222-2222-2222-222222222222',
    'Choir Pro',
    'Ideal for growing choirs needing advanced practice tools, loop features & push notifications.',
    12.00,
    FALSE,
    TRUE,
    '["song_management", "voice_parts", "events", "rehearsals", "announcements", "attendance_tracking", "push_notifications", "email_notifications", "audio_downloads", "pdf_downloads", "loop_practice_tool", "advanced_analytics"]'::jsonb,
    '{"max_members": 100, "max_storage_mb": 5000, "max_choirs": 3, "max_audio_files": 500, "max_events_per_month": 50}'::jsonb
),
(
    '33333333-3333-3333-3333-333333333333',
    'Cathedral Enterprise',
    'For major choir networks, archdioceses, and large musical organizations.',
    39.00,
    FALSE,
    TRUE,
    '["song_management", "voice_parts", "events", "rehearsals", "announcements", "attendance_tracking", "push_notifications", "email_notifications", "audio_downloads", "pdf_downloads", "loop_practice_tool", "section_leaders", "multi_admin", "custom_branding", "audit_logs", "priority_support"]'::jsonb,
    '{"max_members": 1000, "max_storage_mb": 50000, "max_choirs": 20, "max_audio_files": 5000, "max_events_per_month": 500}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    features = EXCLUDED.features,
    limits = EXCLUDED.limits;
