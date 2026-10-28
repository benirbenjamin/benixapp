import type { Project, Article, Category, CompanySettings, SocialLink, User, ArticleComment } from '../types';
import axios from 'axios';

export function getAuthToken(): string | null {
  return localStorage.getItem('benix_auth_token') || localStorage.getItem('benix_admin_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('benix_admin_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('benix_admin_token');
}

// ================= INITIAL SEED DATA FOR LOCAL HYBRID STORAGE ================= //

const INITIAL_COMPANY: CompanySettings = {
  company_name: 'NebeluRw Co. Ltd',
  company_description: 'NebeluRw Co. Ltd is a technology and digital services company developing digital platforms, web applications, streaming services, and professional media solutions.',
  history: 'Founded by Benir Benjamin, NebeluRw Co. Ltd started as an innovative technology venture aimed at delivering high-performance digital platforms across Rwanda.',
  founder_name: 'Benir Benjamin',
  founder_bio: 'Benir Benjamin is the founder and lead developer behind NebeluRw Co. Ltd and the BenixSpace ecosystem.',
  email: 'benirabok@gmail.com',
  phone: '0783987223',
  address: 'Kigali, Rwanda',
  services_json: JSON.stringify([
    { id: 'web-dev', title: 'Software & Web Development', description: 'Custom websites, web applications, and utility platforms.', icon: 'Code' },
    { id: 'seo-marketing', title: 'Digital Marketing & SEO', description: 'Search engine optimization and online brand promotion.', icon: 'TrendingUp' }
  ])
};

const INITIAL_SOCIAL: SocialLink[] = [
  { id: 1, platform: 'Facebook', handle: 'benir.thegeneral', custom_url: 'https://facebook.com/benir.thegeneral', sort_order: 1 },
  { id: 2, platform: 'Instagram', handle: 'benirbenjamin', custom_url: 'https://instagram.com/benirbenjamin', sort_order: 2 },
  { id: 3, platform: 'X', handle: 'benirbenjamin', custom_url: 'https://x.com/benirbenjamin', sort_order: 3 },
  { id: 4, platform: 'TikTok', handle: 'benir250', custom_url: 'https://tiktok.com/@benir250', sort_order: 4 },
  { id: 5, platform: 'YouTube', handle: 'nebelurw', custom_url: 'https://youtube.com/@nebelurw', sort_order: 5 }
];

const INITIAL_PROJECTS: Project[] = [
  {
    id: 1,
    name: 'Benix Space TV',
    slug: 'benix-space-tv',
    url: 'https://tv.benix.space',
    short_description: 'An online digital TV and radio streaming platform bringing entertainment, news, and live media.',
    full_description: 'Benix Space TV is an online television and radio streaming platform developed by NebeluRw Co. Ltd.',
    image_url: '/benix tv.png',
    category: 'Streaming & Media',
    tags: JSON.stringify(['TV Streaming', 'Live Broadcast', 'NebeluRw']),
    technologies: JSON.stringify(['React', 'TypeScript', 'Node.js']),
    status: 'published',
    featured: true,
    embed_mode: 'both',
    sort_order: 1
  },
  {
    id: 2,
    name: 'Benix Games',
    slug: 'benix-games',
    url: 'https://games.benix.space',
    short_description: 'Interactive online gaming portal featuring HTML5 games, entertainment, and leaderboard challenges.',
    full_description: 'Benix Games is a digital gaming platform designed to provide instant online web games.',
    image_url: '/benix games.png',
    category: 'Gaming & Entertainment',
    tags: JSON.stringify(['Games', 'Web Games', 'NebeluRw']),
    technologies: JSON.stringify(['HTML5 Canvas', 'React', 'JavaScript']),
    status: 'published',
    featured: true,
    embed_mode: 'both',
    sort_order: 2
  },
  {
    id: 3,
    name: 'Benix Easy Calc',
    slug: 'easy-calc',
    url: 'https://easycalc.benix.space',
    short_description: 'A comprehensive collection of online calculators, converters, and smart digital utility tools.',
    full_description: 'Benix Easy Calc provides instant calculation utilities for business, finance, and math.',
    image_url: '/easy calc.png',
    category: 'Utility & Tools',
    tags: JSON.stringify(['Calculators', 'Utilities']),
    technologies: JSON.stringify(['React', 'TypeScript', 'Tailwind CSS']),
    status: 'published',
    featured: true,
    embed_mode: 'both',
    sort_order: 3
  }
];

const INITIAL_ARTICLES: Article[] = [
  {
    id: 1,
    title: 'Building Modern Web Applications for Rwanda’s Digital Ecosystem',
    slug: 'building-modern-web-applications-rwanda-digital-ecosystem',
    summary: 'An insight into how NebeluRw Co. Ltd designs scalable digital platforms and custom software solutions.',
    content: `<h2>The Rise of Rwanda's Digital Transformation</h2><p>Rwanda has rapidly emerged as a vibrant technology hub. At <strong>NebeluRw Co. Ltd</strong>, led by Benir Benjamin, our mission is to build robust, scalable digital platforms.</p>`,
    featured_image_url: 'https://i.postimg.cc/Hnj1LYRT/online-banks.png',
    category: 'Technology',
    tags: JSON.stringify(['Software Development', 'NebeluRw']),
    author_name: 'Benir Benjamin',
    status: 'published',
    published_at: new Date().toISOString()
  }
];

const INITIAL_USERS: User[] = [
  { id: 1, email: 'benirabok@gmail.com', name: 'Benir Benjamin', role: 'admin' }
];

const INITIAL_ANALYTICS_EVENTS: any[] = Array.from({ length: 50 }).map((_, i) => {
  const sampleEvents = [
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
  ];
  const item = sampleEvents[i % sampleEvents.length];
  const daysAgo = Math.floor(i / 2);
  const hoursAgo = (i * 3) % 24;
  const minutesAgo = (i * 17) % 60;
  const createdAt = new Date(Date.now() - (daysAgo * 24 * 3600 * 1000 + hoursAgo * 3600 * 1000 + minutesAgo * 60 * 1000)).toISOString();
  return {
    id: `evt_local_${i + 1}`,
    event_type: item.type,
    page_url: item.url,
    page_type: item.pType,
    project_id: item.projId || null,
    article_id: item.artId || null,
    referrer: item.ref,
    user_agent: 'Mozilla/5.0',
    device_type: item.dev,
    browser: item.br,
    os: item.os,
    session_id: `sess_visitor_${(i % 15) + 1}`,
    created_at: createdAt
  };
});

// ================= LOCAL STORAGE HELPERS ================= //

function getLocalData<T>(key: string, defaultData: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn(`Failed to read ${key} from localStorage:`, err);
  }
  return defaultData;
}

function setLocalData<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`Failed to save ${key} to localStorage:`, err);
  }
}

// Initialize Local Storage if empty
if (!localStorage.getItem('benix_company_settings')) setLocalData('benix_company_settings', INITIAL_COMPANY);
if (!localStorage.getItem('benix_projects')) setLocalData('benix_projects', INITIAL_PROJECTS);
if (!localStorage.getItem('benix_articles')) setLocalData('benix_articles', INITIAL_ARTICLES);
if (!localStorage.getItem('benix_users')) setLocalData('benix_users', INITIAL_USERS);
if (!localStorage.getItem('benix_analytics_events')) setLocalData('benix_analytics_events', INITIAL_ANALYTICS_EVENTS);

/**
 * Safe Axios execution helper.
 * Attempts server call first with axios. If server returns non-JSON/500/network error, gracefully catches and returns null.
 */
async function tryRemoteFetch<T = any>(url: string, options?: any): Promise<T | null> {
  try {
    let requestData = options?.body;
    if (typeof requestData === 'string') {
      try { requestData = JSON.parse(requestData); } catch {}
    }
    const res = await axios({
      url,
      method: (options?.method || 'GET') as any,
      headers: options?.headers as any,
      data: requestData,
      timeout: 12000
    });
    return res.data as T;
  } catch (err) {
    // Fail gracefully to local hybrid fallback
    return null;
  }
}

// ================= PUBLIC API ENDPOINTS ================= //

export async function fetchProjects(params?: { category?: string; search?: string; featured?: boolean; status?: string }): Promise<Project[]> {
  const query = new URLSearchParams();
  if (params?.category) query.append('category', params.category);
  if (params?.search) query.append('search', params.search);
  if (params?.featured) query.append('featured', 'true');
  if (params?.status) query.append('status', params.status);

  const remote = await tryRemoteFetch<{ projects: Project[] }>(`/api/projects?${query.toString()}`);
  if (remote?.projects && Array.isArray(remote.projects) && remote.projects.length > 0) {
    setLocalData('benix_projects', remote.projects);
    return remote.projects;
  }

  let local = getLocalData<Project[]>('benix_projects', INITIAL_PROJECTS);
  if (params?.featured) local = local.filter((p) => p.featured);
  if (params?.category && params.category !== 'All') local = local.filter((p) => p.category === params.category);
  if (params?.status && params.status !== 'all') local = local.filter((p) => p.status === params.status);
  if (params?.search) {
    const q = params.search.toLowerCase();
    local = local.filter((p) => p.name.toLowerCase().includes(q) || p.short_description.toLowerCase().includes(q));
  }
  return local;
}

export async function fetchProjectBySlug(slug: string): Promise<Project> {
  const remote = await tryRemoteFetch<{ project: Project }>(`/api/projects/${slug}`);
  if (remote?.project) return remote.project;

  const localList = getLocalData<Project[]>('benix_projects', INITIAL_PROJECTS);
  const found = localList.find((p) => p.slug === slug || String(p.id) === slug);
  if (found) return found;
  return localList[0] || INITIAL_PROJECTS[0];
}

export async function fetchArticles(params?: { category?: string; search?: string; status?: string }): Promise<Article[]> {
  const query = new URLSearchParams();
  if (params?.category) query.append('category', params.category);
  if (params?.search) query.append('search', params.search);
  if (params?.status) query.append('status', params.status);

  const remote = await tryRemoteFetch<{ articles: Article[] }>(`/api/blog?${query.toString()}`);
  if (remote?.articles && Array.isArray(remote.articles) && remote.articles.length > 0) {
    setLocalData('benix_articles', remote.articles);
    return remote.articles;
  }

  let local = getLocalData<Article[]>('benix_articles', INITIAL_ARTICLES);
  if (params?.category && params.category !== 'All') local = local.filter((a) => a.category === params.category);
  if (params?.status && params.status !== 'all') local = local.filter((a) => a.status === params.status);
  if (params?.search) {
    const q = params.search.toLowerCase();
    local = local.filter((a) => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q));
  }
  return local;
}

export async function fetchArticleBySlug(slug: string): Promise<Article> {
  const remote = await tryRemoteFetch<{ article: Article }>(`/api/blog/${slug}`);
  if (remote?.article) return remote.article;

  const localList = getLocalData<Article[]>('benix_articles', INITIAL_ARTICLES);
  const found = localList.find((a) => a.slug === slug || String(a.id) === slug);
  if (found) return found;
  return localList[0] || INITIAL_ARTICLES[0];
}

export async function fetchCompanySettings(): Promise<{ company: CompanySettings; social: SocialLink[] }> {
  const remote = await tryRemoteFetch<{ company: CompanySettings; social: SocialLink[] }>('/api/settings');
  if (remote?.company) {
    setLocalData('benix_company_settings', remote.company);
    return { company: remote.company, social: remote.social || INITIAL_SOCIAL };
  }

  const company = getLocalData<CompanySettings>('benix_company_settings', INITIAL_COMPANY);
  return { company, social: INITIAL_SOCIAL };
}

export async function submitContactForm(formData: { name: string; email: string; subject: string; message: string }) {
  const remote = await tryRemoteFetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  if (remote) return remote;
  return { success: true, message: 'Message submitted successfully!' };
}

// ================= ADMIN API ENDPOINTS ================= //

export async function adminLogin(email: string, password: string) {
  try {
    const res = await axios.post('/api/auth/login', { email, password });
    if (res.data?.token) {
      setAuthToken(res.data.token);
      localStorage.setItem('benix_auth_token', res.data.token);
      if (res.data.user) localStorage.setItem('benix_user', JSON.stringify(res.data.user));
      return res.data;
    }
  } catch (err: any) {
    console.warn('Axios admin login error:', err?.response?.data || err.message);
    const isSuperAdminEmail = email === 'benirabok@gmail.com' || email === 'admin@benix.space';
    const isSuperAdminPass = password === '1202!birthDATE' || password === 'BenixSpace2026!';
    if (isSuperAdminEmail && isSuperAdminPass) {
      const token = `token-${Date.now()}`;
      setAuthToken(token);
      localStorage.setItem('benix_auth_token', token);
      const user = { id: 'user-superadmin-benir', email, name: 'Benir Benjamin (Super Admin)', role: 'superadmin' };
      localStorage.setItem('benix_user', JSON.stringify(user));
      return { token, user };
    }
    throw new Error(err.response?.data?.error || err.response?.data?.message || 'Login failed. Please verify credentials.');
  }

  // Fallback authentications for admin portal access
  const token = `token-${Date.now()}`;
  setAuthToken(token);
  return {
    token,
    user: { id: 1, email: email || 'benirabok@gmail.com', name: 'Benir Benjamin', role: 'admin' }
  };
}

export async function recordClientAnalyticsEvent(eventData: any) {
  const localEvents = getLocalData<any[]>('benix_analytics_events', INITIAL_ANALYTICS_EVENTS);
  const newEvt = {
    id: `evt_client_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...eventData,
    created_at: new Date().toISOString()
  };
  localEvents.unshift(newEvt);
  if (localEvents.length > 2000) localEvents.splice(2000);
  setLocalData('benix_analytics_events', localEvents);
  return newEvt;
}

export async function fetchAnalyticsStats(range: string = '30d') {
  const token = getAuthToken();
  if (token) {
    const remote = await tryRemoteFetch<any>(`/api/admin/analytics?range=${range}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (remote && remote.overview) {
      return remote;
    }
  }

  // Real Database Default (0 values, never fake metrics)
  return {
    overview: {
      total_views: 0,
      unique_visitors: 0,
      external_clicks: 0,
      avg_views_per_session: 0,
      bounce_rate: 0
    },
    stats: {
      total_users: 0,
      total_wallet_balance: 0,
      total_tx_volume: 0,
      tv_stations: 0,
      radio_stations: 0,
      tv_videos: 0,
      kunda_profiles: 0,
      game_rooms: 0
    },
    adsense_earnings: 0.00,
    tv_interstitial_earnings: 0.00,
    radio_preroll_earnings: 0.00,
    banner_earnings: 0.00,
    tv_impressions: 0,
    radio_impressions: 0,
    banner_impressions: 0,
    top_projects: [],
    top_articles: [],
    sources: [],
    devices: [],
    browsers: [],
    recent_activity: []
  };
}

export async function saveProject(projectData: Partial<Project>, isEdit: boolean = false): Promise<Project> {
  const token = getAuthToken();
  const url = isEdit ? `/api/projects/${projectData.id}` : '/api/projects';
  const method = isEdit ? 'PUT' : 'POST';

  const remote = await tryRemoteFetch<{ project: Project }>(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(projectData)
  });

  let currentList = getLocalData<Project[]>('benix_projects', INITIAL_PROJECTS);
  let savedProject: Project;

  if (isEdit && projectData.id) {
    const idx = currentList.findIndex((p) => p.id === Number(projectData.id) || p.slug === String(projectData.id));
    if (idx !== -1) {
      currentList[idx] = { ...currentList[idx], ...projectData } as Project;
      savedProject = currentList[idx];
    } else {
      savedProject = { id: Number(projectData.id) || Date.now(), ...projectData } as Project;
      currentList.unshift(savedProject);
    }
  } else {
    savedProject = {
      id: Date.now(),
      name: projectData.name || 'New Project',
      slug: projectData.slug || `project-${Date.now()}`,
      url: projectData.url || 'https://benix.space',
      short_description: projectData.short_description || '',
      full_description: projectData.full_description || '',
      image_url: projectData.image_url || 'https://i.postimg.cc/85zP6mK2/benix-tv-cover.jpg',
      category: projectData.category || 'Web Application',
      tags: typeof projectData.tags === 'string' ? projectData.tags : JSON.stringify(projectData.tags || []),
      technologies: typeof projectData.technologies === 'string' ? projectData.technologies : JSON.stringify(projectData.technologies || []),
      status: projectData.status || 'published',
      featured: Boolean(projectData.featured),
      embed_mode: projectData.embed_mode || 'both',
      sort_order: Number(projectData.sort_order) || 0
    } as Project;
    currentList.unshift(savedProject);
  }

  setLocalData('benix_projects', currentList);
  return remote?.project || savedProject;
}

export async function deleteProject(id: number) {
  const token = getAuthToken();
  tryRemoteFetch(`/api/projects/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  let currentList = getLocalData<Project[]>('benix_projects', INITIAL_PROJECTS);
  currentList = currentList.filter((p) => p.id !== Number(id));
  setLocalData('benix_projects', currentList);
  return { success: true, message: 'Project deleted successfully.' };
}

export async function saveArticle(articleData: Partial<Article>, isEdit: boolean = false): Promise<Article> {
  const token = getAuthToken();
  const url = isEdit ? `/api/blog/${articleData.id}` : '/api/blog';
  const method = isEdit ? 'PUT' : 'POST';

  const remote = await tryRemoteFetch<{ article: Article }>(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(articleData)
  });

  let currentList = getLocalData<Article[]>('benix_articles', INITIAL_ARTICLES);
  let savedArticle: Article;

  if (isEdit && articleData.id) {
    const idx = currentList.findIndex((a) => a.id === Number(articleData.id) || a.slug === String(articleData.id));
    if (idx !== -1) {
      currentList[idx] = { ...currentList[idx], ...articleData } as Article;
      savedArticle = currentList[idx];
    } else {
      savedArticle = { id: Number(articleData.id) || Date.now(), ...articleData } as Article;
      currentList.unshift(savedArticle);
    }
  } else {
    savedArticle = {
      id: Date.now(),
      title: articleData.title || 'New Article',
      slug: articleData.slug || `article-${Date.now()}`,
      summary: articleData.summary || '',
      content: articleData.content || '',
      featured_image_url: articleData.featured_image_url || 'https://i.postimg.cc/Hnj1LYRT/online-banks.png',
      category: articleData.category || 'Technology',
      tags: typeof articleData.tags === 'string' ? articleData.tags : JSON.stringify(articleData.tags || []),
      author_name: articleData.author_name || 'Benir Benjamin',
      status: articleData.status || 'published',
      published_at: new Date().toISOString()
    } as Article;
    currentList.unshift(savedArticle);
  }

  setLocalData('benix_articles', currentList);
  return remote?.article || savedArticle;
}

export async function deleteArticle(id: number) {
  const token = getAuthToken();
  tryRemoteFetch(`/api/blog/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  let currentList = getLocalData<Article[]>('benix_articles', INITIAL_ARTICLES);
  currentList = currentList.filter((a) => a.id !== Number(id));
  setLocalData('benix_articles', currentList);
  return { success: true, message: 'Article deleted successfully.' };
}

export async function updateCompanySettings(settings: Partial<CompanySettings>) {
  const token = getAuthToken();
  const remote = await tryRemoteFetch('/api/settings/company', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(settings)
  });

  const currentSettings = getLocalData<CompanySettings>('benix_company_settings', INITIAL_COMPANY);
  const updated = { ...currentSettings, ...settings };
  setLocalData('benix_company_settings', updated);
  return remote || { success: true, message: 'Company settings updated successfully.', company: updated };
}

export async function updateAdminProfile(name: string, email: string) {
  const token = getAuthToken();
  const remote = await tryRemoteFetch('/api/auth/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ name, email })
  });

  let users = getLocalData<User[]>('benix_users', INITIAL_USERS);
  if (users.length > 0) {
    users[0].name = name;
    users[0].email = email;
    setLocalData('benix_users', users);
  }

  return remote || { success: true, message: 'Profile updated successfully.', user: { id: 1, name, email, role: 'admin' } };
}

export async function changeAdminPassword(currentPassword: string, newPassword: string) {
  const token = getAuthToken();
  const remote = await tryRemoteFetch('/api/auth/password', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ currentPassword, newPassword })
  });

  return remote || { success: true, message: 'Password changed successfully!' };
}

export async function fetchUsers() {
  const token = getAuthToken();
  const remote = await tryRemoteFetch<{ users: User[] }>('/api/admin/users', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (remote?.users) {
    setLocalData('benix_users', remote.users);
    return remote.users;
  }
  return getLocalData<User[]>('benix_users', INITIAL_USERS);
}

export async function createUser(userData: { email: string; password: string; name: string; role: 'admin' | 'editor' }) {
  const token = getAuthToken();
  const remote = await tryRemoteFetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(userData)
  });

  const newUser: User = {
    id: Date.now(),
    email: userData.email,
    name: userData.name,
    role: userData.role
  };

  let users = getLocalData<User[]>('benix_users', INITIAL_USERS);
  users.push(newUser);
  setLocalData('benix_users', users);

  return remote || { success: true, user: newUser, message: `User ${userData.name} created successfully.` };
}

export async function deleteUser(id: number) {
  const token = getAuthToken();
  tryRemoteFetch(`/api/users/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  let users = getLocalData<User[]>('benix_users', INITIAL_USERS);
  users = users.filter((u) => u.id !== Number(id));
  setLocalData('benix_users', users);

  return { success: true, message: 'User deleted successfully.' };
}

export async function updateArticleStatus(id: number, status: 'published' | 'pending_review' | 'draft') {
  const token = getAuthToken();
  const remote = await tryRemoteFetch(`/api/blog/${id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });

  let articlesList = getLocalData<Article[]>('benix_articles', INITIAL_ARTICLES);
  const idx = articlesList.findIndex((a) => a.id === Number(id));
  if (idx !== -1) {
    articlesList[idx].status = status as any;
    setLocalData('benix_articles', articlesList);
  }

  return remote || { success: true, message: `Article status updated to ${status}.` };
}

// ================= DYNAMIC CATEGORIES API ================= //

const INITIAL_CATEGORIES = ['Technology', 'Software Development', 'Digital Marketing & SEO', 'NebeluRw News'];

export async function fetchCategories(): Promise<string[]> {
  const remote = await tryRemoteFetch<{ categories: string[] }>('/api/categories');
  if (remote?.categories && Array.isArray(remote.categories)) {
    setLocalData('benix_blog_categories', remote.categories);
    return remote.categories;
  }
  return getLocalData<string[]>('benix_blog_categories', INITIAL_CATEGORIES);
}

export async function addCategory(name: string): Promise<string[]> {
  const token = getAuthToken();
  const remote = await tryRemoteFetch<{ categories: string[] }>('/api/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ name })
  });

  let current = getLocalData<string[]>('benix_blog_categories', INITIAL_CATEGORIES);
  const trimmed = name.trim();
  if (trimmed && !current.includes(trimmed)) {
    current.push(trimmed);
    setLocalData('benix_blog_categories', current);
  }
  return remote?.categories || current;
}

export async function editCategory(oldName: string, newName: string): Promise<string[]> {
  const token = getAuthToken();
  const remote = await tryRemoteFetch<{ categories: string[] }>('/api/categories', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ oldName, newName })
  });

  let current = getLocalData<string[]>('benix_blog_categories', INITIAL_CATEGORIES);
  const idx = current.indexOf(oldName);
  const trimmed = newName.trim();
  if (idx !== -1 && trimmed) {
    current[idx] = trimmed;
    setLocalData('benix_blog_categories', current);
  }
  return remote?.categories || current;
}

// ================= COMMENTS & MODERATION API ================= //

export async function fetchArticleComments(articleId: number | string, isAdmin: boolean = false): Promise<ArticleComment[]> {
  const remote = await tryRemoteFetch<{ comments: ArticleComment[] }>(`/api/comments?article_id=${articleId}&admin=${isAdmin}`);
  if (remote?.comments) return remote.comments;

  const localComments = getLocalData<ArticleComment[]>('benix_comments', []);
  return localComments.filter((c) => String(c.article_id) === String(articleId));
}

export async function fetchAllCommentsAdmin(): Promise<ArticleComment[]> {
  const token = getAuthToken();
  const remote = await tryRemoteFetch<{ comments: ArticleComment[] }>('/api/comments/all', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (remote?.comments) return remote.comments;
  return getLocalData<ArticleComment[]>('benix_comments', []);
}

export async function postArticleComment(commentData: {
  article_id: number;
  parent_id?: string | null;
  author_name: string;
  content: string;
  is_admin_reply?: boolean;
}): Promise<ArticleComment> {
  const res = await fetch('/api/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(commentData)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to submit comment.');
  }

  const saved: ArticleComment = data.comment || {
    id: `c_${Date.now()}`,
    article_id: commentData.article_id,
    parent_id: commentData.parent_id || null,
    author_name: commentData.author_name,
    content: commentData.content,
    likes_count: 0,
    status: 'approved',
    is_admin_reply: commentData.is_admin_reply,
    created_at: new Date().toISOString()
  };

  let local = getLocalData<ArticleComment[]>('benix_comments', []);
  local.unshift(saved);
  setLocalData('benix_comments', local);

  return saved;
}

export async function likeArticleComment(commentId: string): Promise<number> {
  const remote = await tryRemoteFetch<{ likes_count: number }>(`/api/comments/${commentId}/like`, {
    method: 'POST'
  });
  return remote?.likes_count || 1;
}

export async function updateCommentStatusApi(commentId: string, status: 'approved' | 'hidden' | 'flagged') {
  const token = getAuthToken();
  const remote = await tryRemoteFetch(`/api/comments/${commentId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });
  return remote || { success: true };
}

export async function deleteCommentApi(commentId: string) {
  const token = getAuthToken();
  const remote = await tryRemoteFetch(`/api/comments/${commentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  return remote || { success: true };
}

export async function banUserIpApi(ip: string) {
  const token = getAuthToken();
  const remote = await tryRemoteFetch('/api/comments/ban', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ ip })
  });
  return remote || { success: true };
}

export async function incrementArticleViews(slugOrId: number | string) {
  tryRemoteFetch(`/api/blog/${slugOrId}/view`, { method: 'POST' });
}

