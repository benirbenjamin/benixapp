import { getSupabaseClient } from './client';

export type AnalyticsEventType =
  | 'page_visit'
  | 'calculator_opened'
  | 'calculator_used'
  | 'calculation_completed'
  | 'category_viewed'
  | 'search_performed'
  | 'result_copied'
  | 'result_shared';

interface TrackEventParams {
  eventType: AnalyticsEventType;
  calculatorId?: string;
  pagePath?: string;
  metadata?: Record<string, any>;
}

// Generate or retrieve anonymous session ID from sessionStorage
function getAnonymousSessionId(): string {
  if (typeof window === 'undefined') return 'server';

  const key = 'benix_anon_session_id';
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = 's_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
    try {
      sessionStorage.setItem(key, id);
    } catch {
      // Storage might be restricted
    }
  }
  return id;
}

// Device and browser detection
function getClientEnvironment() {
  if (typeof window === 'undefined') {
    return { deviceType: 'desktop', browser: 'unknown', os: 'unknown', referrer: '' };
  }

  const ua = navigator.userAgent;
  let deviceType = 'desktop';
  if (/iPad|Tablet|PlayBook/i.test(ua) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /Macintosh/.test(ua))) {
    deviceType = 'tablet';
  } else if (/Mobi|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    deviceType = 'mobile';
  }

  let browser = 'Other';
  if (/Chrome/i.test(ua) && !/Edg|OPR/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/OPR|Opera/i.test(ua)) browser = 'Opera';

  let os = 'Other';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  return {
    deviceType,
    browser,
    os,
    referrer: typeof document !== 'undefined' ? document.referrer || '' : '',
  };
}

// Buffer to batch analytics calls and reduce network overhead
let eventQueue: Array<any> = [];
let flushTimeout: NodeJS.Timeout | null = null;

async function flushEvents() {
  if (eventQueue.length === 0) return;

  const eventsToSend = [...eventQueue];
  eventQueue = [];
  flushTimeout = null;

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('analytics_events').insert(eventsToSend);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[Analytics] Failed to send events to Supabase', err);
      }
    }
  } else {
    // In local dev without Supabase configured, keep in memory for demo analytics dashboard
    if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('benix_local_analytics') || '[]');
        const updated = [...stored, ...eventsToSend].slice(-200); // keep last 200 events
        localStorage.setItem('benix_local_analytics', JSON.stringify(updated));
      } catch {}
    }
  }
}

export function trackEvent({ eventType, calculatorId, pagePath, metadata }: TrackEventParams) {
  if (typeof window === 'undefined') return;

  const env = getClientEnvironment();
  const sessionId = getAnonymousSessionId();
  const path = pagePath || window.location.pathname;

  const eventPayload = {
    event_type: eventType,
    calculator_id: calculatorId || null,
    page_path: path,
    session_id: sessionId,
    device_type: env.deviceType,
    browser: env.browser,
    os: env.os,
    referrer: env.referrer,
    landing_page: window.location.href,
    metadata: metadata || {},
    created_at: new Date().toISOString(),
  };

  eventQueue.push(eventPayload);

  if (!flushTimeout) {
    flushTimeout = setTimeout(flushEvents, 1500);
  }
}

export interface AdminAnalyticsData {
  visitors: number;
  pageviews: number;
  calculations: number;
  conversion_rate: number;
  top_calculator_name: string;
  top_calculators: Array<{
    calculator_id: string;
    name: string;
    views: number;
    uses: number;
    rate: string;
  }>;
  device_distribution: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  trajectory: Array<{
    label: string;
    visitors: number;
    calculations: number;
  }>;
  period_days: number;
  updated_at: string;
}

export async function fetchAdminAnalytics(
  period: 'today' | '7d' | '30d' | 'all' = '30d'
): Promise<AdminAnalyticsData | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const daysMap: Record<string, number> = {
    today: 1,
    '7d': 7,
    '30d': 30,
    all: -1,
  };

  const days = daysMap[period] ?? 30;

  try {
    const { data, error } = await supabase.rpc('get_admin_analytics', { p_days: days });

    if (error) {
      console.warn('[Analytics] RPC get_admin_analytics error:', error.message);
      return null;
    }

    return data as AdminAnalyticsData;
  } catch (err) {
    console.error('[Analytics] Failed to fetch admin analytics:', err);
    return null;
  }
}

