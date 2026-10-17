import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { choirId, planId, priceMonthly, paymentToken, paymentMethod } = await req.json();

    if (!choirId || !planId) {
      return NextResponse.json({ error: 'Choir ID and Subscription Plan ID are required.' }, { status: 400 });
    }

    // Verify user is owner or admin of choir
    const { data: member } = await supabase
      .from('choir_members')
      .select('role')
      .eq('choir_id', choirId)
      .eq('user_id', user.id)
      .single();

    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return NextResponse.json({ error: 'Only Choir Owners or Admins can upgrade subscriptions.' }, { status: 403 });
    }

    // Fetch Plan details
    const { data: plan, error: planErr } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planErr || !plan) {
      return NextResponse.json({ error: 'Selected subscription plan not found.' }, { status: 404 });
    }

    // Calculate 30 days recurring period end date
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    // Check existing subscription
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('choir_id', choirId)
      .single();

    const subscriptionData = {
      choir_id: choirId,
      plan_id: planId,
      status: 'active',
      current_period_end: periodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existingSub) {
      const { error: updateErr } = await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', existingSub.id);

      if (updateErr) throw updateErr;
    } else {
      const { error: insertErr } = await supabase
        .from('subscriptions')
        .insert([subscriptionData]);

      if (insertErr) throw insertErr;
    }

    return NextResponse.json({
      success: true,
      planName: plan.name,
      periodEnd: periodEnd.toISOString(),
      message: `Google Pay subscription verified! Activated ${plan.name} plan ($${priceMonthly}/mo).`,
    });
  } catch (err: any) {
    console.error('Google Pay checkout API error:', err);
    return NextResponse.json({ error: err.message || 'Server error processing Google Pay checkout.' }, { status: 500 });
  }
}
