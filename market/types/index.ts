export type UserRole = 
  | 'USER'
  | 'CREATOR'
  | 'ARTIST'
  | 'PROVIDER'
  | 'AFFILIATE'
  | 'CONTENT_MODERATOR'
  | 'FINANCE_ADMIN'
  | 'SUPPORT_AGENT'
  | 'MODERATOR'
  | 'ADMIN'
  | 'SUPER_ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: UserRole;
  avatar?: string | null;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  referralCode: string;
  referredById?: string | null;
}

export interface SiteSettings {
  app_name: string;
  app_tagline: string;
  logo_url: string;
  favicon_url: string;
  brand_primary: string;
  brand_primary_hover: string;
  brand_accent: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  social_facebook?: string;
  social_twitter?: string;
  social_instagram?: string;
  social_youtube?: string;
  social_linkedin?: string;
  social_tiktok?: string;
  social_whatsapp?: string;
  currency: string;
  commission_rate: string;
  flutterwave_enabled: string;
  flutterwave_public_key: string;
  flutterwave_secret_key: string;
  flutterwave_encryption_key: string;
  manual_payment_enabled: string;
  manual_payment_instructions: string;
  manual_payment_account_name: string;
  manual_payment_account_number: string;
  storage_provider: string; // VERCEL_BLOB, AWS_S3, CLOUDFLARE_R2, GOOGLE_DRIVE
  maintenance_mode: string;
  two_factor_enabled?: string;
  email_verification_enabled?: string;
  resend_api_key?: string;
  email_from?: string;
  referral_system_enabled?: string; // "true" | "false"
  multilevel_referral_enabled?: string; // "true" | "false"
  referral_commission_rate?: string; // percentage, e.g. "5"
  multilevel_level2_rate?: string; // percentage, e.g. "3"
  multilevel_level3_rate?: string; // percentage, e.g. "1"
  google_drive_accounts?: string; // JSON string of account pool
  google_drive_auto_failover?: string; // "true" | "false"
  ads_enabled?: string; // "true" | "false"
  adsense_client_id?: string; // e.g. "ca-pub-4078466828008985"
  adsense_slot_id?: string; // e.g. "7034214536"
  monetization_min_subscribers?: string; // e.g. "30"
  monetization_min_watch_hours?: string; // e.g. "300"
  ad_reward_view_rwf?: string; // e.g. "3"
  ad_reward_click_rwf?: string; // e.g. "4"
  ad_initial_delay_seconds?: string; // e.g. "15"
  ad_interval_seconds?: string; // e.g. "300"
  ad_duration_seconds?: string; // e.g. "12"
  ad_skip_delay_seconds?: string; // e.g. "8"
}

export interface VideoItem {
  id: string;
  title: string;
  slug?: string;
  description?: string | null;
  videoUrl: string;
  thumbnailUrl?: string | null;
  duration: number;
  accessType?: 'PUBLIC' | 'PRIVATE' | 'PREMIUM';
  accessLevel?: 'ALL' | 'MEMBERS' | 'PREMIUM';
  price?: number;
  views: number;
  likes: number;
  dislikes?: number;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  isFeatured?: boolean;
  channelId?: string;
  createdAt: string | Date;
  channel: {
    id: string;
    name: string;
    handle: string;
    avatar?: string | null;
    subscriberCount: number;
    isVerified?: boolean;
    [key: string]: any;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  [key: string]: any;
}

export interface ServiceItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  priceType: 'FIXED' | 'HOURLY' | 'STARTING_AT';
  location: string;
  images: string[];
  packages?: any;
  availability?: any;
  rating: number;
  reviewCount: number;
  status: 'ACTIVE' | 'INACTIVE' | 'PAUSED';
  createdAt: string | Date;
  provider: {
    id: string;
    displayName: string;
    username: string;
    avatar?: string | null;
    phone?: string | null;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface ProductItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  images: string[];
  downloadUrl?: string | null;
  fileType?: string | null;
  fileSize?: string | null;
  salesCount: number;
  rating: number;
  seller: {
    id: string;
    displayName: string;
    username: string;
    avatar?: string | null;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}
