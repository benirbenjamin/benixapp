import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getReferrerDomain(ref: string): string {
  if (!ref || ref === 'direct' || ref.trim() === '') return 'Direct / Bookmark';
  const cleanRef = ref.toLowerCase();
  if (cleanRef.includes('google')) return 'Google Search';
  if (cleanRef.includes('facebook') || cleanRef.includes('fb.com')) return 'Facebook';
  if (cleanRef.includes('t.co') || cleanRef.includes('twitter') || cleanRef.includes('x.com')) return 'X / Twitter';
  if (cleanRef.includes('instagram')) return 'Instagram';
  if (cleanRef.includes('linkedin')) return 'LinkedIn';
  if (cleanRef.includes('youtube')) return 'YouTube';
  if (cleanRef.includes('bing') || cleanRef.includes('yahoo') || cleanRef.includes('duckduckgo')) return 'Other Search Engines';
  if (cleanRef.includes('voxify.space') || cleanRef.includes('localhost')) return 'Internal Navigation';
  
  try {
    const url = new URL(ref);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return 'Referral Domain';
  }
}

function parseBrowser(ua: string): string {
  if (!ua) return 'Other';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome/')) return 'Chrome';
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
  if (ua.includes('Firefox/')) return 'Firefox';
  return 'Other';
}

function parseDevice(ua: string, clientDevice?: string): 'mobile' | 'tablet' | 'desktop' {
  if (clientDevice === 'mobile' || clientDevice === 'tablet' || clientDevice === 'desktop') {
    return clientDevice;
  }
  if (!ua) return 'desktop';
  if (/iPad|Android(?!.*Mobile)/i.test(ua)) return 'tablet';
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      body = {};
    }
    const {
      sessionId,
      userId,
      pagePath,
      referrer,
      deviceType,
      userAgent,
      durationSeconds = 0,
    } = body;

    if (!sessionId || !pagePath) {
      return NextResponse.json({ error: 'Session ID and page path required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mdubljdeimlpntyzektn.supabase.co';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    const adminSupabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const referrerDomain = getReferrerDomain(referrer);
    const browserName = parseBrowser(userAgent || '');
    const computedDevice = parseDevice(userAgent || '', deviceType);

    // 1. Check if an active record exists for this session & page in last 30 minutes
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: existingVisit } = await adminSupabase
      .from('site_visits')
      .select('id, session_duration_seconds')
      .eq('session_id', sessionId)
      .eq('page_path', pagePath)
      .gte('updated_at', thirtyMinsAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingVisit) {
      // Update duration and last active timestamp
      const newDuration = Math.max(existingVisit.session_duration_seconds, durationSeconds || existingVisit.session_duration_seconds + 15);
      await adminSupabase
        .from('site_visits')
        .update({
          session_duration_seconds: newDuration,
          user_id: userId || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingVisit.id);

      return NextResponse.json({ success: true, updated: true });
    }

    // 2. Insert new visit event
    const { error } = await adminSupabase.from('site_visits').insert({
      session_id: sessionId,
      user_id: userId || null,
      page_path: pagePath,
      referrer: referrer || 'direct',
      referrer_domain: referrerDomain,
      user_agent: userAgent || null,
      device_type: computedDevice,
      browser: browserName,
      session_duration_seconds: Math.max(durationSeconds, 5),
    });

    if (error) {
      console.log('Analytics tracking note:', error.message);
    }

    return NextResponse.json({ success: true, inserted: true });
  } catch (err: any) {
    console.log('Analytics API error note:', err.message);
    return NextResponse.json({ success: true, note: 'Handled analytics API' });
  }
}
