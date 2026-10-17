import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function GET(req: Request) {
  return handleSubscriptionCheck();
}

export async function POST(req: Request) {
  return handleSubscriptionCheck();
}

async function handleSubscriptionCheck() {
  try {
    const supabase = await createServerSupabaseClient();
    const now = new Date();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://voxify.space';

    // 1. Fetch active subscriptions with non-null current_period_end
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*, choir:choir_id(*), plan:plan_id(*)');

    if (error || !subscriptions) {
      return NextResponse.json({ error: error?.message || 'No subscriptions found' }, { status: 500 });
    }

    // Get Free plan ID
    const { data: freePlan } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('is_free', true)
      .single();

    const freePlanId = freePlan?.id || '';

    let warningsSent = 0;
    let downgradedCount = 0;

    for (const sub of subscriptions) {
      if (!sub.current_period_end || sub.plan?.is_free) continue;

      const periodEnd = new Date(sub.current_period_end);
      const diffMs = periodEnd.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // Fetch Choir Owners / Admins to notify
      const { data: choirMembers } = await supabase
        .from('choir_members')
        .select('user_id, role, profile:user_id(*)')
        .eq('choir_id', sub.choir_id)
        .in('role', ['owner', 'admin']);

      const choirName = sub.choir?.name || 'Your Choir';
      const planName = sub.plan?.name || 'Subscription Plan';

      // CASE A: Subscription expiring in <= 5 days -> Send Warnings (Push, Email, In-App)
      if (diffDays <= 5 && diffDays >= 0) {
        warningsSent++;
        for (const m of choirMembers || []) {
          const userEmail = (m.profile as any)?.email;
          const userId = m.user_id;

          // Insert In-App Notification
          await supabase.from('notifications').insert({
            user_id: userId,
            choir_id: sub.choir_id,
            title: `⚠️ Subscription Renewal Notice: ${choirName}`,
            message: `Your "${planName}" subscription for ${choirName} expires in ${diffDays} day(s). Renew now to avoid feature interruptions!`,
            type: 'subscription_warning',
            priority: 'high',
            link: `/choir/plan-select?choirId=${sub.choir_id}`,
            is_read: false,
          });

          // Send Email Notification via Resend
          if (resend && userEmail) {
            try {
              await resend.emails.send({
                from: 'Voxify Space Billing <billing@voxify.space>',
                to: [userEmail],
                subject: `⚠️ Action Required: Subscription for ${choirName} expires in ${diffDays} days`,
                html: `
                  <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #ffffff; padding: 32px; border-radius: 16px; max-width: 540px; margin: 0 auto; border: 1px solid #334155;">
                    <h2 style="color: #fbbf24; font-size: 22px;">Subscription Expiry Reminder</h2>
                    <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                      Your choir <strong>${choirName}</strong> active <strong>${planName}</strong> plan is set to expire in <strong>${diffDays} day(s)</strong> (${periodEnd.toLocaleDateString()}).
                    </p>
                    <div style="text-align: center; margin: 28px 0;">
                      <a href="${appUrl}/choir/plan-select?choirId=${sub.choir_id}" style="background-color: #9333ea; color: #ffffff; padding: 14px 28px; border-radius: 12px; font-weight: bold; text-decoration: none; display: inline-block;">
                        Renew Subscription Now →
                      </a>
                    </div>
                  </div>
                `,
              });
            } catch (e) {
              console.warn('Resend email failed:', e);
            }
          }
        }
      }

      // CASE B: Unpaid for > 10 days past expiry -> Auto-Downgrade to Free Tier
      if (diffDays < -10) {
        downgradedCount++;
        // Downgrade subscription to Free plan
        await supabase
          .from('subscriptions')
          .update({
            plan_id: freePlanId,
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', sub.id);

        for (const m of choirMembers || []) {
          const userEmail = (m.profile as any)?.email;
          const userId = m.user_id;

          // Insert In-App Notification
          await supabase.from('notifications').insert({
            user_id: userId,
            choir_id: sub.choir_id,
            title: `🚨 Plan Downgraded: ${choirName}`,
            message: `Your choir subscription was unpaid for 10 days past expiry and has been automatically downgraded to the Free Community plan. Re-upgrade anytime!`,
            type: 'subscription_warning',
            priority: 'high',
            link: `/choir/plan-select?choirId=${sub.choir_id}`,
            is_read: false,
          });

          // Send Email Notification
          if (resend && userEmail) {
            try {
              await resend.emails.send({
                from: 'Voxify Space Billing <billing@voxify.space>',
                to: [userEmail],
                subject: `🚨 Subscription Downgraded for ${choirName}`,
                html: `
                  <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #ffffff; padding: 32px; border-radius: 16px; max-width: 540px; margin: 0 auto; border: 1px solid #334155;">
                    <h2 style="color: #f87171; font-size: 22px;">10-Day Grace Period Ended</h2>
                    <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                      The 10-day grace period for <strong>${choirName}</strong> has ended. Your choir plan has been automatically set to the <strong>Community Free Plan</strong>.
                    </p>
                    <div style="text-align: center; margin: 28px 0;">
                      <a href="${appUrl}/choir/plan-select?choirId=${sub.choir_id}" style="background-color: #9333ea; color: #ffffff; padding: 14px 28px; border-radius: 12px; font-weight: bold; text-decoration: none; display: inline-block;">
                        Re-Upgrade Plan Anytime →
                      </a>
                    </div>
                  </div>
                `,
              });
            } catch (e) {
              console.warn('Resend email failed:', e);
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: subscriptions.length,
      warningsSent,
      downgradedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Subscription check cron error:', err);
    return NextResponse.json({ error: err.message || 'Error processing subscription check' }, { status: 500 });
  }
}
