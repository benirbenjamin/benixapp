-- PostgreSQL DDL Schema for BenixSpace Platform

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  type VARCHAR(50) DEFAULT 'general',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  url VARCHAR(500) NOT NULL,
  short_description TEXT NOT NULL,
  full_description TEXT,
  image_url VARCHAR(500),
  gallery_images TEXT,
  category VARCHAR(100) DEFAULT 'Web Application',
  tags TEXT,
  technologies TEXT,
  status VARCHAR(50) DEFAULT 'published',
  featured BOOLEAN DEFAULT false,
  embed_mode VARCHAR(50) DEFAULT 'both',
  sort_order INT DEFAULT 0,
  seo_title VARCHAR(255),
  seo_description TEXT,
  seo_keywords TEXT,
  og_image_url VARCHAR(500),
  published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS articles (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  featured_image_url VARCHAR(500),
  category VARCHAR(100) DEFAULT 'Technology',
  tags TEXT,
  author_name VARCHAR(100) DEFAULT 'Benir Benjamin',
  author_id INT REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'published',
  published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  views_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  seo_title VARCHAR(255),
  seo_description TEXT,
  seo_keywords TEXT,
  canonical_url VARCHAR(500),
  og_image_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS article_comments (
  id VARCHAR(255) PRIMARY KEY,
  article_id INT NOT NULL,
  parent_id VARCHAR(255),
  author_name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  likes_count INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'approved',
  is_admin_reply BOOLEAN DEFAULT false,
  user_ip VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS banned_ips (
  ip VARCHAR(100) PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  page_url VARCHAR(500) NOT NULL,
  page_type VARCHAR(50),
  project_id INT REFERENCES projects(id) ON DELETE SET NULL,
  article_id INT REFERENCES articles(id) ON DELETE SET NULL,
  referrer VARCHAR(500),
  user_agent VARCHAR(500),
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Unknown',
  region VARCHAR(100),
  session_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  ip_address VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS company_settings (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(255) DEFAULT 'NebeluRw Co. Ltd',
  company_description TEXT,
  history TEXT,
  founder_name VARCHAR(255) DEFAULT 'Benir Benjamin',
  founder_bio TEXT,
  email VARCHAR(255) DEFAULT 'benirabok@gmail.com',
  phone VARCHAR(100) DEFAULT '0783987223',
  address VARCHAR(255) DEFAULT 'Kigali, Rwanda',
  services_json TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS social_links (
  id SERIAL PRIMARY KEY,
  platform VARCHAR(100) NOT NULL,
  handle VARCHAR(255) NOT NULL,
  custom_url VARCHAR(500),
  sort_order INT DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_comments_article ON article_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_project_id ON analytics_events(project_id);
