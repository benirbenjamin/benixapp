import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAppUrl } from '@/lib/utils/appUrl';
import { notificationService } from '@/lib/services/notificationService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error') || searchParams.get('error_code');
  const errorDesc = searchParams.get('error_description');

  const appUrl = getAppUrl();

  // If Supabase returned an error in query params (e.g. link expired)
  if (errorParam || errorDesc) {
    const isExpired = errorParam === 'otp_expired' || (errorDesc && errorDesc.toLowerCase().includes('expired'));
    const reason = isExpired ? 'link_expired' : 'verification_failed';
    return NextResponse.redirect(`${appUrl}/login?error=${reason}`);
  }

  const next = searchParams.get('next');

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const userMeta = data.user.user_metadata || {};
      const rolePref = userMeta.role_preference || 'singer';
      const userType = userMeta.user_type || (rolePref === 'artist' ? 'artist' : rolePref === 'director' ? 'choir_admin' : 'regular');

      // Check if this is a newly registered profile
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();

      const isNewUser = !existingProfile;

      // Ensure profile row exists in database with user_type, full_name, email & phone number
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: userMeta.full_name || data.user.email?.split('@')[0] || 'User',
        email: data.user.email!,
        phone: userMeta.phone || null,
        avatar_url: userMeta.avatar_url || null,
        user_type: userType,
        is_super_admin: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (isNewUser) {
        try {
          await notificationService.sendNotificationToSuperAdmins({
            title: 'New User Registered 👤',
            message: `${userMeta.full_name || data.user.email?.split('@')[0]} (${data.user.email}) confirmed their account as ${userType.replace('_', ' ')}.`,
            type: 'user_registered',
            link: '/admin/users',
            priority: 'normal',
          });
        } catch (notifErr) {
          console.warn('Registration callback notification note:', notifErr);
        }
      }

      // If next param was specified (e.g., /reset-password)
      if (next) {
        return NextResponse.redirect(`${appUrl}${next}`);
      }

      // Check artist account redirect
      if (userType === 'artist' || rolePref === 'artist') {
        const { data: artistProf } = await supabase
          .from('artist_profiles')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (!artistProf) {
          return NextResponse.redirect(`${appUrl}/onboarding/artist`);
        }
        return NextResponse.redirect(`${appUrl}/artist/dashboard`);
      }

      // Check director / choir master redirect
      const { data: choir } = await supabase
        .from('choirs')
        .select('id')
        .eq('owner_id', data.user.id)
        .limit(1)
        .maybeSingle();

      if ((rolePref === 'director' || userType === 'choir_admin') && !choir) {
        return NextResponse.redirect(`${appUrl}/choir/create`);
      }

      return NextResponse.redirect(`${appUrl}/dashboard`);
    }
  }

  // Fallback if no code or error
  if (next) {
    return NextResponse.redirect(`${appUrl}${next}`);
  }

  return NextResponse.redirect(`${appUrl}/login?verified=true`);
}
