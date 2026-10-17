-- RBA Streaming Platform PostgreSQL Schema
-- Idempotent schema initialization (runs automatically when app deploys/starts)

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table (Super Admin and Admin)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'ADMIN' CHECK (role IN ('SUPER_ADMIN', 'ADMIN')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Stations Table (Radio and TV streams)
CREATE TABLE IF NOT EXISTS stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    stream_url TEXT NOT NULL,
    stream_type VARCHAR(50) NOT NULL DEFAULT 'AUDIO' CHECK (stream_type IN ('AUDIO', 'HLS', 'VIDEO')),
    station_type VARCHAR(50) NOT NULL DEFAULT 'RADIO' CHECK (station_type IN ('RADIO', 'TV')),
    location VARCHAR(255),
    frequency VARCHAR(50),
    accent_color VARCHAR(50) DEFAULT '#0284c7',
    status VARCHAR(50) NOT NULL DEFAULT 'ONLINE' CHECK (status IN ('ONLINE', 'OFFLINE', 'ERROR', 'UNKNOWN')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    display_order INT NOT NULL DEFAULT 0,
    last_checked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Categories Table (News, Rwanda, Sports, Entertainment, International, etc.)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Videos Table (Embedded YouTube / external videos)
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    original_url TEXT NOT NULL,
    embed_url TEXT NOT NULL,
    platform VARCHAR(50) NOT NULL DEFAULT 'youtube',
    video_id VARCHAR(100),
    thumbnail_url TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    publication_date DATE NOT NULL DEFAULT CURRENT_DATE,
    views_count INT NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Anonymous Visitors Table
CREATE TABLE IF NOT EXISTS visitors (
    id VARCHAR(100) PRIMARY KEY,
    first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Rwanda'
);

-- Visitor Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(100) PRIMARY KEY,
    visitor_id VARCHAR(100) REFERENCES visitors(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    referrer TEXT,
    traffic_source VARCHAR(50) DEFAULT 'Direct'
);

-- Page Views Table
CREATE TABLE IF NOT EXISTS page_views (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(100) REFERENCES sessions(id) ON DELETE CASCADE,
    visitor_id VARCHAR(100) REFERENCES visitors(id) ON DELETE CASCADE,
    page_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Media Events Table (Play, stop, heartbeats)
CREATE TABLE IF NOT EXISTS media_events (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('PAGE_VIEW', 'RADIO_PLAY', 'RADIO_STOP', 'TV_PLAY', 'VIDEO_PLAY', 'VIDEO_VIEW')),
    station_id UUID REFERENCES stations(id) ON DELETE SET NULL,
    video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
    session_id VARCHAR(100) REFERENCES sessions(id) ON DELETE CASCADE,
    visitor_id VARCHAR(100) REFERENCES visitors(id) ON DELETE CASCADE,
    page_url TEXT,
    device_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Site Settings Table
CREATE TABLE IF NOT EXISTS site_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Comments Table (Station-specific Live TV comments & threaded replies)
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID REFERENCES stations(id) ON DELETE CASCADE,
    station_slug VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    author_name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    likes_count INT NOT NULL DEFAULT 0,
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(50) NOT NULL DEFAULT 'APPROVED' CHECK (status IN ('APPROVED', 'PENDING', 'FLAGGED', 'HIDDEN', 'REJECTED')),
    flagged_reason TEXT,
    author_fingerprint VARCHAR(255),
    ip_address VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Banned Commenters Table (Admin ban management)
CREATE TABLE IF NOT EXISTS banned_commenters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) NOT NULL,
    identifier_type VARCHAR(50) NOT NULL DEFAULT 'fingerprint' CHECK (identifier_type IN ('fingerprint', 'ip', 'author_name')),
    author_name VARCHAR(100),
    reason TEXT,
    banned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stations_active ON stations (is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_stations_slug ON stations (slug);
CREATE INDEX IF NOT EXISTS idx_videos_published ON videos (is_published, publication_date DESC);
CREATE INDEX IF NOT EXISTS idx_videos_category ON videos (category_id);
CREATE INDEX IF NOT EXISTS idx_videos_slug ON videos (slug);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views (created_at);
CREATE INDEX IF NOT EXISTS idx_media_events_created_at ON media_events (created_at);
CREATE INDEX IF NOT EXISTS idx_media_events_type ON media_events (event_type);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions (started_at);
CREATE INDEX IF NOT EXISTS idx_comments_station ON comments (station_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments (parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments (status, is_hidden);
CREATE INDEX IF NOT EXISTS idx_banned_identifier ON banned_commenters (identifier);

-- Donations Table (Buy Me a Coffee with Flutterwave)
CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tx_ref VARCHAR(255) UNIQUE NOT NULL,
    flw_ref VARCHAR(255),
    transaction_id VARCHAR(255),
    donor_name VARCHAR(100) NOT NULL DEFAULT 'Supporter',
    donor_email VARCHAR(255) NOT NULL,
    donor_phone VARCHAR(50),
    currency VARCHAR(10) NOT NULL DEFAULT 'RWF',
    amount NUMERIC(12, 2) NOT NULL,
    coffee_cups INT NOT NULL DEFAULT 1,
    message TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESSFUL', 'FAILED', 'CANCELLED')),
    payment_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Feedback Messages Table (User inquiries & feedback submitted via /contact and footer)
CREATE TABLE IF NOT EXISTS feedback_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'UNREAD' CHECK (status IN ('UNREAD', 'READ', 'ARCHIVED')),
    ip_address VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback_messages (status, created_at DESC);


