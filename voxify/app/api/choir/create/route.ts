import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateChoirCode } from '@/lib/utils/choirCode';

export async function POST(request: Request) {
  try {
    const supabaseUserClient = await createServerSupabaseClient();
    const { data: { user } } = await supabaseUserClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User must be authenticated' }, { status: 401 });
    }

    const payload = await request.json();
    if (!payload.name) {
      return NextResponse.json({ error: 'Choir name is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mdubljdeimlpntyzektn.supabase.co';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    const adminSupabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 0. Ensure user profile exists in public.profiles table (prevents choirs_owner_id_fkey violation)
    const userFullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Choir Director';
    await adminSupabase.from('profiles').upsert({
      id: user.id,
      full_name: userFullName,
      email: user.email!,
      phone: user.user_metadata?.phone || null,
      avatar_url: user.user_metadata?.avatar_url || null,
      is_super_admin: false,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    const choirCode = generateChoirCode();

    // 1. Insert Choir
    const { data: choir, error: choirError } = await adminSupabase
      .from('choirs')
      .insert({
        name: payload.name,
        description: payload.description || null,
        location: payload.location || null,
        church_name: payload.church_name || null,
        logo_url: payload.logo_url || null,
        choir_code: choirCode,
        owner_id: user.id,
      })
      .select()
      .single();

    if (choirError || !choir) {
      return NextResponse.json({ error: choirError?.message || 'Failed to insert choir' }, { status: 500 });
    }

    // 2. Add User as Choir Owner
    await adminSupabase.from('choir_members').upsert({
      choir_id: choir.id,
      user_id: user.id,
      role: 'owner',
      status: 'active',
    }, { onConflict: 'choir_id,user_id' });

    // 3. Create Default Voice Sections
    const defaultSections = [
      { choir_id: choir.id, name: 'Soprano', description: 'High voice range' },
      { choir_id: choir.id, name: 'Alto', description: 'Middle-low voice range' },
      { choir_id: choir.id, name: 'Tenor', description: 'High male voice range' },
      { choir_id: choir.id, name: 'Bass', description: 'Deep male voice range' },
    ];
    await adminSupabase.from('sections').insert(defaultSections);

    // 4. Attach Free Plan Subscription
    const { data: freePlan } = await adminSupabase
      .from('subscription_plans')
      .select('id')
      .eq('is_free', true)
      .limit(1)
      .single();

    if (freePlan) {
      await adminSupabase.from('subscriptions').insert({
        choir_id: choir.id,
        plan_id: freePlan.id,
        status: 'active',
      });
    }

    return NextResponse.json({ choir, error: null });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error creating choir' }, { status: 500 });
  }
}
