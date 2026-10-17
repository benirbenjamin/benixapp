import {
  Station,
  Video,
  Category,
  User,
  SiteSettings,
  AnalyticsOverview,
  AnalyticsChartsData,
  DonationConfig,
  Donation,
  Supporter,
  FeedbackMessage,
  CustomAd,
  AdSettings,
} from '../types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('rba_admin_token');
  const visitorId = localStorage.getItem('rba_visitor_id') || '';
  const sessionId = sessionStorage.getItem('rba_session_id') || '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-visitor-id': visitorId,
    'x-session-id': sessionId,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Safely parses JSON responses from fetch calls.
 * Checks content-type headers and HTTP status to prevent SyntaxError crashes when servers return HTML (e.g. 504 Gateway Timeout, 404 SPA fallback, etc.).
 */
export async function parseJsonResponse<T = any>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!isJson) {
    if (res.status === 504 || res.status === 502 || res.status === 503) {
      throw new Error('Server connection timed out. Please check your internet connection and try again.');
    }
    if (res.status === 404) {
      throw new Error('Requested resource or endpoint was not found.');
    }
    if (!res.ok) {
      throw new Error(`Server returned error status (${res.status}). Please try again.`);
    }
    throw new Error('Server returned a non-JSON response. Please check your internet connection.');
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error('Unable to parse server response. Please try again.');
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Request failed with status ${res.status}`);
  }

  return data as T;
}

// Stations API
export async function getStations(params?: { type?: string; featured?: boolean; include_inactive?: boolean }): Promise<Station[]> {
  const query = new URLSearchParams();
  if (params?.type) query.append('type', params.type);
  if (params?.featured) query.append('featured', 'true');
  if (params?.include_inactive) query.append('include_inactive', 'true');

  const res = await fetch(`${API_BASE}/stations?${query.toString()}`, {
    headers: getAuthHeaders(),
  });
  return parseJsonResponse<Station[]>(res);
}

export async function getStationBySlug(slug: string): Promise<Station> {
  const res = await fetch(`${API_BASE}/stations/${encodeURIComponent(slug)}`, {
    headers: getAuthHeaders(),
  });
  return parseJsonResponse<Station>(res);
}

export async function createStation(data: Partial<Station>): Promise<Station> {
  const res = await fetch(`${API_BASE}/stations`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return parseJsonResponse<Station>(res);
}

export async function updateStation(id: string, data: Partial<Station>): Promise<Station> {
  const res = await fetch(`${API_BASE}/stations/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return parseJsonResponse<Station>(res);
}

export async function deleteStation(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/stations/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    await parseJsonResponse(res);
  }
}

export async function testStreamDiagnostic(url: string) {
  const res = await fetch(`${API_BASE}/stations/test-url`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ url }),
  });
  return parseJsonResponse(res);
}

// Videos API
export async function getVideos(params?: {
  category?: string;
  featured?: boolean;
  q?: string;
  page?: number;
  limit?: number;
  include_unpublished?: boolean;
}): Promise<{ data: Video[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const query = new URLSearchParams();
  if (params?.category) query.append('category', params.category);
  if (params?.featured) query.append('featured', 'true');
  if (params?.q) query.append('q', params.q);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.include_unpublished) query.append('include_unpublished', 'true');

  const res = await fetch(`${API_BASE}/videos?${query.toString()}`, {
    headers: getAuthHeaders(),
  });
  return parseJsonResponse(res);
}

export async function getVideoDetail(idOrSlug: string): Promise<{ video: Video; relatedVideos: Video[] }> {
  const res = await fetch(`${API_BASE}/videos/${encodeURIComponent(idOrSlug)}`, {
    headers: getAuthHeaders(),
  });
  return parseJsonResponse(res);
}

export async function createVideo(data: Partial<Video>): Promise<Video> {
  const res = await fetch(`${API_BASE}/videos`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return parseJsonResponse<Video>(res);
}

export async function updateVideo(id: string, data: Partial<Video>): Promise<Video> {
  const res = await fetch(`${API_BASE}/videos/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return parseJsonResponse<Video>(res);
}

export async function deleteVideo(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/videos/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    await parseJsonResponse(res);
  }
}

// Categories API
export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/categories`, {
    headers: getAuthHeaders(),
  });
  return parseJsonResponse<Category[]>(res);
}

// Analytics API
export async function trackEvent(event: {
  event_type: 'PAGE_VIEW' | 'RADIO_PLAY' | 'RADIO_STOP' | 'TV_PLAY' | 'VIDEO_PLAY' | 'VIDEO_VIEW';
  station_id?: string;
  video_id?: string;
  page_url?: string;
  referrer?: string;
}) {
  const visitorId = localStorage.getItem('rba_visitor_id') || '';
  const sessionId = sessionStorage.getItem('rba_session_id') || '';

  try {
    await fetch(`${API_BASE}/analytics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...event,
        visitor_id: visitorId,
        session_id: sessionId,
        referrer: event.referrer || document.referrer || '',
        page_url: event.page_url || window.location.href,
      }),
    });
  } catch (e) {
    // Fail silently in client
  }
}

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const res = await fetch(`${API_BASE}/analytics/overview`, {
    headers: getAuthHeaders(),
  });
  return parseJsonResponse<AnalyticsOverview>(res);
}

export async function getAnalyticsCharts(range: string = '7d', startDate?: string, endDate?: string): Promise<AnalyticsChartsData> {
  const query = new URLSearchParams({ range });
  if (startDate) query.append('startDate', startDate);
  if (endDate) query.append('endDate', endDate);

  const res = await fetch(`${API_BASE}/analytics/charts?${query.toString()}`, {
    headers: getAuthHeaders(),
  });
  return parseJsonResponse<AnalyticsChartsData>(res);
}

// Users API (Super Admin)
export async function getUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/admin/users`, {
    headers: getAuthHeaders(),
  });
  return parseJsonResponse<User[]>(res);
}

export async function createUser(data: { email: string; full_name: string; password: string; role: string }): Promise<User> {
  const res = await fetch(`${API_BASE}/admin/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return parseJsonResponse<User>(res);
}

export async function updateUser(id: string, data: Partial<User & { password?: string }>): Promise<User> {
  const res = await fetch(`${API_BASE}/admin/users/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return parseJsonResponse<User>(res);
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/users/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    await parseJsonResponse(res);
  }
}

// Settings API
export async function getSettings(): Promise<SiteSettings> {
  const res = await fetch(`${API_BASE}/settings`);
  return parseJsonResponse<SiteSettings>(res);
}

export async function updateSettings(data: SiteSettings): Promise<void> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    await parseJsonResponse(res);
  }
}

// Global Search
export async function globalSearch(q: string) {
  const res = await fetch(`${API_BASE}/settings/search/all?q=${encodeURIComponent(q)}`);
  return parseJsonResponse(res);
}

// Donations API (Buy Me a Coffee)
export async function getDonationConfig(): Promise<DonationConfig> {
  const res = await fetch(`${API_BASE}/donations/config`);
  return parseJsonResponse<DonationConfig>(res);
}

export async function initializeDonation(data: {
  donor_name?: string;
  donor_email: string;
  donor_phone?: string;
  currency: string;
  amount: number;
  coffee_cups: number;
  message?: string;
}): Promise<{ success: boolean; donation: Donation; tx_ref: string; public_key: string }> {
  const res = await fetch(`${API_BASE}/donations/initialize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return parseJsonResponse(res);
}

export async function verifyDonation(data: {
  tx_ref: string;
  transaction_id?: string;
  status?: string;
  flw_ref?: string;
  payment_type?: string;
}): Promise<{ success: boolean; donation: Donation }> {
  const res = await fetch(`${API_BASE}/donations/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return parseJsonResponse(res);
}

export async function getRecentSupporters(): Promise<{
  supporters: Supporter[];
  stats: { total_donations: number; total_cups: number };
}> {
  const res = await fetch(`${API_BASE}/donations/recent`);
  return parseJsonResponse(res);
}

export async function getAdminDonations(): Promise<{
  donations: Donation[];
  summary: { successful_count: number; pending_count: number; total_cups: number };
  revenue_by_currency: Array<{ currency: string; total_amount: string | number; count: string | number }>;
}> {
  const res = await fetch(`${API_BASE}/donations/admin`, {
    headers: getAuthHeaders(),
  });
  return parseJsonResponse(res);
}

// Feedback & Contact API
export async function submitFeedback(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<{ success: boolean; data: FeedbackMessage }> {
  const res = await fetch(`${API_BASE}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return parseJsonResponse(res);
}

export async function getAdminFeedback(params?: { status?: string; q?: string }): Promise<{
  messages: FeedbackMessage[];
  stats: { total: number; unread: number; read: number; archived: number };
}> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.q) query.append('q', params.q);

  const res = await fetch(`${API_BASE}/feedback/admin?${query.toString()}`, {
    headers: getAuthHeaders(),
  });
  return parseJsonResponse(res);
}

export async function updateFeedbackStatus(
  id: string,
  status: 'UNREAD' | 'READ' | 'ARCHIVED'
): Promise<{ success: boolean; message: FeedbackMessage }> {
  const res = await fetch(`${API_BASE}/feedback/admin/${id}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  return parseJsonResponse(res);
}

export async function deleteFeedbackMessage(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/feedback/admin/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    await parseJsonResponse(res);
  }
}

// Custom Ads API Functions
export async function getPublicAds(): Promise<{ settings: AdSettings; ads: CustomAd[] }> {
  try {
    const res = await fetch(`${API_BASE}/ads`);
    if (res.ok) {
      const data = await parseJsonResponse(res);
      return {
        settings: data.settings,
        ads: data.ads || [],
      };
    }
  } catch (e) {
    // Ignore and fallback to local storage
  }

  // Fallback to localStorage if API unreachable
  const storedAds = localStorage.getItem('rba_custom_ads');
  const storedSettings = localStorage.getItem('rba_ad_settings');

  const defaultSettings: AdSettings = {
    whatsapp_number: '+250783987223',
    google_ads_per_custom_ad: 2,
    enable_custom_ads: true,
    enable_google_adsense: true,
    default_share_expiry_hours: 168,
    radio_ad_interval_seconds: 240,
    radio_ad_countdown_seconds: 10,
    tv_ad_initial_delay_seconds: 60,
    tv_ad_interval_seconds: 300,
    tv_ad_countdown_seconds: 10,
  };

  return {
    settings: storedSettings ? { ...defaultSettings, ...JSON.parse(storedSettings) } : defaultSettings,
    ads: storedAds ? JSON.parse(storedAds) : [],
  };
}

export async function recordAdEvent(adId: string, eventType: 'IMPRESSION' | 'CLICK'): Promise<void> {
  try {
    await fetch(`${API_BASE}/ads/${adId}/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: eventType }),
    });
  } catch (e) {
    // Ignore error
  }
}

export async function getPublicAdAnalyticsByToken(token: string): Promise<{
  ad: CustomAd;
  timeseries: Array<{ date_label: string; impressions: number; clicks: number }>;
}> {
  const res = await fetch(`${API_BASE}/ads/public-analytics/${token}`);
  return parseJsonResponse(res);
}

export async function getAdminAds(): Promise<{ ads: CustomAd[]; settings: AdSettings }> {
  try {
    const res = await fetch(`${API_BASE}/ads/admin`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      return await parseJsonResponse(res);
    }
  } catch (e) {
    // Fallback to localStorage
  }

  const storedAds = localStorage.getItem('rba_custom_ads');
  const storedSettings = localStorage.getItem('rba_ad_settings');

  const defaultSettings: AdSettings = {
    whatsapp_number: '+250783987223',
    google_ads_per_custom_ad: 2,
    enable_custom_ads: true,
    enable_google_adsense: true,
    default_share_expiry_hours: 168,
    radio_ad_interval_seconds: 240,
    radio_ad_countdown_seconds: 10,
    tv_ad_initial_delay_seconds: 60,
    tv_ad_interval_seconds: 300,
    tv_ad_countdown_seconds: 10,
  };

  return {
    ads: storedAds ? JSON.parse(storedAds) : [],
    settings: storedSettings ? { ...defaultSettings, ...JSON.parse(storedSettings) } : defaultSettings,
  };
}

export async function createCustomAd(data: Partial<CustomAd> & { expiry_hours?: number }): Promise<{ success: boolean; ad: CustomAd }> {
  try {
    const res = await fetch(`${API_BASE}/ads/admin`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (res.ok) {
      return await parseJsonResponse(res);
    }
  } catch (e) {
    // Fallback to localStorage
  }

  const storedAds = localStorage.getItem('rba_custom_ads');
  const adsList: CustomAd[] = storedAds ? JSON.parse(storedAds) : [];

  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const expiryHours = data.expiry_hours || 168;

  const newAd: CustomAd = {
    id: 'ad-' + Date.now(),
    title: data.title || 'Untitled Ad',
    sponsor_name: data.sponsor_name || 'Sponsor',
    owner_phone: data.owner_phone || '+250783987223',
    category: data.category || 'General',
    tagline: data.tagline || '',
    description: data.description || '',
    cta_text: data.cta_text || 'Learn More',
    cta_url: data.cta_url || '#',
    media_type: data.media_type || 'IMAGE',
    banner_url: data.banner_url || '',
    bg_gradient: data.bg_gradient || 'from-blue-900 via-blue-800 to-slate-900',
    accent_color: data.accent_color || '#0284c7',
    badge_text: data.badge_text || 'Sponsored',
    status: data.status || 'ACTIVE',
    start_date: data.start_date || new Date().toISOString(),
    end_date: data.end_date,
    impressions_count: 0,
    clicks_count: 0,
    share_token: token,
    token_expires_at: new Date(Date.now() + expiryHours * 3600 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  };

  adsList.unshift(newAd);
  localStorage.setItem('rba_custom_ads', JSON.stringify(adsList));

  return { success: true, ad: newAd };
}

export async function updateCustomAd(id: string, data: Partial<CustomAd>): Promise<{ success: boolean; ad: CustomAd }> {
  try {
    const res = await fetch(`${API_BASE}/ads/admin/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (res.ok) {
      return await parseJsonResponse(res);
    }
  } catch (e) {
    // Fallback to localStorage
  }

  const storedAds = localStorage.getItem('rba_custom_ads');
  let adsList: CustomAd[] = storedAds ? JSON.parse(storedAds) : [];

  let updatedAd: CustomAd | null = null;
  adsList = adsList.map((item) => {
    if (item.id === id) {
      updatedAd = { ...item, ...data, updated_at: new Date().toISOString() };
      return updatedAd;
    }
    return item;
  });

  localStorage.setItem('rba_custom_ads', JSON.stringify(adsList));
  return { success: true, ad: updatedAd! };
}

export async function manageShareToken(
  id: string,
  data: { expiry_hours?: number; revoke?: boolean }
): Promise<{ success: boolean; ad: CustomAd }> {
  try {
    const res = await fetch(`${API_BASE}/ads/admin/${id}/share-token`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (res.ok) {
      return await parseJsonResponse(res);
    }
  } catch (e) {
    // Fallback
  }

  const storedAds = localStorage.getItem('rba_custom_ads');
  let adsList: CustomAd[] = storedAds ? JSON.parse(storedAds) : [];

  let updatedAd: CustomAd | null = null;
  adsList = adsList.map((item) => {
    if (item.id === id) {
      if (data.revoke) {
        updatedAd = { ...item, share_token: undefined, token_expires_at: new Date().toISOString() };
      } else {
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const hours = data.expiry_hours || 168;
        updatedAd = {
          ...item,
          share_token: token,
          token_expires_at: new Date(Date.now() + hours * 3600 * 1000).toISOString(),
        };
      }
      return updatedAd;
    }
    return item;
  });

  localStorage.setItem('rba_custom_ads', JSON.stringify(adsList));
  return { success: true, ad: updatedAd! };
}

export async function deleteCustomAd(id: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/ads/admin/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (res.ok) return;
  } catch (e) {
    // Fallback
  }

  const storedAds = localStorage.getItem('rba_custom_ads');
  if (storedAds) {
    const adsList: CustomAd[] = JSON.parse(storedAds);
    const filtered = adsList.filter((item) => item.id !== id);
    localStorage.setItem('rba_custom_ads', JSON.stringify(filtered));
  }
}

export async function saveAdSettings(settings: Partial<AdSettings>): Promise<{ success: boolean; settings: AdSettings }> {
  try {
    const res = await fetch(`${API_BASE}/ads/admin/settings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      return await parseJsonResponse(res);
    }
  } catch (e) {
    // Fallback
  }

  const storedSettings = localStorage.getItem('rba_ad_settings');
  const defaultSettings: AdSettings = {
    whatsapp_number: '+250783987223',
    google_ads_per_custom_ad: 2,
    enable_custom_ads: true,
    enable_google_adsense: true,
    default_share_expiry_hours: 168,
    radio_ad_interval_seconds: 240,
    radio_ad_countdown_seconds: 10,
    tv_ad_initial_delay_seconds: 60,
    tv_ad_interval_seconds: 300,
    tv_ad_countdown_seconds: 10,
  };

  const updated = {
    ...defaultSettings,
    ...(storedSettings ? JSON.parse(storedSettings) : {}),
    ...settings,
  };

  localStorage.setItem('rba_ad_settings', JSON.stringify(updated));
  return { success: true, settings: updated };
}
