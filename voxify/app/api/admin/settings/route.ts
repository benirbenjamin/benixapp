import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mdubljdeimlpntyzektn.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// GET /api/admin/settings — Fetch platform settings
export async function GET() {
  try {
    const adminSupabase = getAdminSupabase();
    const { data, error } = await adminSupabase
      .from('platform_settings')
      .select('*')
      .eq('id', 'global')
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({
        google_pay_enabled: true,
        flutterwave_enabled: true,
        flutterwave_secret_key: null,
        flutterwave_public_key: null,
      });
    }

    return NextResponse.json({
      google_pay_enabled: data.google_pay_enabled ?? true,
      flutterwave_enabled: data.flutterwave_enabled ?? true,
      flutterwave_secret_key: data.flutterwave_secret_key || null,
      flutterwave_public_key: data.flutterwave_public_key || null,
    });
  } catch (err: any) {
    return NextResponse.json({
      google_pay_enabled: true,
      flutterwave_enabled: true,
      flutterwave_secret_key: null,
      flutterwave_public_key: null,
    });
  }
}

// POST /api/admin/settings — Update platform settings (Super Admin Only)
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_super_admin) {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 });
    }

    const updates = await request.json();

    const adminSupabase = getAdminSupabase();

    // Fetch existing settings to merge partial updates safely
    const { data: existing } = await adminSupabase
      .from('platform_settings')
      .select('*')
      .eq('id', 'global')
      .maybeSingle();

    const payload = {
      id: 'global',
      google_pay_enabled: updates.google_pay_enabled !== undefined ? Boolean(updates.google_pay_enabled) : (existing?.google_pay_enabled ?? true),
      flutterwave_enabled: updates.flutterwave_enabled !== undefined ? Boolean(updates.flutterwave_enabled) : (existing?.flutterwave_enabled ?? true),
      flutterwave_secret_key: updates.flutterwave_secret_key !== undefined ? updates.flutterwave_secret_key : (existing?.flutterwave_secret_key || null),
      flutterwave_public_key: updates.flutterwave_public_key !== undefined ? updates.flutterwave_public_key : (existing?.flutterwave_public_key || null),
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await adminSupabase
      .from('platform_settings')
      .upsert(payload);

    if (upsertError) {
      console.error('Settings upsert error:', upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, settings: payload });
  } catch (err: any) {
    console.error('Settings route error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update settings' }, { status: 500 });
  }
}
