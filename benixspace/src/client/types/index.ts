export interface Project {
  id: number;
  name: string;
  slug: string;
  url: string;
  short_description: string;
  full_description?: string;
  image_url: string;
  gallery_images?: string | string[];
  category: string;
  tags?: string | string[];
  technologies?: string | string[];
  status: 'published' | 'draft';
  featured: boolean;
  embed_mode: 'external' | 'embed' | 'both';
  sort_order: number;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  og_image_url?: string;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  featured_image_url: string;
  category: string;
  tags?: string | string[];
  author_name: string;
  status: 'published' | 'draft' | 'pending_review';
  published_at?: string;
  views_count?: number;
  comments_count?: number;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  canonical_url?: string;
  og_image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ArticleComment {
  id: string;
  article_id: number;
  parent_id?: string | null;
  author_name: string;
  content: string;
  likes_count: number;
  status: 'approved' | 'hidden' | 'flagged';
  is_admin_reply?: boolean;
  user_ip?: string;
  created_at: string;
  replies?: ArticleComment[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  type: string;
  description?: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface CompanySettings {
  company_name: string;
  company_description: string;
  history: string;
  founder_name: string;
  founder_bio: string;
  email: string;
  phone: string;
  address: string;
  services_json: string;
}

export interface SocialLink {
  id?: number;
  platform: string;
  handle: string;
  custom_url: string;
  sort_order: number;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface SeoScoreResult {
  score: number;
  suggestions: { text: string; passed: boolean }[];
  titleLength: number;
  descLength: number;
  wordCount: number;
}
