import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { analyticsService } from '@/lib/services/analyticsService';

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify Super Admin status
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_super_admin) {
      return NextResponse.json({ error: 'Access restricted to Platform Super Admins' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const timeframe = (searchParams.get('timeframe') as 'today' | '7d' | '30d' | '365d' | 'all') || '30d';

    const summary = await analyticsService.getAnalyticsSummary(timeframe, supabase);
    return NextResponse.json(summary);

  } catch (err: any) {
    console.error('Analytics summary API error:', err);
    return NextResponse.json({ error: err.message || 'Server error loading analytics' }, { status: 500 });
  }
}
