import { createClient } from '../supabase/client';
import { subscriptionService } from './subscriptionService';

export type LimitFeature = 'members' | 'songs' | 'events' | 'announcements';

export interface PlanCheckResult {
  allowed: boolean;
  currentCount: number;
  maxLimit: number;
  planName: string;
  featureLabel: string;
  message: string;
}

export const planEnforcementService = {
  async checkLimit(choirId: string, feature: LimitFeature): Promise<PlanCheckResult> {
    const supabase = createClient();
    const { plan } = await subscriptionService.getChoirSubscription(choirId);

    const planName = plan?.name || 'Community Free Plan';
    const limits = plan?.limits || {
      max_members: 15,
      max_songs: 5,
      max_events_per_month: 4,
      max_announcements_per_month: 3,
      max_storage_mb: 500,
      max_choirs: 1,
      max_audio_files: 50,
    };

    let currentCount = 0;
    let maxLimit = 999999;
    let featureLabel = '';

    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    const monthStartIso = firstDayOfMonth.toISOString();

    if (feature === 'members') {
      featureLabel = 'Members & Singers';
      maxLimit = limits.max_members ?? 15;
      const { count } = await supabase
        .from('choir_members')
        .select('id', { count: 'exact', head: true })
        .eq('choir_id', choirId)
        .eq('status', 'approved');
      currentCount = count || 0;
    } else if (feature === 'songs') {
      featureLabel = 'Songs in Library';
      maxLimit = limits.max_songs ?? 5;
      const { count } = await supabase
        .from('songs')
        .select('id', { count: 'exact', head: true })
        .eq('choir_id', choirId);
      currentCount = count || 0;
    } else if (feature === 'events') {
      featureLabel = 'Monthly Worship & Rehearsal Events';
      maxLimit = limits.max_events_per_month ?? 4;
      const { count } = await supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('choir_id', choirId)
        .gte('created_at', monthStartIso);
      currentCount = count || 0;
    } else if (feature === 'announcements') {
      featureLabel = 'Monthly Choir Announcements';
      maxLimit = limits.max_announcements_per_month ?? 3;
      const { count } = await supabase
        .from('announcements')
        .select('id', { count: 'exact', head: true })
        .eq('choir_id', choirId)
        .gte('created_at', monthStartIso);
      currentCount = count || 0;
    }

    // Treat negative numbers or >= 999000 as Unlimited
    const isUnlimited = maxLimit < 0 || maxLimit >= 999000;
    const allowed = isUnlimited || currentCount < maxLimit;

    const message = allowed
      ? `Usage OK: ${currentCount}/${isUnlimited ? 'Unlimited' : maxLimit} ${featureLabel}`
      : `Plan Limit Reached: Your choir is on the "${planName}" which allows up to ${maxLimit} ${featureLabel}. Current usage: ${currentCount}/${maxLimit}. Upgrade your plan to create more!`;

    return {
      allowed,
      currentCount,
      maxLimit: isUnlimited ? -1 : maxLimit,
      planName,
      featureLabel,
      message,
    };
  },
};
