import bcrypt from 'bcryptjs';
import { query } from './pool.js';

export async function seedDatabase() {
  console.log('🌱 Checking seed data for RBA Streaming Platform...');

  // 1. Seed Users (Super Admin & Admin)
  const userCheck = await query(`SELECT COUNT(*) FROM users;`);
  if (parseInt(userCheck.rows[0].count, 10) === 0) {
    const passwordHash = bcrypt.hashSync('RbaAdmin2026!#', 10);

    await query(
      `INSERT INTO users (email, password_hash, full_name, role) VALUES 
      ($1, $2, $3, $4),
      ($5, $6, $7, $8);`,
      [
        'superadmin@rba.co.rw',
        passwordHash,
        'RBA Super Administrator',
        'SUPER_ADMIN',
        'admin@rba.co.rw',
        passwordHash,
        'RBA Content Manager',
        'ADMIN',
      ]
    );
    console.log('✅ Seeded default Super Admin (superadmin@rba.co.rw) and Admin (admin@rba.co.rw)');
  }

  // 2. Seed Categories
  const categoryCheck = await query(`SELECT COUNT(*) FROM categories;`);
  if (parseInt(categoryCheck.rows[0].count, 10) === 0) {
    const categories = [
      { name: 'Latest Videos', slug: 'latest-videos', description: 'Recent updates and broadcasts from RTV', order: 1 },
      { name: 'News & Current Affairs', slug: 'news', description: 'National and regional news bulletins', order: 2 },
      { name: 'Rwanda Today', slug: 'rwanda', description: 'Stories highlighting national progress and community life', order: 3 },
      { name: 'International', slug: 'international', description: 'Global developments and diplomatic news', order: 4 },
      { name: 'Sports', slug: 'sports', description: 'Football, cycling, basketball, and athletic highlights', order: 5 },
      { name: 'Entertainment & Culture', slug: 'entertainment', description: 'Music, creative arts, and cultural festivals', order: 6 },
    ];

    for (const cat of categories) {
      await query(
        `INSERT INTO categories (name, slug, description, display_order) VALUES ($1, $2, $3, $4) ON CONFLICT (slug) DO NOTHING;`,
        [cat.name, cat.slug, cat.description, cat.order]
      );
    }
    console.log('✅ Seeded video categories');
  }

  // 3. Seed Stations (10 Official Stations)
  const stationCheck = await query(`SELECT COUNT(*) FROM stations;`);
  if (parseInt(stationCheck.rows[0].count, 10) === 0) {
    const stations = [
      {
        name: 'RTV Live',
        slug: 'rtv',
        description: "Rwanda Television (RTV) is Rwanda's public service television broadcaster, delivering informative, educational, and entertaining programming nationwide and globally.",
        logo_url: '/logo.png',
        stream_url: 'https://5c46fa289c89f.streamlock.net/rtv25/rtv/playlist.m3u8',
        stream_type: 'HLS',
        station_type: 'TV',
        location: 'Kigali, National Broadcast',
        frequency: 'Channel 01 / DTT',
        accent_color: '#0284c7',
        is_active: true,
        is_featured: true,
        display_order: 1,
      },
      {
        name: 'KC2',
        slug: 'kc2',
        description: 'Kigali Channel 2 (KC2) focuses on dynamic youth programming, creative entertainment, sports, education, and talent discovery.',
        logo_url: '/logo.png',
        stream_url: 'https://5c46fa289c89f.streamlock.net/kc2/kc2/playlist.m3u8',
        stream_type: 'HLS',
        station_type: 'TV',
        location: 'Kigali, National',
        frequency: 'Channel 02 / DTT',
        accent_color: '#f97316',
        is_active: true,
        is_featured: true,
        display_order: 2,
      },
      {
        name: 'Radio Rwanda',
        slug: 'radio-rwanda',
        description: 'The flagship national public radio broadcaster. Broadcasting in Kinyarwanda, French, English, and Swahili with unmatched nationwide coverage.',
        logo_url: '/logo.png',
        stream_url: 'https://listen.rba.co.rw:8008/rwanda',
        stream_type: 'AUDIO',
        station_type: 'RADIO',
        location: 'Kigali, National Coverage',
        frequency: '100.7 FM',
        accent_color: '#2563eb',
        is_active: true,
        is_featured: true,
        display_order: 3,
      },
      {
        name: 'Magic FM',
        slug: 'magic-fm',
        description: 'Kigali’s favorite urban contemporary youth station. Great music, lifestyle discussions, and vibrant modern entertainment.',
        logo_url: '/logo.png',
        stream_url: 'https://listen.rba.co.rw:8085/mgcfm',
        stream_type: 'AUDIO',
        station_type: 'RADIO',
        location: 'Kigali & Central Rwanda',
        frequency: '90.7 FM',
        accent_color: '#06b6d4',
        is_active: true,
        is_featured: true,
        display_order: 4,
      },
      {
        name: 'Radio Rubavu',
        slug: 'radio-rubavu',
        description: 'Community radio station serving the Western Province and Lake Kivu basin with local development news, cross-border commercial updates, and culture.',
        logo_url: '/logo.png',
        stream_url: 'https://listen.rba.co.rw:8004/rubavu',
        stream_type: 'AUDIO',
        station_type: 'RADIO',
        location: 'Rubavu, Western Province',
        frequency: '105.1 FM',
        accent_color: '#14b8a6',
        is_active: true,
        is_featured: false,
        display_order: 5,
      },
      {
        name: 'Radio Nyagatare',
        slug: 'radio-nyagatare',
        description: 'The voice of the Eastern Province, providing farming and livestock development advice, regional affairs, and local cultural music.',
        logo_url: '/logo.png',
        stream_url: 'https://listen.rba.co.rw:3053/nyagatare',
        stream_type: 'AUDIO',
        station_type: 'RADIO',
        location: 'Nyagatare, Eastern Province',
        frequency: '96.6 FM',
        accent_color: '#f59e0b',
        is_active: true,
        is_featured: false,
        display_order: 6,
      },
      {
        name: 'Radio Inteko',
        slug: 'radio-inteko',
        description: 'Parliamentary radio channel dedicated to civic participation, live legislative debates, citizen queries, and lawmaking transparency.',
        logo_url: '/logo.png',
        stream_url: 'https://listen.rba.co.rw:8007/inteko',
        stream_type: 'AUDIO',
        station_type: 'RADIO',
        location: 'Parliament, Kigali',
        frequency: '89.6 FM',
        accent_color: '#10b981',
        is_active: true,
        is_featured: false,
        display_order: 7,
      },
      {
        name: 'Radio Huye',
        slug: 'radio-huye',
        description: 'Southern Province community broadcaster reflecting university scholarship, heritage, cultural history, and agricultural innovation.',
        logo_url: '/logo.png',
        stream_url: 'https://listen.rba.co.rw:5053/huye',
        stream_type: 'AUDIO',
        station_type: 'RADIO',
        location: 'Huye, Southern Province',
        frequency: '100.4 FM',
        accent_color: '#a855f7',
        is_active: true,
        is_featured: false,
        display_order: 8,
      },
      {
        name: 'Radio Musanze',
        slug: 'radio-musanze',
        description: 'Broadcasting from Rwanda’s Northern Volcanoes region, spotlighting eco-tourism, gorilla conservation, mountain horticulture, and community news.',
        logo_url: '/logo.png',
        stream_url: 'https://listen.rba.co.rw:8003/musanze',
        stream_type: 'AUDIO',
        station_type: 'RADIO',
        location: 'Musanze, Northern Province',
        frequency: '90.0 FM',
        accent_color: '#84cc16',
        is_active: true,
        is_featured: false,
        display_order: 9,
      },
      {
        name: 'Radio Rusizi',
        slug: 'radio-rusizi',
        description: 'Empowering communities along South-Western Rwanda, promoting local entrepreneurship, regional news, and cross-border friendship.',
        logo_url: '/logo.png',
        stream_url: 'https://listen.rba.co.rw:8009/rusizi',
        stream_type: 'AUDIO',
        station_type: 'RADIO',
        location: 'Rusizi, Western Province',
        frequency: '93.3 FM',
        accent_color: '#eab308',
        is_active: true,
        is_featured: false,
        display_order: 10,
      },
    ];

    for (const st of stations) {
      await query(
        `INSERT INTO stations (
          name, slug, description, logo_url, stream_url, stream_type, station_type, 
          location, frequency, accent_color, is_active, is_featured, display_order, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'ONLINE')
        ON CONFLICT (slug) DO UPDATE SET stream_url = EXCLUDED.stream_url;`,
        [
          st.name,
          st.slug,
          st.description,
          st.logo_url,
          st.stream_url,
          st.stream_type,
          st.station_type,
          st.location,
          st.frequency,
          st.accent_color,
          st.is_active,
          st.is_featured,
          st.display_order,
        ]
      );
    }
    console.log('✅ Seeded 10 official RBA TV & Radio stations');
  }

  // 4. Seed Sample Videos
  const videoCheck = await query(`SELECT COUNT(*) FROM videos;`);
  if (parseInt(videoCheck.rows[0].count, 10) === 0) {
    const catRes = await query(`SELECT id, slug FROM categories;`);
    const newsCat = catRes.rows.find((c: any) => c.slug === 'news') || catRes.rows[0];
    const sportsCat = catRes.rows.find((c: any) => c.slug === 'sports') || catRes.rows[0];
    const rwandaCat = catRes.rows.find((c: any) => c.slug === 'rwanda') || catRes.rows[0];

    const sampleVideos = [
      {
        title: 'Amakuru Mashya ya RTV: Ubutumwa bwa Perezida Kagame',
        slug: 'amakuru-mashya-rtv-kagame',
        description: 'Inshamake yamakuru yose yaranze umunsi kuri Televiziyo y\'u Rwanda (RTV). Amakuru yose yubukungu, imibereho myiza niterambere.',
        original_url: 'https://www.youtube.com/watch?v=kYJ5oVpC9kE',
        embed_url: 'https://www.youtube.com/embed/kYJ5oVpC9kE',
        platform: 'youtube',
        video_id: 'kYJ5oVpC9kE',
        thumbnail_url: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
        category_id: newsCat?.id,
        publication_date: new Date().toISOString().split('T')[0],
        views_count: 1420,
        is_featured: true,
      },
      {
        title: 'Tour du Rwanda 2026: Incamake yamasiganwa n\'intsinzi yabanyarwanda',
        slug: 'tour-du-rwanda-2026-highlights',
        description: 'Reba uburyo isiganwa ry\'amagare rizwi nka Tour du Rwanda ryagenze mu duce dutandukanye tw\'igihugu.',
        original_url: 'https://www.youtube.com/watch?v=3JZ_D3ELwOQ',
        embed_url: 'https://www.youtube.com/embed/3JZ_D3ELwOQ',
        platform: 'youtube',
        video_id: '3JZ_D3ELwOQ',
        thumbnail_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
        category_id: sportsCat?.id,
        publication_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        views_count: 3200,
        is_featured: true,
      },
      {
        title: 'Ikiganiro cyihariye: Ubukerarugendo bushingiye ku bidukikije mu Rwanda',
        slug: 'ubukerarugendo-bidukikije-rwanda',
        description: 'Ubushakashatsi n\'ingamba zifatika mu kubungabunga ibidukikije no guteza imbere pariki z\'igihugu nka Pariki y\'Ibirunga.',
        original_url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
        embed_url: 'https://www.youtube.com/embed/kJQP7kiw5Fk',
        platform: 'youtube',
        video_id: 'kJQP7kiw5Fk',
        thumbnail_url: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80',
        category_id: rwandaCat?.id,
        publication_date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
        views_count: 850,
        is_featured: false,
      },
    ];

    for (const vid of sampleVideos) {
      await query(
        `INSERT INTO videos (
          title, slug, description, original_url, embed_url, platform, video_id, 
          thumbnail_url, category_id, publication_date, views_count, is_featured, is_published
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
        ON CONFLICT (slug) DO NOTHING;`,
        [
          vid.title,
          vid.slug,
          vid.description,
          vid.original_url,
          vid.embed_url,
          vid.platform,
          vid.video_id,
          vid.thumbnail_url,
          vid.category_id,
          vid.publication_date,
          vid.views_count,
          vid.is_featured,
        ]
      );
    }
    console.log('✅ Seeded sample initial videos');
  }

  // 5. Seed Site Settings
  const settingsCheck = await query(`SELECT COUNT(*) FROM site_settings;`);
  if (parseInt(settingsCheck.rows[0].count, 10) === 0) {
    const defaultSettings = {
      site_name: 'Rwanda Broadcasting Agency (RBA)',
      site_description: "Rwanda's leading public service multimedia broadcaster. Stream RTV Live, KC2, and Radio Rwanda online anywhere.",
      logo_url: '/logo.png',
      contact_email: 'info@rba.co.rw',
      contact_phone: '+250 252 576 540',
      address: 'KG 7 Ave, Kacyiru, P.O. Box 83 Kigali - Rwanda',
      facebook_url: 'https://facebook.com/rba.rwanda',
      twitter_url: 'https://twitter.com/RBA_Rwanda',
      youtube_url: 'https://youtube.com/c/RwandaBroadcastingAgency',
      instagram_url: 'https://instagram.com/rba.rwanda',
      footer_text: '© ' + new Date().getFullYear() + ' Rwanda Broadcasting Agency (RBA). All rights reserved.',
    };

    await query(
      `INSERT INTO site_settings (key, value) VALUES ('general', $1) ON CONFLICT (key) DO NOTHING;`,
      [JSON.stringify(defaultSettings)]
    );
    console.log('✅ Seeded default site settings');
  }
}

// Allow direct run
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
