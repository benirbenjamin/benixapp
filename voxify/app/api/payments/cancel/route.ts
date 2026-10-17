import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { choirId } = await req.json();

    if (!choirId) {
      return NextResponse.json({ error: 'Choir ID is required.' }, { status: 400 });
    }

    // Verify caller is owner of choir
    const { data: member } = await supabase
      .from('choir_members')
      .select('role')
      .eq('choir_id', choirId)
      .eq('user_id', user.id)
      .single();

    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return NextResponse.json({ error: 'Only Choir Owners or Admins can cancel subscriptions.' }, { status: 403 });
    }

    // Get Community Free plan
    const { data: freePlan } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('is_free', true)
      .single();

    const freePlanId = freePlan?.id || '';

    // Update subscription to Free plan
    const { error: updateErr } = await supabase
      .from('subscriptions')
      .update({
        plan_id: freePlanId,
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('choir_id', choirId);

    if (updateErr) throw updateErr;

    return NextResponse.json({
      success: true,
      message: 'Your subscription has been canceled. Your choir has been downgraded to the Free tier.',
    });
  } catch (err: any) {
    console.error('Subscription cancel error:', err);
    return NextResponse.json({ error: err.message || 'Failed to cancel subscription.' }, { status: 500 });
  }
}
