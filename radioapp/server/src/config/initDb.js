import { query } from './db.js';
import bcrypt from 'bcryptjs';

export async function initDatabase() {
  console.log('[DB] Ensuring database tables exist...');

  // Create Users
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      username VARCHAR(64) UNIQUE NOT NULL,
      email VARCHAR(128) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(32) NOT NULL,
      full_name VARCHAR(128),
      phone VARCHAR(64),
      email_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  try {
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(128);`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(64);`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;`);
  } catch (e) {
    // Handled
  }

  // Create Verification Codes Table (4-digit OTP)
  await query(`
    CREATE TABLE IF NOT EXISTS verification_codes (
      id VARCHAR(64) PRIMARY KEY,
      email VARCHAR(128) NOT NULL,
      code VARCHAR(8) NOT NULL,
      type VARCHAR(32) NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Radio Requests Table
  await query(`
    CREATE TABLE IF NOT EXISTS radio_requests (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      email VARCHAR(128) NOT NULL,
      full_name VARCHAR(128),
      phone VARCHAR(64),
      names VARCHAR(128),
      phonenumber VARCHAR(64),
      radio_name VARCHAR(128) NOT NULL,
      slogan VARCHAR(256),
      logo_url TEXT,
      radio_logo_link TEXT,
      description TEXT,
      stream_url TEXT,
      status VARCHAR(32) DEFAULT 'pending',
      station_id VARCHAR(64),
      admin_notes TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  try {
    await query(`ALTER TABLE radio_requests ADD COLUMN IF NOT EXISTS full_name VARCHAR(128);`);
    await query(`ALTER TABLE radio_requests ADD COLUMN IF NOT EXISTS phone VARCHAR(64);`);
    await query(`ALTER TABLE radio_requests ADD COLUMN IF NOT EXISTS names VARCHAR(128);`);
    await query(`ALTER TABLE radio_requests ADD COLUMN IF NOT EXISTS phonenumber VARCHAR(64);`);
    await query(`ALTER TABLE radio_requests ADD COLUMN IF NOT EXISTS logo_url TEXT;`);
    await query(`ALTER TABLE radio_requests ADD COLUMN IF NOT EXISTS radio_logo_link TEXT;`);
    await query(`ALTER TABLE radio_requests ADD COLUMN IF NOT EXISTS station_id VARCHAR(64);`);
    await query(`ALTER TABLE radio_requests ADD COLUMN IF NOT EXISTS admin_notes TEXT;`);
    await query(`ALTER TABLE radio_requests ALTER COLUMN full_name DROP NOT NULL;`);
    await query(`ALTER TABLE radio_requests ALTER COLUMN phone DROP NOT NULL;`);
  } catch (e) {
    // Handled
  }

  // Create In-App Notifications Table
  await query(`
    CREATE TABLE IF NOT EXISTS in_app_notifications (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64),
      title VARCHAR(256) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(64) DEFAULT 'request',
      link TEXT,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  try {
    await query(`ALTER TABLE in_app_notifications ADD COLUMN IF NOT EXISTS type VARCHAR(64) DEFAULT 'request';`);
    await query(`ALTER TABLE in_app_notifications ADD COLUMN IF NOT EXISTS link TEXT;`);
    await query(`ALTER TABLE in_app_notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;`);
    await query(`ALTER TABLE in_app_notifications ALTER COLUMN user_id DROP NOT NULL;`);
  } catch (e) {
    // Handled
  }

  // Create Radio Stations
  await query(`
    CREATE TABLE IF NOT EXISTS radio_stations (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(128) NOT NULL,
      slug VARCHAR(128) UNIQUE NOT NULL,
      slogan VARCHAR(256),
      description TEXT,
      status VARCHAR(32) DEFAULT 'active',
      is_default BOOLEAN DEFAULT FALSE,
      custom_domain VARCHAR(256) UNIQUE,
      custom_domain_verified BOOLEAN DEFAULT FALSE,
      custom_domain_updated_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  try {
    await query(`ALTER TABLE radio_stations ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(256);`);
    await query(`ALTER TABLE radio_stations ADD COLUMN IF NOT EXISTS custom_domain_verified BOOLEAN DEFAULT FALSE;`);
    await query(`ALTER TABLE radio_stations ADD COLUMN IF NOT EXISTS custom_domain_updated_at TIMESTAMPTZ;`);
  } catch (e) {
    // Handled
  }

  // Create Station Admins
  await query(`
    CREATE TABLE IF NOT EXISTS station_admins (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      station_id VARCHAR(64) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Station Branding
  await query(`
    CREATE TABLE IF NOT EXISTS station_branding (
      id VARCHAR(64) PRIMARY KEY,
      station_id VARCHAR(64) UNIQUE NOT NULL,
      theme VARCHAR(64) DEFAULT 'theme1_modern',
      logo_url TEXT,
      primary_color VARCHAR(32) DEFAULT '#4F46E5',
      secondary_color VARCHAR(32) DEFAULT '#06B6D4',
      accent_color VARCHAR(32) DEFAULT '#F59E0B',
      background_color VARCHAR(32) DEFAULT '#FFFFFF',
      surface_color VARCHAR(32) DEFAULT '#F8FAFC',
      text_color VARCHAR(32) DEFAULT '#0F172A',
      muted_color VARCHAR(32) DEFAULT '#64748B',
      header_color VARCHAR(32) DEFAULT '#FFFFFF',
      footer_color VARCHAR(32) DEFAULT '#0F172A',
      font_family VARCHAR(64) DEFAULT 'Inter',
      custom_font_url TEXT,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Radio Streams
  await query(`
    CREATE TABLE IF NOT EXISTS radio_streams (
      id VARCHAR(64) PRIMARY KEY,
      station_id VARCHAR(64) NOT NULL,
      name VARCHAR(128) NOT NULL,
      stream_url TEXT NOT NULL,
      description TEXT,
      is_default BOOLEAN DEFAULT FALSE,
      status VARCHAR(32) DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Programs
  await query(`
    CREATE TABLE IF NOT EXISTS programs (
      id VARCHAR(64) PRIMARY KEY,
      station_id VARCHAR(64) NOT NULL,
      title VARCHAR(128) NOT NULL,
      presenter VARCHAR(128) NOT NULL,
      description TEXT,
      image_url TEXT,
      days_of_week TEXT NOT NULL,
      start_time VARCHAR(10) NOT NULL,
      end_time VARCHAR(10) NOT NULL,
      status VARCHAR(32) DEFAULT 'active',
      show_on_homepage BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create News Categories
  await query(`
    CREATE TABLE IF NOT EXISTS news_categories (
      id VARCHAR(64) PRIMARY KEY,
      station_id VARCHAR(64) NOT NULL,
      name VARCHAR(128) NOT NULL,
      slug VARCHAR(128) NOT NULL
    );
  `);

  // Create News Articles
  await query(`
    CREATE TABLE IF NOT EXISTS news_articles (
      id VARCHAR(64) PRIMARY KEY,
      station_id VARCHAR(64) NOT NULL,
      category_id VARCHAR(64),
      title VARCHAR(256) NOT NULL,
      slug VARCHAR(256) NOT NULL,
      excerpt TEXT,
      content_html TEXT NOT NULL,
      image_url TEXT,
      youtube_url TEXT,
      status VARCHAR(32) DEFAULT 'published',
      views_count INT DEFAULT 0,
      published_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create YouTube Videos
  await query(`
    CREATE TABLE IF NOT EXISTS videos (
      id VARCHAR(64) PRIMARY KEY,
      station_id VARCHAR(64) NOT NULL,
      title VARCHAR(256) NOT NULL,
      youtube_url TEXT NOT NULL,
      video_id VARCHAR(64) NOT NULL,
      description TEXT,
      status VARCHAR(32) DEFAULT 'active',
      show_on_homepage BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Homepage Sections
  await query(`
    CREATE TABLE IF NOT EXISTS homepage_sections (
      id VARCHAR(64) PRIMARY KEY,
      station_id VARCHAR(64) UNIQUE NOT NULL,
      player_enabled BOOLEAN DEFAULT TRUE,
      on_air_enabled BOOLEAN DEFAULT TRUE,
      programs_enabled BOOLEAN DEFAULT TRUE,
      news_enabled BOOLEAN DEFAULT TRUE,
      videos_enabled BOOLEAN DEFAULT TRUE,
      about_enabled BOOLEAN DEFAULT TRUE,
      social_enabled BOOLEAN DEFAULT TRUE,
      contact_enabled BOOLEAN DEFAULT TRUE,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Station Settings
  await query(`
    CREATE TABLE IF NOT EXISTS station_settings (
      id VARCHAR(64) PRIMARY KEY,
      station_id VARCHAR(64) UNIQUE NOT NULL,
      phone VARCHAR(64),
      email VARCHAR(128),
      address TEXT,
      website VARCHAR(256),
      facebook VARCHAR(256),
      instagram VARCHAR(256),
      twitter VARCHAR(256),
      youtube VARCHAR(256),
      tiktok VARCHAR(256),
      whatsapp VARCHAR(64),
      copyright_text VARCHAR(256),
      timezone VARCHAR(64) DEFAULT 'Africa/Kigali',
      language VARCHAR(10) DEFAULT 'en',
      seo_title VARCHAR(256),
      seo_description TEXT,
      seo_keywords TEXT,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Analytics Events
  await query(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id VARCHAR(64) PRIMARY KEY,
      station_id VARCHAR(64) NOT NULL,
      event_type VARCHAR(64) NOT NULL,
      event_data TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Analytics Sessions (Tracks visitor traffic source and estimated time spent)
  await query(`
    CREATE TABLE IF NOT EXISTS analytics_sessions (
      id VARCHAR(64) PRIMARY KEY,
      station_id VARCHAR(64) NOT NULL,
      session_id VARCHAR(64) NOT NULL,
      traffic_source VARCHAR(128) DEFAULT 'Direct',
      referrer TEXT,
      device_type VARCHAR(32) DEFAULT 'Desktop',
      browser VARCHAR(64),
      os VARCHAR(64),
      page_path VARCHAR(256),
      duration_seconds INT DEFAULT 0,
      is_listening BOOLEAN DEFAULT FALSE,
      listening_seconds INT DEFAULT 0,
      pageviews_count INT DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Audit Logs
  await query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64),
      station_id VARCHAR(64),
      action VARCHAR(128) NOT NULL,
      details TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('[DB] Tables verified successfully.');

  // Auto-seed if database is empty
  await autoSeedIfEmpty();
}

async function autoSeedIfEmpty() {
  const check = await query(`SELECT COUNT(*) FROM users WHERE role = $1`, ['superadmin']);
  const count = parseInt(check.rows[0]?.count || 0);

  if (count > 0) {
    console.log('[DB] Database already initialized with users. Skipping seed.');
    return;
  }

  console.log('[DB] Database is empty. Seeding Super Admin and 3 distinct demo radio stations...');

  const defaultPasswordHash = await bcrypt.hash('Admin123!Password', 10);

  // 1. Seed Super Admin
  await query(`
    INSERT INTO users (id, username, email, password_hash, role)
    VALUES ($1, $2, $3, $4, $5)
  `, ['user-superadmin', 'superadmin', 'admin@benix.space', defaultPasswordHash, 'superadmin']);

  // 2. Seed Station 1 Admin: wave_admin
  await query(`
    INSERT INTO users (id, username, email, password_hash, role)
    VALUES ($1, $2, $3, $4, $5)
  `, ['user-wave-admin', 'wave_admin', 'admin@kigaliwave.fm', defaultPasswordHash, 'stationadmin']);

  // 3. Seed Station 2 Admin: summit_admin
  await query(`
    INSERT INTO users (id, username, email, password_hash, role)
    VALUES ($1, $2, $3, $4, $5)
  `, ['user-summit-admin', 'summit_admin', 'director@summitnews.fm', defaultPasswordHash, 'stationadmin']);

  // 4. Seed Station 3 Admin: pulse_admin
  await query(`
    INSERT INTO users (id, username, email, password_hash, role)
    VALUES ($1, $2, $3, $4, $5)
  `, ['user-pulse-admin', 'pulse_admin', 'admin@pulsebeat.fm', defaultPasswordHash, 'stationadmin']);

  // ==========================================
  // STATION 1: Kigali Wave 94.7 FM (Theme 1: Modern Radio)
  // ==========================================
  const s1Id = 'station-kigali-wave';
  await query(`
    INSERT INTO radio_stations (id, name, slug, slogan, description, status, is_default)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [
    s1Id,
    'Kigali Wave 94.7 FM',
    'kigali-wave',
    'Your Sound, Your Energy, Your Kigali',
    'Broadcasting the freshest Afrobeats, international top hits, vibrant talk shows, and urban culture live from Kigali, Rwanda.',
    'active',
    true
  ]);

  await query(`
    INSERT INTO station_admins (id, user_id, station_id)
    VALUES ($1, $2, $3)
  `, ['sa-1', 'user-wave-admin', s1Id]);

  await query(`
    INSERT INTO station_branding (
      id, station_id, theme, logo_url, primary_color, secondary_color, accent_color,
      background_color, surface_color, text_color, muted_color, header_color, footer_color,
      font_family
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  `, [
    'brand-1', s1Id, 'theme1_modern',
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=240&auto=format&fit=crop&q=80',
    '#4F46E5', '#06B6D4', '#F59E0B', '#FFFFFF', '#F8FAFC', '#0F172A', '#64748B', '#FFFFFF', '#0F172A',
    'Plus Jakarta Sans'
  ]);

  // Station 1 Streams
  await query(`
    INSERT INTO radio_streams (id, station_id, name, stream_url, description, is_default, status)
    VALUES 
    ($1, $2, $3, $4, $5, $6, $7),
    ($8, $9, $10, $11, $12, $13, $14)
  `, [
    'stream-1a', s1Id, 'Wave 94.7 FM (Main Live)', 'https://stream.zeno.fm/f3wvbbqmdg8uv', 'Studio Live High Quality 320kbps MP3 audio stream', true, 'active',
    'stream-1b', s1Id, 'Wave Afrobeats Chill', 'https://stream.zeno.fm/0r0xa792kwzuv', 'Non-stop acoustic Afrobeats and sunset vibes', false, 'active'
  ]);

  // Station 1 Programs
  await query(`
    INSERT INTO programs (id, station_id, title, presenter, description, image_url, days_of_week, start_time, end_time, status, show_on_homepage)
    VALUES
    ('prog-1a', $1, 'The Morning Rush', 'David & Sandrine', 'Energizing breakfast show with trending news, urban music, interactive listener calls, and daily entertainment bites.', 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&auto=format&fit=crop&q=80', '["Monday","Tuesday","Wednesday","Thursday","Friday"]', '06:00', '10:00', 'active', true),
    ('prog-1b', $1, 'Midday Wave Express', 'Cedric Kalisa', 'Your workday soundtrack featuring fresh hit music, celebrity interviews, and lifestyle discussions.', 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80', '["Monday","Tuesday","Wednesday","Thursday","Friday"]', '10:00', '14:00', 'active', true),
    ('prog-1c', $1, 'The Sunset Drive', 'Aline Uwamahoro', 'Cruising through the city evening rush hour with heavy Afrobeats, comedy segments, and traffic updates.', 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600&auto=format&fit=crop&q=80', '["Monday","Tuesday","Wednesday","Thursday","Friday"]', '14:00', '19:00', 'active', true),
    ('prog-1d', $1, 'Night Session & Club Beats', 'DJ Dash & DJ Phil', 'High-energy electronic beats, amapiano live sets, and exclusive weekend mixes.', 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?w=600&auto=format&fit=crop&q=80', '["Friday","Saturday"]', '20:00', '02:00', 'active', true)
  `, [s1Id]);

  // Station 1 Categories & News
  await query(`
    INSERT INTO news_categories (id, station_id, name, slug)
    VALUES
    ('cat-1a', $1, 'Music & Culture', 'music-culture'),
    ('cat-1b', $1, 'Entertainment', 'entertainment'),
    ('cat-1c', $1, 'Local Vibes', 'local-vibes')
  `, [s1Id]);

  await query(`
    INSERT INTO news_articles (id, station_id, category_id, title, slug, excerpt, content_html, image_url, status, views_count)
    VALUES
    ('art-1a', $1, 'cat-1a', 'Kigali Wave Music Awards 2026 Nominees Revealed', 'kigali-wave-music-awards-2026-nominees-revealed', 'The biggest night in East African urban sound is back. Check out the top nominees across all categories.', '<p>The stage is set for the most anticipated musical celebration in the region! Today, Kigali Wave 94.7 FM officially announced the full list of nominees for the prestigious <strong>Wave Music Awards 2026</strong>.</p><p>Featuring artists from across East and Central Africa, categories include <em>Song of the Year</em>, <em>Best Live Producer</em>, and <em>Breakthrough Artist</em>. Voting opens exclusively on the Kigali Wave website starting this Friday.</p><blockquote>"Our goal has always been to elevate homegrown talent to the global stage," shared Head of Programming Cedric Kalisa during the press conference.</blockquote><p>Stay tuned to 94.7 FM for exclusive nominee interviews and live acoustic sessions throughout the week!</p>', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80', 'published', 2420),
    ('art-1b', $1, 'cat-1b', 'Exclusive Interview: Rising Star Teta on Her New EP Release', 'exclusive-interview-rising-star-teta-ep-release', 'Afropop sensation Teta stopped by The Sunset Drive to break down each track from her sophomore release.', '<p>Following her meteoric rise on streaming charts, Rwandan songstress Teta sat down in the Wave Studio with Aline Uwamahoro to discuss love, creative freedom, and her genre-blending sound.</p><p>The 6-track EP blends traditional Inanga melodies with punchy contemporary 808 percussion, recorded between Kigali and Lagos.</p><p>Watch the full video interview below and tune in every evening at 17:00 for the track of the day.</p>', 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80', 'published', 1890)
  `, [s1Id]);

  // Station 1 YouTube Videos
  await query(`
    INSERT INTO videos (id, station_id, title, youtube_url, video_id, description, status, show_on_homepage)
    VALUES
    ('vid-1a', $1, 'Studio Acoustic Session: Live at Kigali Wave', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ', 'Watch this incredible unplugged acoustic session captured live inside Studio A with our morning crew.', 'active', true),
    ('vid-1b', $1, 'Behind The Mic: A Day in the Life of David & Sandrine', 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ', 'fJ9rUzIMcZQ', 'Ever wondered what happens before the red ON AIR light turns on? Come behind the scenes with our flagship breakfast duo.', 'active', true)
  `, [s1Id]);

  // Station 1 Sections & Settings
  await query(`
    INSERT INTO homepage_sections (id, station_id, player_enabled, on_air_enabled, programs_enabled, news_enabled, videos_enabled, about_enabled, social_enabled, contact_enabled)
    VALUES ('sec-1', $1, true, true, true, true, true, true, true, true)
  `, [s1Id]);

  await query(`
    INSERT INTO station_settings (
      id, station_id, phone, email, address, website, facebook, instagram, twitter, youtube, tiktok, whatsapp,
      copyright_text, timezone, language, seo_title, seo_description, seo_keywords
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
  `, [
    'set-1', s1Id,
    '+250 788 123 456', 'info@kigaliwave.fm', 'Wave Media Tower, KG 7 Ave, Kigali, Rwanda',
    'https://kigaliwave.fm', 'https://facebook.com/kigaliwave', 'https://instagram.com/kigaliwave',
    'https://twitter.com/kigaliwave', 'https://youtube.com/@kigaliwave', 'https://tiktok.com/@kigaliwave',
    '+250788123456', '© 2026 Kigali Wave 94.7 FM. All Rights Reserved.', 'Africa/Kigali', 'en',
    'Kigali Wave 94.7 FM | The Rhythm of Kigali',
    'Stream Kigali Wave 94.7 FM live online. Discover top Afrobeats, urban culture, podcasts, and upcoming radio programs.',
    'radio, live stream, kigali, rwanda, afrobeats, 94.7 fm, music, news'
  ]);

  // ==========================================
  // STATION 2: Summit Classic News 102.5 FM (Theme 4: News Radio)
  // ==========================================
  const s2Id = 'station-summit-news';
  await query(`
    INSERT INTO radio_stations (id, name, slug, slogan, description, status, is_default)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [
    s2Id,
    'Summit Classic News 102.5 FM',
    'summit-news',
    'First with Facts, Deep with Analysis',
    'Authoritative 24/7 news broadcast, business debriefs, political debates, and comprehensive global analysis for the modern citizen.',
    'active',
    false
  ]);

  await query(`
    INSERT INTO station_admins (id, user_id, station_id)
    VALUES ($1, $2, $3)
  `, ['sa-2', 'user-summit-admin', s2Id]);

  await query(`
    INSERT INTO station_branding (
      id, station_id, theme, logo_url, primary_color, secondary_color, accent_color,
      background_color, surface_color, text_color, muted_color, header_color, footer_color,
      font_family
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  `, [
    'brand-2', s2Id, 'theme4_news',
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=240&auto=format&fit=crop&q=80',
    '#DC2626', '#1E293B', '#B91C1C', '#F8FAFC', '#FFFFFF', '#0F172A', '#475569', '#1E293B', '#0F172A',
    'Inter'
  ]);

  // Station 2 Streams
  await query(`
    INSERT INTO radio_streams (id, station_id, name, stream_url, description, is_default, status)
    VALUES 
    ($1, $2, $3, $4, $5, $6, $7),
    ($8, $9, $10, $11, $12, $13, $14)
  `, [
    'stream-2a', s2Id, 'Summit 102.5 FM (Newsdesk Live)', 'https://stream.zeno.fm/f3wvbbqmdg8uv', 'Live 24/7 primary news broadcast', true, 'active',
    'stream-2b', s2Id, 'Summit Global Business', 'https://stream.zeno.fm/0r0xa792kwzuv', 'Specialized stock market, startup, and economic briefings', false, 'active'
  ]);

  // Station 2 Programs
  await query(`
    INSERT INTO programs (id, station_id, title, presenter, description, image_url, days_of_week, start_time, end_time, status, show_on_homepage)
    VALUES
    ('prog-2a', $1, 'Morning Forum & Press Review', 'Dr. Emmanuel Rutayisire', 'Comprehensive analysis of leading national headlines, economic indicators, and live interviews with policymakers.', 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=600&auto=format&fit=crop&q=80', '["Monday","Tuesday","Wednesday","Thursday","Friday"]', '06:00', '09:00', 'active', true),
    ('prog-2b', $1, 'The Business Hour', 'Grace Mutoni', 'Market indices, trade corridors, startup spotlight, and actionable financial advice for professionals.', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80', '["Monday","Tuesday","Wednesday","Thursday","Friday"]', '12:00', '13:30', 'active', true),
    ('prog-2c', $1, 'Global Perspective & Geopolitics', 'Marc Ganza', 'In-depth analysis of African diplomacy, continental trade treaties, and international developments.', 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&auto=format&fit=crop&q=80', '["Saturday","Sunday"]', '15:00', '17:00', 'active', true)
  `, [s2Id]);

  // Station 2 Categories & News
  await query(`
    INSERT INTO news_categories (id, station_id, name, slug)
    VALUES
    ('cat-2a', $1, 'Economy & Trade', 'economy-trade'),
    ('cat-2b', $1, 'Diplomacy', 'diplomacy'),
    ('cat-2c', $1, 'Technology', 'technology')
  `, [s2Id]);

  await query(`
    INSERT INTO news_articles (id, station_id, category_id, title, slug, excerpt, content_html, image_url, status, views_count)
    VALUES
    ('art-2a', $1, 'cat-2a', 'Central Bank Reports 7.4% GDP Growth Projection for FY2026', 'central-bank-reports-7-4-percent-gdp-growth', 'Resilient agricultural yields, regional services, and tech-driven exports bolster economic expansion.', '<p>In its quarterly monetary policy committee statement, the Central Bank has projected a robust <strong>7.4% GDP expansion</strong> for the fiscal year 2026, driven by sustained industrial activity and foreign direct investment.</p><p>Inflation rates have stabilized within target bands, prompting favorable conditions for small and medium-scale commercial lending.</p><h3>Key Highlights:</h3><ul><li>Digital banking transactions rose by 32% year-on-year</li><li>Agricultural export revenue exceeded projections by 11%</li><li>Foreign reserves remain at a comfortable 4.8 months of import cover</li></ul>', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80', 'published', 4580),
    ('art-2b', $1, 'cat-2c', 'New Green Tech Innovation Hub Opens in Kigali Special Economic Zone', 'new-green-tech-innovation-hub-opens', 'The state-of-the-art facility will incubate over 60 startups dedicated to renewable energy and sustainable mobility.', '<p>A landmark milestone in regional sustainability was reached today with the ribbon-cutting of the Pan-African Green Tech Hub in Kigali.</p><p>Equipped with specialized prototyping laboratories, cloud compute resources, and venture mentorship networks, the hub will nurture high-impact entrepreneurs tackling climate resilience.</p>', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80', 'published', 3120)
  `, [s2Id]);

  // Station 2 Videos
  await query(`
    INSERT INTO videos (id, station_id, title, youtube_url, video_id, description, status, show_on_homepage)
    VALUES
    ('vid-2a', $1, 'Special Broadcast: Fiscal Year Budget Analysis Roundtable', 'https://www.youtube.com/watch?v=jNQXAC9IVRw', 'jNQXAC9IVRw', 'Watch our economic editors and invited think-tank scholars debate the national budget allocations.', 'active', true)
  `, [s2Id]);

  // Station 2 Sections & Settings
  await query(`
    INSERT INTO homepage_sections (id, station_id, player_enabled, on_air_enabled, programs_enabled, news_enabled, videos_enabled, about_enabled, social_enabled, contact_enabled)
    VALUES ('sec-2', $1, true, true, true, true, true, true, true, true)
  `, [s2Id]);

  await query(`
    INSERT INTO station_settings (
      id, station_id, phone, email, address, website, facebook, instagram, twitter, youtube, tiktok, whatsapp,
      copyright_text, timezone, language, seo_title, seo_description, seo_keywords
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
  `, [
    'set-2', s2Id,
    '+250 788 987 654', 'desk@summitnews.fm', 'Summit Press Center, Boulevard de la Paix, Kigali',
    'https://summitnews.fm', 'https://facebook.com/summitnews', 'https://instagram.com/summitnews',
    'https://twitter.com/summitnews', 'https://youtube.com/@summitnews', '',
    '+250788987654', '© 2026 Summit Classic News 102.5 FM. Editorial Standards Applied.', 'Africa/Kigali', 'en',
    'Summit Classic News 102.5 FM | Unbiased Journalistic Excellence',
    'Listen live to Summit Classic News 102.5 FM for breaking news, financial markets, and expert investigative panels.',
    'news, breaking news, politics, business, radio live, editorial, kigali, rwanda'
  ]);

  // ==========================================
  // STATION 3: Pulse Beat Radio (Theme 3: Entertainment)
  // ==========================================
  const s3Id = 'station-pulse-beat';
  await query(`
    INSERT INTO radio_stations (id, name, slug, slogan, description, status, is_default)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [
    s3Id,
    'Pulse Beat Radio',
    'pulse-beat',
    'The Non-Stop Club & Festival Frequency',
    'High octane 24/7 dance, electronic, amapiano, and live festival audio with international DJs in the mix.',
    'active',
    false
  ]);

  await query(`
    INSERT INTO station_admins (id, user_id, station_id)
    VALUES ($1, $2, $3)
  `, ['sa-3', 'user-pulse-admin', s3Id]);

  await query(`
    INSERT INTO station_branding (
      id, station_id, theme, logo_url, primary_color, secondary_color, accent_color,
      background_color, surface_color, text_color, muted_color, header_color, footer_color,
      font_family
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  `, [
    'brand-3', s3Id, 'theme3_entertainment',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=240&auto=format&fit=crop&q=80',
    '#EC4899', '#8B5CF6', '#F43F5E', '#0A0A0A', '#171717', '#F9FAFB', '#A3A3A3', '#0F0F0F', '#050505',
    'Outfit'
  ]);

  await query(`
    INSERT INTO radio_streams (id, station_id, name, stream_url, description, is_default, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, ['stream-3a', s3Id, 'Pulse Club Dance Stream', 'https://stream.zeno.fm/f3wvbbqmdg8uv', '320k Ultra HD club audio stream', true, 'active']);

  await query(`
    INSERT INTO programs (id, station_id, title, presenter, description, image_url, days_of_week, start_time, end_time, status, show_on_homepage)
    VALUES
    ('prog-3a', $1, 'Neon Underground Live', 'DJ Cypher', 'Two hours of relentless underground tech-house and deep techno direct from the festival stage.', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80', '["Friday","Saturday","Sunday"]', '22:00', '04:00', 'active', true)
  `, [s3Id]);

  await query(`
    INSERT INTO homepage_sections (id, station_id, player_enabled, on_air_enabled, programs_enabled, news_enabled, videos_enabled, about_enabled, social_enabled, contact_enabled)
    VALUES ('sec-3', $1, true, true, true, true, true, true, true, true)
  `, [s3Id]);

  await query(`
    INSERT INTO station_settings (
      id, station_id, phone, email, address, website, facebook, instagram, twitter, youtube, tiktok, whatsapp,
      copyright_text, timezone, language, seo_title, seo_description, seo_keywords
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
  `, [
    'set-3', s3Id,
    '+250 788 555 777', 'contact@pulsebeat.fm', 'Pulse SoundLab, Nyarutarama, Kigali',
    'https://pulsebeat.fm', 'https://facebook.com/pulsebeat', 'https://instagram.com/pulsebeat',
    'https://twitter.com/pulsebeat', 'https://youtube.com/@pulsebeat', 'https://tiktok.com/@pulsebeat',
    '+250788555777', '© 2026 Pulse Beat Radio. Turn It Up Loud.', 'Africa/Kigali', 'en',
    'Pulse Beat Radio | 24/7 Electronic & Club Anthems',
    'Experience non-stop electronic dance music, guest DJ mixes, and exclusive festival live streams on Pulse Beat Radio.',
    'electronic, edm, club music, dj mix, house music, radio stream'
  ]);

  // Seed realistic analytics sessions & telemetry if empty
  await seedAnalyticsSessions([s1Id, s2Id, s3Id]);

  console.log('[DB] Seeding complete! Super Admin, 3 demo stations, and analytics telemetry are ready.');
}

async function seedAnalyticsSessions(stationIds) {
  try {
    const existing = await query(`SELECT COUNT(*) as count FROM analytics_sessions`);
    if (parseInt(existing.rows[0]?.count || 0) > 0) {
      return;
    }

    console.log('[DB] Seeding realistic analytics sessions and telemetry...');

    const sources = [
      { name: 'Google Search', weight: 30, referrer: 'https://www.google.com/' },
      { name: 'Direct', weight: 25, referrer: '' },
      { name: 'Facebook', weight: 15, referrer: 'https://m.facebook.com/' },
      { name: 'WhatsApp', weight: 12, referrer: 'whatsapp://' },
      { name: 'Instagram', weight: 8, referrer: 'https://l.instagram.com/' },
      { name: 'X (Twitter)', weight: 5, referrer: 'https://t.co/' },
      { name: 'YouTube', weight: 3, referrer: 'https://www.youtube.com/' },
      { name: 'Platform Directory', weight: 2, referrer: 'https://radio.benix.space/' },
    ];

    const devices = [
      { type: 'Mobile', weight: 65 },
      { type: 'Desktop', weight: 28 },
      { type: 'Tablet', weight: 7 },
    ];

    const pickWeighted = (items) => {
      const total = items.reduce((acc, i) => acc + i.weight, 0);
      let r = Math.random() * total;
      for (const item of items) {
        if (r < item.weight) return item;
        r -= item.weight;
      }
      return items[0];
    };

    const pages = ['/', '/schedule', '/news', '/contact', '/videos'];
    const now = Date.now();

    for (const stationId of stationIds) {
      // Generate 75-100 sessions distributed across today, yesterday, past week, past month
      const count = 90;
      for (let i = 0; i < count; i++) {
        let ageMs;
        const bucket = Math.random();
        if (bucket < 0.20) {
          // Today (past 0 to 18 hours)
          ageMs = Math.random() * 18 * 3600 * 1000;
        } else if (bucket < 0.40) {
          // Yesterday (24 to 48 hours ago)
          ageMs = (24 + Math.random() * 24) * 3600 * 1000;
        } else if (bucket < 0.75) {
          // Past week (2 to 7 days ago)
          ageMs = (2 + Math.random() * 5) * 24 * 3600 * 1000;
        } else {
          // Past month (7 to 30 days ago)
          ageMs = (7 + Math.random() * 23) * 24 * 3600 * 1000;
        }

        const createdAt = new Date(now - ageMs).toISOString();
        const sourceObj = pickWeighted(sources);
        const deviceObj = pickWeighted(devices);
        const durationSec = Math.floor(45 + Math.random() * 1400); // 45s to 24m
        const isListening = Math.random() < 0.68;
        const listeningSec = isListening ? Math.floor(durationSec * (0.6 + Math.random() * 0.38)) : 0;
        const pageviews = Math.floor(1 + Math.random() * 4);
        const page = pages[Math.floor(Math.random() * pages.length)];

        const sessDbId = `as-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        const sessToken = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

        await query(`
          INSERT INTO analytics_sessions (
            id, station_id, session_id, traffic_source, referrer, device_type,
            page_path, duration_seconds, is_listening, listening_seconds, pageviews_count,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
          sessDbId, stationId, sessToken, sourceObj.name, sourceObj.referrer, deviceObj.type,
          page, durationSec, isListening, listeningSec, pageviews, createdAt, createdAt
        ]);

        // Insert matching play event if listening
        if (isListening) {
          await query(`
            INSERT INTO analytics_events (id, station_id, event_type, event_data, created_at)
            VALUES ($1, $2, 'play', $3, $4)
          `, [`evt-${sessDbId}-p`, stationId, JSON.stringify({ session_id: sessToken, stream_name: 'Main High Definition' }), createdAt]);
        }

        // Insert pageview event
        await query(`
          INSERT INTO analytics_events (id, station_id, event_type, event_data, created_at)
          VALUES ($1, $2, 'pageview', $3, $4)
        `, [`evt-${sessDbId}-v`, stationId, JSON.stringify({ session_id: sessToken, path: page }), createdAt]);
      }
    }
  } catch (err) {
    console.warn('[DB] Could not seed analytics sessions:', err.message);
  }
}

