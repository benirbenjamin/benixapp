export type StationType = 'RADIO' | 'TV';
export type StreamType = 'AUDIO' | 'HLS' | 'VIDEO';
export type StationStatus = 'ONLINE' | 'OFFLINE' | 'ERROR' | 'UNKNOWN';

export interface Station {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  stream_url: string;
  stream_type: StreamType;
  station_type: StationType;
  location?: string;
  frequency?: string;
  accent_color?: string;
  status: StationStatus;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  last_checked_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  display_order: number;
  video_count?: number;
}

export interface Video {
  id: string;
  title: string;
  slug: string;
  description: string;
  original_url: string;
  embed_url: string;
  platform: string;
  video_id?: string;
  thumbnail_url?: string;
  category_id?: string;
  category_name?: string;
  category_slug?: string;
  publication_date: string;
  views_count: number;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
  is_active: boolean;
  created_at: string;
}

export interface SiteSettings {
  site_name: string;
  site_description: string;
  logo_url: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  facebook_url: string;
  twitter_url: string;
  youtube_url: string;
  instagram_url: string;
  footer_text: string;
}

export interface AnalyticsOverview {
  totalVisitors: number;
  visitorsToday: number;
  visitorsYesterday: number;
  visitorsThisWeek: number;
  visitorsThisMonth: number;
  visitorsThisYear: number;
  radioPlaysToday: number;
  tvPlaysToday: number;
  videoViewsToday: number;
  totalPageViews: number;
}

export interface TimeseriesPoint {
  date_label: string;
  page_views: number;
  radio_plays: number;
  tv_plays: number;
  video_views: number;
}

export interface NameValueMetric {
  name: string;
  value: number;
}

export interface TopStationMetric {
  id: string;
  name: string;
  logo_url: string;
  frequency?: string;
  plays: number;
}

export interface TopVideoMetric {
  id: string;
  title: string;
  thumbnail_url?: string;
  views_count: number;
  recent_plays: number;
}

export interface AnalyticsChartsData {
  timeseries: TimeseriesPoint[];
  trafficSources: NameValueMetric[];
  devices: NameValueMetric[];
  browsers: NameValueMetric[];
  operatingSystems: NameValueMetric[];
  topStations: TopStationMetric[];
  topVideos: TopVideoMetric[];
}

export interface Comment {
  id: string;
  station_id?: string;
  station_slug: string;
  parent_id?: string | null;
  author_name: string;
  content: string;
  likes_count: number;
  created_at: string;
  replies?: Comment[];
}

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  cupPrice: number;
  flag: string;
  country: string;
}

export interface Donation {
  id?: string;
  tx_ref: string;
  flw_ref?: string;
  transaction_id?: string;
  donor_name: string;
  donor_email: string;
  donor_phone?: string;
  currency: string;
  amount: number;
  coffee_cups: number;
  message?: string;
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'CANCELLED';
  payment_type?: string;
  created_at?: string;
}

export interface Supporter {
  donor_name: string;
  donor_email?: string;
  donor_phone?: string;
  currency: string;
  amount: number;
  coffee_cups: number;
  message?: string;
  created_at: string;
}

export interface DonationConfig {
  public_key: string;
  currencies: CurrencyOption[];
  merchant_name: string;
  title: string;
  description: string;
}

export interface FeedbackMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'UNREAD' | 'READ' | 'ARCHIVED';
  ip_address?: string;
  created_at: string;
}

export interface CustomAd {
  id: string;
  title: string;
  sponsor_name: string;
  owner_phone: string;
  category: string;
  tagline?: string;
  description?: string;
  cta_text: string;
  cta_url: string;
  media_type: 'IMAGE' | 'GRADIENT' | 'VIDEO';
  banner_url?: string;
  bg_gradient?: string;
  accent_color?: string;
  badge_text?: string;
  status: 'ACTIVE' | 'PAUSED' | 'EXPIRED';
  start_date?: string;
  end_date?: string;
  impressions_count: number;
  clicks_count: number;
  share_token?: string;
  token_expires_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface AdSettings {
  whatsapp_number: string;
  google_ads_per_custom_ad: number;
  enable_custom_ads: boolean;
  enable_google_adsense: boolean;
  default_share_expiry_hours: number;
  radio_ad_interval_seconds: number;
  radio_ad_countdown_seconds: number;
  tv_ad_initial_delay_seconds: number;
  tv_ad_interval_seconds: number;
  tv_ad_countdown_seconds: number;
}

