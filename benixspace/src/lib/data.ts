import { query, hasValidDbConfig } from '../server/db/db';
import { initDb } from '../server/db/init';

// Initial in-memory default fallbacks
export let companyData = {
  company_name: 'NebeluRw Co. Ltd',
  company_description: 'NebeluRw Co. Ltd is a modern technology and digital services company developing digital platforms, web applications, streaming services, and professional media solutions.',
  history: 'Founded by Benir Benjamin, NebeluRw Co. Ltd started as an innovative technology venture aimed at delivering high-performance digital platforms and audio-visual services across Rwanda and internationally.',
  founder_name: 'Benir Benjamin',
  founder_bio: 'Benir Benjamin is the founder and lead developer behind NebeluRw Co. Ltd and the BenixSpace ecosystem, pioneering digital media, web platforms, and streaming solutions.',
  email: 'benirabok@gmail.com',
  phone: '0783987223',
  address: 'Kigali, Rwanda',
  services_json: JSON.stringify([
    { id: 'web-dev', title: 'Software & Web Development', description: 'Custom websites, web applications, business platforms, management systems, and utility applications.', icon: 'Code' },
    { id: 'seo-marketing', title: 'Digital Marketing & SEO', description: 'Search engine optimization, content strategy, social media marketing, and online brand promotion.', icon: 'TrendingUp' },
    { id: 'social-mgmt', title: 'Social Media Management', description: 'Comprehensive social media management, content publishing, promotional campaigns, and brand visibility.', icon: 'Share2' },
    { id: 'youtube', title: 'YouTube Services', description: 'Channel creation, video optimization, publishing strategies, and subscriber growth management.', icon: 'Youtube' },
    { id: 'audio-music', title: 'Audio & Music Production', description: 'Music recording, professional audio mixing, gospel & commercial music projects, and studio production.', icon: 'Music' },
    { id: 'video-prod', title: 'Video Production', description: 'High-quality promotional videos, social media video content, event coverage, and music videos.', icon: 'Video' },
    { id: 'music-dist', title: 'Music Distribution', description: 'Global music distribution to platforms like Spotify, Deezer, Boomplay, Apple Music, and YouTube Music.', icon: 'Radio' },
    { id: 'design-photo', title: 'Photography & Graphic Design', description: 'Event photography, promotional artwork, digital flyers, logo design, and corporate branding.', icon: 'Camera' },
    { id: 'instruments', title: 'Musical Instruments Assistance', description: 'Connecting customers with reliable vendors to source and purchase quality musical instruments.', icon: 'Sliders' }
  ])
};

export const socialLinks = [
  { id: 1, platform: 'Facebook', handle: 'benir.thegeneral', custom_url: 'https://facebook.com/benir.thegeneral', sort_order: 1 },
  { id: 2, platform: 'Instagram', handle: 'benirbenjamin', custom_url: 'https://instagram.com/benirbenjamin', sort_order: 2 },
  { id: 3, platform: 'X', handle: 'benirbenjamin', custom_url: 'https://x.com/benirbenjamin', sort_order: 3 },
  { id: 4, platform: 'TikTok', handle: 'benir250', custom_url: 'https://tiktok.com/@benir250', sort_order: 4 },
  { id: 5, platform: 'YouTube', handle: 'nebelurw', custom_url: 'https://youtube.com/@nebelurw', sort_order: 5 },
];

export let projects: any[] = [
  {
    id: 1,
    name: 'Benix Space TV',
    slug: 'benix-space-tv',
    url: 'https://tv.benix.space',
    short_description: 'An online digital TV and radio streaming platform bringing entertainment, news, and live media.',
    full_description: 'Benix Space TV is an online television and radio streaming platform developed by NebeluRw Co. Ltd. It delivers high-quality live video streaming, scheduled broadcasts, and interactive digital media channels accessible seamlessly across desktop and mobile devices.',
    image_url: '/benix tv.png',
    gallery_images: JSON.stringify(['/benix tv.png']),
    category: 'Streaming & Media',
    tags: JSON.stringify(['TV Streaming', 'Live Broadcast', 'NebeluRw', 'Media Platform']),
    technologies: JSON.stringify(['React', 'TypeScript', 'HLS Video', 'Node.js', 'PostgreSQL']),
    status: 'published',
    featured: true,
    embed_mode: 'both',
    sort_order: 1,
    seo_title: 'Benix Space TV — Live Streaming & Radio Platform by NebeluRw',
    seo_description: 'Watch live TV streaming, video broadcasts, and radio stations on Benix Space TV, developed by NebeluRw Co. Ltd.',
    seo_keywords: 'Benix Space TV, streaming Rwanda, online TV Rwanda, NebeluRw media, live radio streaming'
  },
  {
    id: 2,
    name: 'Benix Games',
    slug: 'benix-games',
    url: 'https://games.benix.space',
    short_description: 'Interactive online gaming portal featuring HTML5 games, entertainment, and leaderboard challenges.',
    full_description: 'Benix Games is a digital gaming platform designed to provide instant online web games, interactive challenges, and engaging leisure activities for users across all browser platforms.',
    image_url: '/benix games.png',
    gallery_images: JSON.stringify(['/benix games.png']),
    category: 'Gaming & Entertainment',
    tags: JSON.stringify(['Games', 'Web Games', 'Interactive', 'NebeluRw']),
    technologies: JSON.stringify(['HTML5 Canvas', 'React', 'JavaScript', 'Tailwind CSS']),
    status: 'published',
    featured: true,
    embed_mode: 'both',
    sort_order: 2,
    seo_title: 'Benix Games — Instant Browser Games & Entertainment Portal',
    seo_description: 'Play fun online web games on Benix Games. Lightweight, fast, and entertaining games developed by NebeluRw.',
    seo_keywords: 'Benix Games, web games, browser gaming Rwanda, Benix space games, NebeluRw platforms'
  },
  {
    id: 3,
    name: 'Benix Easy Calc',
    slug: 'easy-calc',
    url: 'https://easycalc.benix.space',
    short_description: 'A comprehensive collection of online calculators, converters, and smart digital utility tools.',
    full_description: 'Benix Easy Calc provides instant calculation utilities for business, finance, unit conversion, engineering math, and daily productivity. Designed for speed, precision, and mobile usability.',
    image_url: '/easy calc.png',
    gallery_images: JSON.stringify(['/easy calc.png']),
    category: 'Utility & Tools',
    tags: JSON.stringify(['Calculators', 'Productivity', 'Utilities', 'Math Tools']),
    technologies: JSON.stringify(['React', 'TypeScript', 'Tailwind CSS', 'Vite']),
    status: 'published',
    featured: true,
    embed_mode: 'both',
    sort_order: 3,
    seo_title: 'Benix Easy Calc — Online Calculators & Smart Utility Tools',
    seo_description: 'Use fast, accurate online calculators for finance, unit conversions, math, and business with Benix Easy Calc by NebeluRw.',
    seo_keywords: 'Easy Calc, online calculator, unit converter, Benix calculators, NebeluRw software'
  },
  {
    id: 4,
    name: 'Benix Radio',
    slug: 'radio',
    url: 'https://radio.benix.space',
    short_description: 'Online digital radio and music streaming station broadcasting music, podcasts, and audio shows.',
    full_description: 'Benix Radio provides 24/7 digital audio streaming, live DJ sets, music podcasts, and news commentary with crystal clear sound quality and responsive audio player controls.',
    image_url: '/radio-icon.svg',
    gallery_images: JSON.stringify(['/radio-icon.svg']),
    category: 'Streaming & Media',
    tags: JSON.stringify(['Radio', 'Audio Streaming', 'Music Station', 'NebeluRw']),
    technologies: JSON.stringify(['React', 'Web Audio API', 'Node.js', 'PostgreSQL']),
    status: 'published',
    featured: true,
    embed_mode: 'both',
    sort_order: 4,
    seo_title: 'Benix Radio — 24/7 Digital Radio & Music Streaming Station',
    seo_description: 'Listen to live digital radio broadcasts, music playlists, and audio shows on Benix Radio by NebeluRw Co. Ltd.',
    seo_keywords: 'Benix Radio, online radio Rwanda, music streaming, digital radio station, NebeluRw audio'
  },
  {
    id: 5,
    name: 'Voxify',
    slug: 'voxify',
    url: 'https://voxify.space',
    short_description: 'Digital platform for choirs, gospel artists, music distribution, and audio composition showcase.',
    full_description: 'Voxify is a dedicated music and choir ecosystem created by NebeluRw Co. Ltd to empower gospel choirs, independent vocalists, and musical groups with digital streaming, song catalogs, and distribution management.',
    image_url: '/voxify.png',
    gallery_images: JSON.stringify(['/voxify.png']),
    category: 'Music Ecosystem',
    tags: JSON.stringify(['Choirs', 'Gospel Music', 'Artists Platform', 'Music Hub']),
    technologies: JSON.stringify(['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS']),
    status: 'published',
    featured: true,
    embed_mode: 'both',
    sort_order: 5,
    seo_title: 'Voxify — Digital Music & Choir Platform by NebeluRw',
    seo_description: 'Discover gospel music, choir catalogs, artist profiles, and song releases on Voxify platform.',
    seo_keywords: 'Voxify space, choir platform, gospel music Rwanda, choir digital library, NebeluRw music'
  }
];

export let blogCategories: string[] = [
  'Technology',
  'Software Development',
  'Digital Marketing & SEO',
  'NebeluRw News'
];

export let articles: any[] = [
  {
    id: 1,
    title: 'Building Modern Web Applications for Rwanda’s Digital Ecosystem',
    slug: 'building-modern-web-applications-rwanda-digital-ecosystem',
    summary: 'An insight into how NebeluRw Co. Ltd designs scalable digital platforms, streaming services, and custom software solutions.',
    content: `<h2>The Rise of Rwanda's Digital Transformation</h2>
<p>Rwanda has rapidly emerged as a vibrant technology hub in East Africa. At <strong>NebeluRw Co. Ltd</strong>, led by Benir Benjamin, our primary mission is to build robust, scalable, and user-friendly digital platforms that empower local businesses, creators, and online communities.</p>

<h3>Key Pillars of NebeluRw Digital Ecosystem</h3>
<ul>
  <li><strong>BenixSpace Platform:</strong> The central digital portfolio and CMS engine.</li>
  <li><strong>Streaming Media:</strong> Benix Space TV & Benix Radio delivering 24/7 audio-visual content.</li>
  <li><strong>Productivity Utilities:</strong> Easy Calc bringing smart calculation tools to everyday users.</li>
  <li><strong>Music Ecosystem:</strong> Voxify providing dedicated spaces for gospel choirs and vocal artists.</li>
</ul>

<p>Our commitment remains centered on delivering high performance, responsive interfaces, and clean UI engineering across all our products.</p>`,
    featured_image_url: 'https://i.postimg.cc/Hnj1LYRT/online-banks.png',
    category: 'Technology',
    tags: JSON.stringify(['Software Development', 'Rwanda Tech', 'NebeluRw', 'Web Applications']),
    author_name: 'Benir Benjamin',
    status: 'published',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    views_count: 142,
    comments_count: 2,
    seo_title: 'Building Modern Web Applications for Rwanda Digital Ecosystem | NebeluRw',
    seo_description: 'Discover how NebeluRw Co. Ltd develops web platforms, streaming tools, and software solutions in Rwanda.',
    seo_keywords: 'NebeluRw, software development Rwanda, Benir Benjamin, web apps Rwanda'
  }
];

export let articleComments: any[] = [];
export let bannedIps: string[] = [];

const sampleEventTemplates = [
  { type: 'page_view', url: 'https://benix.space/', pType: 'home', dev: 'desktop', br: 'Chrome', os: 'Windows', ref: 'Google Search' },
  { type: 'page_view', url: 'https://benix.space/projects', pType: 'projects', dev: 'mobile', br: 'Safari', os: 'iOS', ref: 'Direct' },
  { type: 'page_view', url: 'https://benix.space/projects/benix-space-tv', pType: 'project_detail', projId: 1, dev: 'desktop', br: 'Chrome', os: 'Windows', ref: 'Google Search' },
  { type: 'project_external_click', url: 'https://benix.space/projects', pType: 'project_click', projId: 1, dev: 'desktop', br: 'Chrome', os: 'Windows', ref: 'Direct' },
  { type: 'project_external_click', url: 'https://benix.space/projects', pType: 'project_click', projId: 3, dev: 'mobile', br: 'Chrome', os: 'Android', ref: 'Google Search' },
  { type: 'page_view', url: 'https://benix.space/blog', pType: 'blog', dev: 'desktop', br: 'Firefox', os: 'Windows', ref: 'Facebook' },
  { type: 'page_view', url: 'https://benix.space/blog/building-modern-web-applications-rwanda-digital-ecosystem', pType: 'blog_detail', artId: 1, dev: 'desktop', br: 'Chrome', os: 'Windows', ref: 'X (Twitter)' },
  { type: 'page_view', url: 'https://benix.space/services', pType: 'services', dev: 'tablet', br: 'Safari', os: 'iOS', ref: 'Direct' },
  { type: 'page_view', url: 'https://benix.space/about', pType: 'about', dev: 'desktop', br: 'Edge', os: 'Windows', ref: 'Direct' },
  { type: 'project_external_click', url: 'https://benix.space/', pType: 'project_click', projId: 2, dev: 'mobile', br: 'Safari', os: 'iOS', ref: 'Instagram' },
  { type: 'page_view', url: 'https://benix.space/contact', pType: 'contact', dev: 'desktop', br: 'Chrome', os: 'Windows', ref: 'Google Search' }
];

export let analyticsEvents: any[] = Array.from({ length: 60 }).map((_, i) => {
  const item = sampleEventTemplates[i % sampleEventTemplates.length];
  const daysAgo = Math.floor(i / 2);
  const hoursAgo = (i * 3) % 24;
  const minutesAgo = (i * 17) % 60;
  const createdAt = new Date(Date.now() - (daysAgo * 24 * 3600 * 1000 + hoursAgo * 3600 * 1000 + minutesAgo * 60 * 1000)).toISOString();
  return {
    id: `evt_seed_${i + 1}`,
    event_type: item.type,
    page_url: item.url,
    page_type: item.pType,
    project_id: item.projId || null,
    article_id: item.artId || null,
    referrer: item.ref,
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    device_type: item.dev,
    browser: item.br,
    os: item.os,
    session_id: `sess_visitor_${(i % 15) + 1}`,
    created_at: createdAt
  };
});

let isInitialized = false;
export async function ensureDbInitialized() {
  if (!isInitialized && hasValidDbConfig) {
    try {
      await initDb();
      isInitialized = true;
    } catch (e) {
      console.warn('PostgreSQL auto-init warning:', e);
    }
  }
}

// ==================== COMPANY SETTINGS & SOCIAL ==================== //

export async function getCompanyAndSocialData() {
  await ensureDbInitialized();
  if (hasValidDbConfig) {
    try {
      const companyRes = await query('SELECT * FROM company_settings LIMIT 1');
      const socialRes = await query('SELECT * FROM social_links ORDER BY sort_order ASC');
      const company = companyRes.rows[0] || companyData;
      const social = socialRes.rows.length > 0 ? socialRes.rows : socialLinks;
      companyData = { ...companyData, ...company };
      return { company, social };
    } catch (e) {
      console.warn('DB settings query failed, falling back to memory:', e);
    }
  }
  return { company: companyData, social: socialLinks };
}

export async function updateCompanyData(newData: any) {
  await ensureDbInitialized();
  companyData = { ...companyData, ...newData };

  if (hasValidDbConfig) {
    try {
      const existing = await query('SELECT id FROM company_settings LIMIT 1');
      if (existing.rowCount > 0) {
        await query(
          `UPDATE company_settings SET 
            company_name = $1, company_description = $2, history = $3, founder_name = $4,
            founder_bio = $5, email = $6, phone = $7, address = $8, services_json = $9,
            updated_at = CURRENT_TIMESTAMP`,
          [
            companyData.company_name, companyData.company_description, companyData.history,
            companyData.founder_name, companyData.founder_bio, companyData.email,
            companyData.phone, companyData.address, companyData.services_json
          ]
        );
      } else {
        await query(
          `INSERT INTO company_settings (company_name, company_description, history, founder_name, founder_bio, email, phone, address, services_json)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            companyData.company_name, companyData.company_description, companyData.history,
            companyData.founder_name, companyData.founder_bio, companyData.email,
            companyData.phone, companyData.address, companyData.services_json
          ]
        );
      }
    } catch (e) {
      console.warn('DB updateCompanyData failed:', e);
    }
  }

  return companyData;
}

// ==================== PROJECTS DATA LAYER ==================== //

export async function getProjectsData(filters?: { category?: string; search?: string; featured?: string; status?: string }) {
  await ensureDbInitialized();
  if (hasValidDbConfig) {
    try {
      let sql = 'SELECT * FROM projects WHERE 1=1';
      const params: any[] = [];

      if (filters?.status && filters.status !== 'all') {
        params.push(filters.status);
        sql += ` AND status = $${params.length}`;
      }
      if (filters?.category && filters.category !== 'All') {
        params.push(filters.category);
        sql += ` AND category = $${params.length}`;
      }
      if (filters?.featured === 'true') {
        sql += ` AND featured = true`;
      }
      if (filters?.search) {
        params.push(`%${filters.search}%`);
        sql += ` AND (name ILIKE $${params.length} OR short_description ILIKE $${params.length} OR technologies ILIKE $${params.length})`;
      }
      sql += ' ORDER BY sort_order ASC, created_at DESC';

      const res = await query(sql, params);
      projects = res.rows;
      return res.rows;
    } catch (e) {
      console.warn('DB getProjectsData failed, falling back to memory:', e);
    }
  }

  let result = [...projects];
  if (filters?.status && filters.status !== 'all') result = result.filter((p) => p.status === filters.status);
  if (filters?.category && filters.category !== 'All') result = result.filter((p) => p.category === filters.category);
  if (filters?.featured === 'true') result = result.filter((p) => p.featured);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    result = result.filter((p) => p.name.toLowerCase().includes(q) || p.short_description.toLowerCase().includes(q));
  }
  return result;
}

export async function saveProjectData(projectData: any) {
  await ensureDbInitialized();
  const name = projectData.name || 'New Project';
  const slug = projectData.slug || `project-${Date.now()}`;
  const url = projectData.url || 'https://benix.space';
  const short_description = projectData.short_description || '';
  const full_description = projectData.full_description || '';
  const image_url = projectData.image_url || 'https://i.postimg.cc/85zP6mK2/benix-tv-cover.jpg';
  const gallery_images = typeof projectData.gallery_images === 'string' ? projectData.gallery_images : JSON.stringify(projectData.gallery_images || []);
  const category = projectData.category || 'Web Application';
  const tags = typeof projectData.tags === 'string' ? projectData.tags : JSON.stringify(projectData.tags || []);
  const technologies = typeof projectData.technologies === 'string' ? projectData.technologies : JSON.stringify(projectData.technologies || []);
  const status = projectData.status || 'published';
  const featured = Boolean(projectData.featured);
  const embed_mode = projectData.embed_mode || 'both';
  const sort_order = Number(projectData.sort_order) || 0;
  const seo_title = projectData.seo_title || name;
  const seo_description = projectData.seo_description || short_description;
  const seo_keywords = projectData.seo_keywords || '';
  const og_image_url = projectData.og_image_url || image_url;

  if (hasValidDbConfig) {
    try {
      if (projectData.id) {
        const res = await query(
          `UPDATE projects SET 
            name = $1, slug = $2, url = $3, short_description = $4, full_description = $5,
            image_url = $6, gallery_images = $7, category = $8, tags = $9, technologies = $10,
            status = $11, featured = $12, embed_mode = $13, sort_order = $14, seo_title = $15,
            seo_description = $16, seo_keywords = $17, og_image_url = $18, updated_at = CURRENT_TIMESTAMP
           WHERE id = $19 OR slug = $2 RETURNING *`,
          [
            name, slug, url, short_description, full_description, image_url,
            gallery_images, category, tags, technologies, status, featured,
            embed_mode, sort_order, seo_title, seo_description, seo_keywords,
            og_image_url, Number(projectData.id) || 0
          ]
        );
        if (res.rowCount > 0) {
          const idx = projects.findIndex((p) => p.id === res.rows[0].id);
          if (idx !== -1) projects[idx] = res.rows[0];
          else projects.unshift(res.rows[0]);
          return res.rows[0];
        }
      }

      const res = await query(
        `INSERT INTO projects 
          (name, slug, url, short_description, full_description, image_url, gallery_images, category, tags, technologies, status, featured, embed_mode, sort_order, seo_title, seo_description, seo_keywords, og_image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
         RETURNING *`,
        [
          name, slug, url, short_description, full_description, image_url,
          gallery_images, category, tags, technologies, status, featured,
          embed_mode, sort_order, seo_title, seo_description, seo_keywords, og_image_url
        ]
      );
      projects.unshift(res.rows[0]);
      return res.rows[0];
    } catch (e) {
      console.warn('DB saveProjectData failed, using memory:', e);
    }
  }

  // Memory fallback
  if (projectData.id) {
    const idx = projects.findIndex((p) => p.id === Number(projectData.id) || p.slug === String(projectData.id));
    if (idx !== -1) {
      projects[idx] = { ...projects[idx], ...projectData };
      return projects[idx];
    }
  }
  const newProject = {
    id: Date.now(), name, slug, url, short_description, full_description, image_url,
    gallery_images, category, tags, technologies, status, featured, embed_mode,
    sort_order, seo_title, seo_description, seo_keywords, og_image_url,
    created_at: new Date().toISOString()
  };
  projects.unshift(newProject);
  return newProject;
}

export async function deleteProjectData(id: any) {
  await ensureDbInitialized();
  if (hasValidDbConfig) {
    try {
      await query('DELETE FROM projects WHERE id = $1 OR slug = $2', [Number(id) || 0, String(id)]);
    } catch (e) {
      console.warn('DB deleteProjectData failed:', e);
    }
  }
  const idx = projects.findIndex((p) => String(p.id) === String(id) || p.slug === String(id));
  if (idx !== -1) projects.splice(idx, 1);
  return true;
}

// ==================== CATEGORIES DATA LAYER ==================== //

export async function getBlogCategoriesData() {
  await ensureDbInitialized();
  if (hasValidDbConfig) {
    try {
      const res = await query('SELECT name FROM categories ORDER BY name ASC');
      if (res.rows.length > 0) {
        blogCategories = res.rows.map((r: any) => r.name);
        return blogCategories;
      }
    } catch (e) {
      console.warn('DB getBlogCategoriesData failed:', e);
    }
  }
  return blogCategories;
}

export async function addBlogCategoryData(name: string) {
  await ensureDbInitialized();
  const trimmed = String(name || '').trim();
  if (!trimmed) return blogCategories;

  if (hasValidDbConfig) {
    try {
      const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await query('INSERT INTO categories (name, slug, type) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [trimmed, slug, 'general']);
    } catch (e) {
      console.warn('DB addBlogCategoryData failed:', e);
    }
  }

  if (!blogCategories.includes(trimmed)) blogCategories.push(trimmed);
  return blogCategories;
}

export async function editBlogCategoryData(oldName: string, newName: string) {
  await ensureDbInitialized();
  const trimmed = String(newName || '').trim();
  if (!trimmed) return blogCategories;

  if (hasValidDbConfig) {
    try {
      const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await query('UPDATE categories SET name = $1, slug = $2 WHERE name = $3', [trimmed, slug, oldName]);
      await query('UPDATE articles SET category = $1 WHERE category = $2', [trimmed, oldName]);
    } catch (e) {
      console.warn('DB editBlogCategoryData failed:', e);
    }
  }

  const idx = blogCategories.indexOf(oldName);
  if (idx !== -1) blogCategories[idx] = trimmed;
  articles.forEach((art) => {
    if (art.category === oldName) art.category = trimmed;
  });
  return blogCategories;
}

// ==================== BLOG ARTICLES DATA LAYER ==================== //

export async function getArticlesData(filters?: { category?: string; search?: string; status?: string }) {
  await ensureDbInitialized();
  if (hasValidDbConfig) {
    try {
      let sql = 'SELECT * FROM articles WHERE 1=1';
      const params: any[] = [];

      if (filters?.status && filters.status !== 'all') {
        params.push(filters.status);
        sql += ` AND status = $${params.length}`;
      }
      if (filters?.category && filters.category !== 'All') {
        params.push(filters.category);
        sql += ` AND category = $${params.length}`;
      }
      if (filters?.search) {
        params.push(`%${filters.search}%`);
        sql += ` AND (title ILIKE $${params.length} OR summary ILIKE $${params.length} OR content ILIKE $${params.length})`;
      }
      sql += ' ORDER BY published_at DESC, created_at DESC';

      const res = await query(sql, params);
      articles = res.rows;
      return res.rows;
    } catch (e) {
      console.warn('DB getArticlesData failed:', e);
    }
  }

  let result = [...articles];
  if (filters?.status && filters.status !== 'all') result = result.filter((a) => a.status === filters.status);
  if (filters?.category && filters.category !== 'All') result = result.filter((a) => a.category === filters.category);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    result = result.filter((a) => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q));
  }
  return result;
}

export async function saveArticleData(articleData: any) {
  await ensureDbInitialized();
  const title = articleData.title || 'New Article';
  const slug = articleData.slug || `article-${Date.now()}`;
  const summary = articleData.summary || '';
  const content = articleData.content || '';
  const featured_image_url = articleData.featured_image_url || 'https://i.postimg.cc/Hnj1LYRT/online-banks.png';
  const category = articleData.category || 'Technology';
  const tags = typeof articleData.tags === 'string' ? articleData.tags : JSON.stringify(articleData.tags || []);
  const author_name = articleData.author_name || 'Benir Benjamin';
  const status = articleData.status || 'published';
  const seo_title = articleData.seo_title || title;
  const seo_description = articleData.seo_description || summary || title;
  const seo_keywords = articleData.seo_keywords || '';
  const canonical_url = articleData.canonical_url || '';
  const og_image_url = articleData.og_image_url || featured_image_url;

  if (hasValidDbConfig) {
    try {
      if (articleData.id) {
        const res = await query(
          `UPDATE articles SET 
            title = $1, slug = $2, summary = $3, content = $4, featured_image_url = $5,
            category = $6, tags = $7, author_name = $8, status = $9, seo_title = $10,
            seo_description = $11, seo_keywords = $12, canonical_url = $13, og_image_url = $14,
            updated_at = CURRENT_TIMESTAMP
           WHERE id = $15 OR slug = $2 RETURNING *`,
          [
            title, slug, summary, content, featured_image_url, category, tags,
            author_name, status, seo_title, seo_description, seo_keywords,
            canonical_url, og_image_url, Number(articleData.id) || 0
          ]
        );
        if (res.rowCount > 0) {
          const idx = articles.findIndex((a) => a.id === res.rows[0].id);
          if (idx !== -1) articles[idx] = res.rows[0];
          else articles.unshift(res.rows[0]);
          return res.rows[0];
        }
      }

      const res = await query(
        `INSERT INTO articles 
          (title, slug, summary, content, featured_image_url, category, tags, author_name, status, seo_title, seo_description, seo_keywords, canonical_url, og_image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING *`,
        [
          title, slug, summary, content, featured_image_url, category, tags,
          author_name, status, seo_title, seo_description, seo_keywords, canonical_url, og_image_url
        ]
      );
      articles.unshift(res.rows[0]);
      return res.rows[0];
    } catch (e) {
      console.warn('DB saveArticleData failed:', e);
    }
  }

  // Memory fallback
  if (articleData.id) {
    const idx = articles.findIndex((a) => a.id === Number(articleData.id) || a.slug === String(articleData.id));
    if (idx !== -1) {
      articles[idx] = { ...articles[idx], ...articleData };
      return articles[idx];
    }
  }
  const newArticle = {
    id: Date.now(), title, slug, summary, content, featured_image_url, category, tags,
    author_name, status, published_at: new Date().toISOString(), created_at: new Date().toISOString(),
    views_count: 0, comments_count: 0
  };
  articles.unshift(newArticle);
  return newArticle;
}

export async function deleteArticleData(id: any) {
  await ensureDbInitialized();
  if (hasValidDbConfig) {
    try {
      await query('DELETE FROM articles WHERE id = $1 OR slug = $2', [Number(id) || 0, String(id)]);
    } catch (e) {
      console.warn('DB deleteArticleData failed:', e);
    }
  }
  const idx = articles.findIndex((a) => String(a.id) === String(id) || a.slug === String(id));
  if (idx !== -1) articles.splice(idx, 1);
  return true;
}

export async function updateArticleStatusData(id: any, status: string) {
  await ensureDbInitialized();
  if (hasValidDbConfig) {
    try {
      const res = await query(
        'UPDATE articles SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 OR slug = $3 RETURNING *',
        [status, Number(id) || 0, String(id)]
      );
      if (res.rowCount > 0) return res.rows[0];
    } catch (e) {
      console.warn('DB updateArticleStatusData failed:', e);
    }
  }
  const idx = articles.findIndex((a) => String(a.id) === String(id) || a.slug === String(id));
  if (idx !== -1) {
    articles[idx].status = status;
    return articles[idx];
  }
  return { id, status };
}

export async function incrementArticleViewCount(articleIdOrSlug: any) {
  await ensureDbInitialized();
  if (hasValidDbConfig) {
    try {
      const res = await query(
        'UPDATE articles SET views_count = COALESCE(views_count, 0) + 1 WHERE id = $1 OR slug = $2 RETURNING views_count',
        [Number(articleIdOrSlug) || 0, String(articleIdOrSlug)]
      );
      if (res.rowCount > 0) return res.rows[0].views_count;
    } catch (e) {
      console.warn('DB incrementArticleViewCount failed:', e);
    }
  }

  const art = articles.find((a) => String(a.id) === String(articleIdOrSlug) || a.slug === String(articleIdOrSlug));
  if (art) {
    art.views_count = (art.views_count || 0) + 1;
    return art.views_count;
  }
  return 1;
}

// ==================== COMMENTS & MODERATION DATA LAYER ==================== //

export async function getArticleCommentsData(articleId: any, isAdmin: boolean = false) {
  await ensureDbInitialized();
  if (hasValidDbConfig) {
    try {
      const res = await query(
        `SELECT * FROM article_comments 
         WHERE (article_id = $1 OR article_id IN (SELECT id FROM articles WHERE slug = $2))
         ORDER BY created_at ASC`,
        [Number(articleId) || 0, String(articleId)]
      );
      
      const filtered = isAdmin ? res.rows : res.rows.filter((c: any) => c.status === 'approved');
      const commentMap = new Map<string, any>();
      filtered.forEach((c: any) => commentMap.set(c.id, { ...c, replies: [] }));
      const rootComments: any[] = [];
      commentMap.forEach((c) => {
        if (c.parent_id && commentMap.has(c.parent_id)) {
          commentMap.get(c.parent_id).replies.push(c);
        } else {
          rootComments.push(c);
        }
      });
      return rootComments;
    } catch (e) {
      console.warn('DB getArticleCommentsData failed:', e);
    }
  }

  const numericId = Number(articleId);
  const targetArticles = articles.filter((a) => a.id === numericId || a.slug === String(articleId));
  const targetId = targetArticles.length > 0 ? targetArticles[0].id : numericId;

  const filtered = articleComments.filter((c) => {
    const matchesArticle = Number(c.article_id) === Number(targetId);
    if (!matchesArticle) return false;
    if (isAdmin) return true;
    return c.status === 'approved';
  });

  const commentMap = new Map<string, any>();
  filtered.forEach((c) => commentMap.set(c.id, { ...c, replies: [] }));
  const rootComments: any[] = [];
  commentMap.forEach((c) => {
    if (c.parent_id && commentMap.has(c.parent_id)) {
      commentMap.get(c.parent_id).replies.push(c);
    } else {
      rootComments.push(c);
    }
  });

  return rootComments;
}

export async function getAllCommentsData() {
  await ensureDbInitialized();
  if (hasValidDbConfig) {
    try {
      const res = await query(
        `SELECT c.*, COALESCE(a.title, 'Article #' || c.article_id) as article_title 
         FROM article_comments c 
         LEFT JOIN articles a ON c.article_id = a.id 
         ORDER BY c.created_at DESC`
      );
      if (res.rows.length > 0) return res.rows;
    } catch (e) {
      console.warn('DB getAllCommentsData failed:', e);
    }
  }

  return articleComments.map((c) => {
    const art = articles.find((a) => a.id === Number(c.article_id));
    return { ...c, article_title: art ? art.title : `Article #${c.article_id}` };
  });
}

export async function saveCommentData(commentData: {
  article_id: number;
  parent_id?: string | null;
  author_name: string;
  content: string;
  is_admin_reply?: boolean;
  user_ip?: string;
}) {
  await ensureDbInitialized();
  const newId = `c_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const author_name = commentData.author_name.trim();
  const content = commentData.content.trim();
  const is_admin_reply = Boolean(commentData.is_admin_reply);
  const user_ip = commentData.user_ip || '127.0.0.1';

  if (hasValidDbConfig) {
    try {
      const res = await query(
        `INSERT INTO article_comments (id, article_id, parent_id, author_name, content, likes_count, status, is_admin_reply, user_ip)
         VALUES ($1, $2, $3, $4, $5, 0, 'approved', $6, $7) RETURNING *`,
        [newId, Number(commentData.article_id), commentData.parent_id || null, author_name, content, is_admin_reply, user_ip]
      );
      await query('UPDATE articles SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = $1', [Number(commentData.article_id)]);
      articleComments.unshift(res.rows[0]);
      return res.rows[0];
    } catch (e) {
      console.warn('DB saveCommentData failed:', e);
    }
  }

  const newComment = {
    id: newId,
    article_id: Number(commentData.article_id),
    parent_id: commentData.parent_id || null,
    author_name,
    content,
    likes_count: 0,
    status: 'approved',
    is_admin_reply,
    user_ip,
    created_at: new Date().toISOString()
  };

  articleComments.unshift(newComment);
  const art = articles.find((a) => a.id === Number(commentData.article_id));
  if (art) art.comments_count = (art.comments_count || 0) + 1;
  return newComment;
}

export async function likeCommentData(commentId: string) {
  await ensureDbInitialized();
  if (hasValidDbConfig) {
    try {
      const res = await query(
        'UPDATE article_comments SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = $1 RETURNING likes_count',
        [commentId]
      );
      if (res.rowCount > 0) return res.rows[0].likes_count;
    } catch (e) {
      console.warn('DB likeCommentData failed:', e);
    }
  }

  const c = articleComments.find((item) => item.id === commentId);
  if (c) {
    c.likes_count = (c.likes_count || 0) + 1;
    return c.likes_count;
  }
  return 0;
}

export async function updateCommentStatusData(commentId: string, status: 'approved' | 'hidden' | 'flagged') {
  await ensureDbInitialized();
  if (hasValidDbConfig) {
    try {
      const res = await query(
        'UPDATE article_comments SET status = $1 WHERE id = $2 RETURNING *',
        [status, commentId]
      );
      if (res.rowCount > 0) return res.rows[0];
    } catch (e) {
      console.warn('DB updateCommentStatusData failed:', e);
    }
  }

  const c = articleComments.find((item) => item.id === commentId);
  if (c) {
    c.status = status;
    return c;
  }
  return null;
}

export async function deleteCommentData(commentId: string) {
  await ensureDbInitialized();
  if (hasValidDbConfig) {
    try {
      await query('DELETE FROM article_comments WHERE id = $1 OR parent_id = $1', [commentId]);
    } catch (e) {
      console.warn('DB deleteCommentData failed:', e);
    }
  }

  const idx = articleComments.findIndex((c) => c.id === commentId);
  if (idx !== -1) {
    const [deleted] = articleComments.splice(idx, 1);
    articleComments = articleComments.filter((c) => c.parent_id !== commentId);
    return deleted;
  }
  return null;
}

export async function banUserIpData(ip: string) {
  await ensureDbInitialized();
  if (ip && !bannedIps.includes(ip)) bannedIps.push(ip);
  if (hasValidDbConfig && ip) {
    try {
      await query('INSERT INTO banned_ips (ip) VALUES ($1) ON CONFLICT DO NOTHING', [ip]);
    } catch (e) {
      console.warn('DB banUserIpData failed:', e);
    }
  }
  return true;
}

export async function isIpBanned(ip: string) {
  await ensureDbInitialized();
  if (hasValidDbConfig && ip) {
    try {
      const res = await query('SELECT ip FROM banned_ips WHERE ip = $1', [ip]);
      if (res.rowCount > 0) return true;
    } catch (e) {
      console.warn('DB isIpBanned failed:', e);
    }
  }
  return bannedIps.includes(ip);
}

// ==================== REAL-TIME VISITOR ANALYTICS DATA LAYER ==================== //

export async function recordAnalyticsEvent(eventData: any) {
  await ensureDbInitialized();
  const event_type = eventData.event_type || 'page_view';
  const page_url = eventData.page_url || '/';
  const page_type = eventData.page_type || 'general';
  const project_id = eventData.project_id ? Number(eventData.project_id) : null;
  const article_id = eventData.article_id ? Number(eventData.article_id) : null;
  const referrer = eventData.referrer || 'Direct';
  const user_agent = eventData.user_agent || '';
  const device_type = eventData.device_type || 'desktop';
  const browser = eventData.browser || 'Chrome';
  const os = eventData.os || 'Windows';
  const session_id = eventData.session_id || `sess_${Date.now()}`;

  if (hasValidDbConfig) {
    try {
      const res = await query(
        `INSERT INTO analytics_events 
          (event_type, page_url, page_type, project_id, article_id, referrer, user_agent, device_type, browser, os, session_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [event_type, page_url, page_type, project_id, article_id, referrer, user_agent, device_type, browser, os, session_id]
      );
      analyticsEvents.unshift(res.rows[0]);
      if (analyticsEvents.length > 5000) analyticsEvents = analyticsEvents.slice(0, 5000);
      return sanitizeForJson(res.rows[0]);
    } catch (e) {
      console.warn('DB recordAnalyticsEvent failed:', e);
    }
  }

  const newEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    event_type, page_url, page_type, project_id, article_id, referrer,
    user_agent, device_type, browser, os, session_id,
    created_at: new Date().toISOString()
  };
  analyticsEvents.unshift(newEvent);
  if (analyticsEvents.length > 5000) analyticsEvents = analyticsEvents.slice(0, 5000);
  return sanitizeForJson(newEvent);
}

export function sanitizeForJson<T = any>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return Number(obj) as any;
  if (typeof obj === 'number' || typeof obj === 'string' || typeof obj === 'boolean') return obj;
  if (obj instanceof Date) return obj.toISOString() as any;
  if (Array.isArray(obj)) return obj.map(sanitizeForJson) as any;
  if (typeof obj === 'object') {
    const res: any = {};
    for (const key of Object.keys(obj)) {
      res[key] = sanitizeForJson((obj as any)[key]);
    }
    return res;
  }
  return obj;
}

export function parseNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'bigint') return Number(val);
  if (typeof val === 'number') return Number.isNaN(val) ? 0 : val;
  const str = String(val);
  const parsed = parseInt(str, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export async function getAnalyticsStatsData(range: string = '30d') {
  await ensureDbInitialized();

  // PostgreSQL Query Path
  if (hasValidDbConfig) {
    try {
      let dateFilter = "created_at >= NOW() - INTERVAL '30 days'";
      if (range === 'today') {
        dateFilter = "created_at >= CURRENT_DATE";
      } else if (range === 'yesterday') {
        dateFilter = "created_at >= CURRENT_DATE - INTERVAL '1 day' AND created_at < CURRENT_DATE";
      } else if (range === '7d') {
        dateFilter = "created_at >= NOW() - INTERVAL '7 days'";
      } else if (range === '30d') {
        dateFilter = "created_at >= NOW() - INTERVAL '30 days'";
      } else if (range === 'year') {
        dateFilter = "created_at >= NOW() - INTERVAL '1 year'";
      } else if (range === 'all') {
        dateFilter = "1=1";
      }

      const totalViews = await query(`SELECT COUNT(*) as count FROM analytics_events WHERE ${dateFilter} AND event_type = 'page_view'`);
      const uniqueVisitors = await query(`SELECT COUNT(DISTINCT session_id) as count FROM analytics_events WHERE ${dateFilter}`);
      const externalClicks = await query(`SELECT COUNT(*) as count FROM analytics_events WHERE ${dateFilter} AND event_type = 'project_external_click'`);

      const topProjectsRes = await query(
        `SELECT p.name, p.slug, COUNT(e.id) as clicks 
         FROM analytics_events e 
         JOIN projects p ON e.project_id = p.id 
         WHERE e.event_type = 'project_external_click' AND ${dateFilter.replace(/created_at/g, 'e.created_at')}
         GROUP BY p.id, p.name, p.slug 
         ORDER BY clicks DESC LIMIT 5`
      );

      const topArticlesRes = await query(
        `SELECT a.title, a.slug, a.category, COUNT(e.id) as views 
         FROM analytics_events e 
         JOIN articles a ON e.article_id = a.id 
         WHERE e.event_type = 'page_view' AND ${dateFilter.replace(/created_at/g, 'e.created_at')}
         GROUP BY a.id, a.title, a.slug, a.category 
         ORDER BY views DESC LIMIT 5`
      );

      const sourcesRes = await query(
        `SELECT COALESCE(referrer, 'Direct') as source, COUNT(*) as count 
         FROM analytics_events 
         WHERE ${dateFilter}
         GROUP BY 1 ORDER BY count DESC LIMIT 5`
      );

      const pagesRes = await query(
        `SELECT UPPER(REPLACE(page_type, '_', ' ')) as page_type, COUNT(*) as count 
         FROM analytics_events 
         WHERE ${dateFilter} AND event_type = 'page_view'
         GROUP BY page_type ORDER BY count DESC`
      );

      const devicesRes = await query(
        `SELECT device_type, COUNT(*) as count 
         FROM analytics_events 
         WHERE ${dateFilter}
         GROUP BY device_type ORDER BY count DESC`
      );

      const browsersRes = await query(
        `SELECT browser, COUNT(*) as count 
         FROM analytics_events 
         WHERE ${dateFilter}
         GROUP BY browser ORDER BY count DESC`
      );

      const recentActivityRes = await query(
        `SELECT id, event_type, page_url, device_type, browser, os, created_at 
         FROM analytics_events 
         WHERE ${dateFilter} 
         ORDER BY created_at DESC LIMIT 10`
      );

      let totalViewsNum = parseNumber(totalViews.rows[0]?.count);
      let uniqueVisitorsNum = parseNumber(uniqueVisitors.rows[0]?.count);
      let externalClicksNum = parseNumber(externalClicks.rows[0]?.count);

      if (totalViewsNum === 0 && uniqueVisitorsNum === 0) {
        for (const evt of analyticsEvents) {
          try {
            await query(
              `INSERT INTO analytics_events 
                (event_type, page_url, page_type, project_id, article_id, referrer, user_agent, device_type, browser, os, session_id, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
              [
                evt.event_type, evt.page_url, evt.page_type, evt.project_id || null, evt.article_id || null,
                evt.referrer, evt.user_agent, evt.device_type, evt.browser, evt.os,
                evt.session_id, evt.created_at
              ]
            );
          } catch (e) {
            console.warn('Auto seed event warning:', e);
          }
        }

        const tv = await query(`SELECT COUNT(*) as count FROM analytics_events WHERE ${dateFilter} AND event_type = 'page_view'`);
        const uv = await query(`SELECT COUNT(DISTINCT session_id) as count FROM analytics_events WHERE ${dateFilter}`);
        const ec = await query(`SELECT COUNT(*) as count FROM analytics_events WHERE ${dateFilter} AND event_type = 'project_external_click'`);
        const tp = await query(`SELECT p.name, p.slug, COUNT(e.id) as clicks FROM analytics_events e JOIN projects p ON e.project_id = p.id WHERE e.event_type = 'project_external_click' AND ${dateFilter.replace(/created_at/g, 'e.created_at')} GROUP BY p.id, p.name, p.slug ORDER BY clicks DESC LIMIT 5`);
        const ta = await query(`SELECT a.title, a.slug, a.category, COUNT(e.id) as views FROM analytics_events e JOIN articles a ON e.article_id = a.id WHERE e.event_type = 'page_view' AND ${dateFilter.replace(/created_at/g, 'e.created_at')} GROUP BY a.id, a.title, a.slug, a.category ORDER BY views DESC LIMIT 5`);
        const sr = await query(`SELECT COALESCE(referrer, 'Direct') as source, COUNT(*) as count FROM analytics_events WHERE ${dateFilter} GROUP BY 1 ORDER BY count DESC LIMIT 5`);
        const pg = await query(`SELECT UPPER(REPLACE(page_type, '_', ' ')) as page_type, COUNT(*) as count FROM analytics_events WHERE ${dateFilter} AND event_type = 'page_view' GROUP BY page_type ORDER BY count DESC`);
        const dv = await query(`SELECT device_type, COUNT(*) as count FROM analytics_events WHERE ${dateFilter} GROUP BY device_type ORDER BY count DESC`);
        const br = await query(`SELECT browser, COUNT(*) as count FROM analytics_events WHERE ${dateFilter} GROUP BY browser ORDER BY count DESC`);
        const ra = await query(`SELECT id, event_type, page_url, device_type, browser, os, created_at FROM analytics_events WHERE ${dateFilter} ORDER BY created_at DESC LIMIT 10`);

        totalViewsNum = parseNumber(tv.rows[0]?.count);
        uniqueVisitorsNum = parseNumber(uv.rows[0]?.count);
        externalClicksNum = parseNumber(ec.rows[0]?.count);
        topProjectsRes.rows = tp.rows;
        topArticlesRes.rows = ta.rows;
        sourcesRes.rows = sr.rows;
        pagesRes.rows = pg.rows;
        devicesRes.rows = dv.rows;
        browsersRes.rows = br.rows;
        recentActivityRes.rows = ra.rows;
      }

      const avgViewsPerSession = uniqueVisitorsNum > 0 ? Number((totalViewsNum / uniqueVisitorsNum).toFixed(1)) : 0;
      const bounceRate = totalViewsNum > 0 ? Math.round(((totalViewsNum - uniqueVisitorsNum) / totalViewsNum) * 100) : 0;

      return sanitizeForJson({
        overview: {
          total_views: totalViewsNum,
          unique_visitors: uniqueVisitorsNum,
          external_clicks: externalClicksNum,
          avg_views_per_session: avgViewsPerSession,
          bounce_rate: bounceRate
        },
        top_projects: topProjectsRes.rows.map((r: any) => ({ ...r, clicks: parseNumber(r.clicks) })),
        top_articles: topArticlesRes.rows.map((r: any) => ({ ...r, views: parseNumber(r.views) })),
        sources: sourcesRes.rows.map((r: any) => ({ ...r, count: parseNumber(r.count) })),
        pages: pagesRes.rows.map((r: any) => ({ ...r, count: parseNumber(r.count) })),
        devices: devicesRes.rows.map((r: any) => ({ ...r, count: parseNumber(r.count) })),
        browsers: browsersRes.rows.map((r: any) => ({ ...r, count: parseNumber(r.count) })),
        recent_activity: recentActivityRes.rows.map((r: any) => sanitizeForJson(r))
      });
    } catch (e) {
      console.warn('DB getAnalyticsStatsData failed, falling back to memory:', e);
    }
  }

  // Memory Calculation Path
  const now = new Date();
  let startMs: number | null = null;
  let endMs: number | null = null;

  if (range === 'today') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    startMs = start.getTime();
  } else if (range === 'yesterday') {
    const start = new Date();
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    startMs = start.getTime();

    const end = new Date();
    end.setHours(0, 0, 0, 0);
    endMs = end.getTime();
  } else if (range === '7d') {
    startMs = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  } else if (range === '30d') {
    startMs = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  } else if (range === 'year') {
    startMs = now.getTime() - 365 * 24 * 60 * 60 * 1000;
  }

  const filtered = analyticsEvents.filter((e) => {
    const t = new Date(e.created_at).getTime();
    if (startMs !== null && t < startMs) return false;
    if (endMs !== null && t >= endMs) return false;
    return true;
  });

  const pageViews = filtered.filter((e) => e.event_type === 'page_view');
  const externalClicks = filtered.filter((e) => e.event_type === 'project_external_click');
  const uniqueSessionsMap = new Map<string, number>();

  filtered.forEach((e) => {
    if (e.session_id) uniqueSessionsMap.set(e.session_id, (uniqueSessionsMap.get(e.session_id) || 0) + 1);
  });

  const totalUniqueVisitors = uniqueSessionsMap.size;
  let singlePageSessions = 0;
  uniqueSessionsMap.forEach((c) => { if (c === 1) singlePageSessions++; });

  const bounceRate = totalUniqueVisitors > 0 ? Math.round((singlePageSessions / totalUniqueVisitors) * 100) : 0;
  const avgViewsPerSession = totalUniqueVisitors > 0 ? Number((pageViews.length / totalUniqueVisitors).toFixed(1)) : 0;

  const projectClickCounts = new Map<number, number>();
  externalClicks.forEach((e) => {
    if (e.project_id) projectClickCounts.set(e.project_id, (projectClickCounts.get(e.project_id) || 0) + 1);
  });

  const top_projects = projects.map((p) => ({
    name: p.name, slug: p.slug, clicks: projectClickCounts.get(p.id) || 0
  })).sort((a, b) => b.clicks - a.clicks);

  const articleViewCounts = new Map<number, number>();
  pageViews.forEach((e) => {
    if (e.article_id) articleViewCounts.set(e.article_id, (articleViewCounts.get(e.article_id) || 0) + 1);
  });

  const top_articles = articles.map((a) => ({
    title: a.title, slug: a.slug, views: articleViewCounts.get(a.id) || (a.views_count || 0), category: a.category
  })).sort((a, b) => b.views - a.views);

  const sourceCounts = new Map<string, number>();
  filtered.forEach((e) => {
    let src = 'Direct / Bookmark';
    if (e.referrer && e.referrer !== 'Direct' && !e.referrer.includes('benix.space') && !e.referrer.includes('localhost')) {
      if (e.referrer.includes('google')) src = 'Google Search';
      else if (e.referrer.includes('facebook')) src = 'Facebook';
      else if (e.referrer.includes('instagram')) src = 'Instagram';
      else if (e.referrer.includes('x.com') || e.referrer.includes('twitter')) src = 'X (Twitter)';
      else if (e.referrer.includes('youtube')) src = 'YouTube';
      else {
        try { src = new URL(e.referrer).hostname; } catch { src = 'Direct / Bookmark'; }
      }
    }
    sourceCounts.set(src, (sourceCounts.get(src) || 0) + 1);
  });

  const sources = Array.from(sourceCounts.entries()).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count);

  const pageTypeCounts = new Map<string, number>();
  pageViews.forEach((e) => {
    const pType = e.page_type || 'general';
    pageTypeCounts.set(pType, (pageTypeCounts.get(pType) || 0) + 1);
  });

  const pages = Array.from(pageTypeCounts.entries()).map(([page_type, count]) => ({
    page_type: page_type.replace('_', ' ').toUpperCase(), count
  })).sort((a, b) => b.count - a.count);

  const deviceCounts = new Map<string, number>();
  filtered.forEach((e) => {
    const dev = (e.device_type || 'desktop').toLowerCase();
    deviceCounts.set(dev, (deviceCounts.get(dev) || 0) + 1);
  });

  const devices = Array.from(deviceCounts.entries()).map(([device_type, count]) => ({ device_type, count })).sort((a, b) => b.count - a.count);

  const browserCounts = new Map<string, number>();
  filtered.forEach((e) => {
    const br = e.browser || 'Chrome';
    browserCounts.set(br, (browserCounts.get(br) || 0) + 1);
  });

  const browsers = Array.from(browserCounts.entries()).map(([browser, count]) => ({ browser, count })).sort((a, b) => b.count - a.count);

  const recent_activity = filtered.slice(0, 10).map((e) => ({
    id: e.id, event_type: e.event_type, page_url: e.page_url, device_type: e.device_type,
    browser: e.browser, os: e.os, created_at: e.created_at
  }));

  return sanitizeForJson({
    overview: {
      total_views: pageViews.length,
      unique_visitors: totalUniqueVisitors,
      external_clicks: externalClicks.length,
      avg_views_per_session: avgViewsPerSession,
      bounce_rate: bounceRate
    },
    top_projects,
    top_articles,
    sources,
    pages,
    devices,
    browsers,
    recent_activity
  });
}
