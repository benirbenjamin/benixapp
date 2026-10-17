import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { choirId, email } = await req.json();

    if (!choirId || !email || !email.trim()) {
      return NextResponse.json({ error: 'Choir ID and recipient email address are required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Verify caller is owner or admin of the choir
    const { data: member } = await supabase
      .from('choir_members')
      .select('role')
      .eq('choir_id', choirId)
      .eq('user_id', user.id)
      .single();

    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return NextResponse.json({ error: 'Only Choir Owners or Admins can send invitations.' }, { status: 403 });
    }

    // Check choir member limit against active subscription plan
    const { count: memberCount } = await supabase
      .from('choir_members')
      .select('id', { count: 'exact', head: true })
      .eq('choir_id', choirId)
      .eq('status', 'approved');

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*, plan:plan_id(*)')
      .eq('choir_id', choirId)
      .single();

    const maxMembers = (sub as any)?.plan?.limits?.max_members ?? 15;
    const isUnlimited = maxMembers < 0 || maxMembers >= 999000;

    if (!isUnlimited && (memberCount || 0) >= maxMembers) {
      return NextResponse.json({
        error: `Member Limit Reached: Your choir's plan allows up to ${maxMembers} members (Current: ${memberCount}/${maxMembers}). Please upgrade your plan to invite more singers.`,
        limitReached: true,
        choirId,
      }, { status: 403 });
    }

    // Fetch Choir details
    const { data: choir, error: choirErr } = await supabase
      .from('choirs')
      .select('*')
      .eq('id', choirId)
      .single();

    if (choirErr || !choir) {
      return NextResponse.json({ error: 'Choir not found.' }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://voxify.space';
    const joinUrl = `${appUrl}/join/${choir.choir_code}`;

    // Send Email via Resend
    let emailSent = false;
    let emailErr = null;

    if (resend) {
      try {
        const { error: sendError } = await resend.emails.send({
          from: 'Voxify Space <invites@voxify.space>',
          to: [cleanEmail],
          subject: `You are invited to join ${choir.name} on Voxify Space`,
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #ffffff; padding: 36px; border-radius: 20px; max-width: 560px; margin: 0 auto; border: 1px solid #334155;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="color: #c084fc; font-size: 26px; font-weight: 800; margin: 0 0 8px 0;">You're Invited!</h2>
                <p style="color: #94a3b8; font-size: 14px; margin: 0;">Join ${choir.name} on Voxify Space</p>
              </div>

              <div style="background-color: #1e293b; padding: 24px; border-radius: 16px; margin: 24px 0; border: 1px solid #334155; text-align: center;">
                <span style="color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Choir Invitation Code</span>
                <h1 style="color: #c084fc; font-family: monospace; font-size: 32px; letter-spacing: 6px; margin: 12px 0;">${choir.choir_code}</h1>
                <p style="color: #cbd5e1; font-size: 13px; margin-top: 8px;">
                  Use this code to practice multi-track voice parts (Soprano, Alto, Tenor, Bass), lyrics, and sheet music.
                </p>
              </div>

              <div style="text-align: center; margin-top: 28px;">
                <a href="${joinUrl}" style="display: inline-block; background-color: #9333ea; color: #ffffff; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 14px; text-decoration: none; box-shadow: 0 4px 14px rgba(147, 51, 234, 0.4);">
                  Accept Invitation &amp; Join Choir →
                </a>
              </div>

              <div style="border-top: 1px solid #1e293b; margin-top: 32px; padding-top: 16px; text-align: center;">
                <p style="color: #64748b; font-size: 11px; margin: 0;">
                  Sent by ${choir.name} via Voxify Space • If you did not expect this invitation, you can safely ignore this email.
                </p>
              </div>
            </div>
          `,
        });

        if (sendError) {
          emailErr = sendError.message;
        } else {
          emailSent = true;
        }
      } catch (err: any) {
        emailErr = err.message || 'Resend error';
      }
    } else {
      emailErr = 'RESEND_API_KEY environment variable is not configured.';
    }

    // Check if recipient email already exists in profiles
    const { data: recipientProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (recipientProfile) {
      // Create in-app notification
      await supabase.from('notifications').insert({
        user_id: recipientProfile.id,
        choir_id: choir.id,
        title: `Choir Invitation: ${choir.name}`,
        message: `You have been invited by the Choir Master to join ${choir.name}. Click to accept your invitation!`,
        type: 'invitation',
        priority: 'high',
        link: `/join/${choir.choir_code}`,
        is_read: false,
      });
    }

    return NextResponse.json({
      success: true,
      emailSent,
      emailErr,
      choirCode: choir.choir_code,
      message: emailSent
        ? `Invitation successfully sent to ${cleanEmail}!`
        : `Invitation logged for ${cleanEmail}. (Note: ${emailErr || 'Email gateway unavailable'})`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
