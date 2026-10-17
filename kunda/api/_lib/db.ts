// =====================================================================
// KUNDA SPACE: HYBRID POSTGRESQL, MYSQL & IN-MEMORY STORAGE ENGINE
// =====================================================================
import pg from 'pg';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const { Pool: PgPool } = pg;

const dbUrl = (process.env.DATABASE_URL || '').trim();
const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');
const isMysql =
  dbUrl.startsWith('mysql://') ||
  Boolean(process.env.MYSQL_DATABASE || process.env.DB_NAME || process.env.MYSQL_HOST || process.env.DB_HOST);

let pgPool: pg.Pool | null = null;
let mysqlPool: mysql.Pool | null = null;

if (isPostgres) {
  try {
    pgPool = new PgPool({
      connectionString: dbUrl,
      ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    pgPool.on('error', (err) => {
      console.warn('PostgreSQL idle client error, keeping pool alive:', err);
    });
    console.log('📦 PostgreSQL connection pool initialized.');
  } catch (pgErr) {
    console.warn('⚠️ Could not initialize PostgreSQL pool, falling back to memory store:', pgErr);
    pgPool = null;
  }
} else if (isMysql) {
  try {
    if (dbUrl) {
      mysqlPool = mysql.createPool({
        uri: dbUrl,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        multipleStatements: true,
      });
    } else {
      mysqlPool = mysql.createPool({
        host: process.env.MYSQL_HOST || process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.MYSQL_PORT || process.env.DB_PORT || '3306', 10),
        user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
        password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'kunda_space',
        ssl: process.env.MYSQL_SSL === 'true' || process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        multipleStatements: true,
      });
    }
    console.log('📦 MySQL connection pool initialized.');
  } catch (poolErr) {
    console.warn('⚠️ Could not initialize MySQL pool, falling back to memory store:', poolErr);
    mysqlPool = null;
  }
}

// In-Memory Database store for instant execution when MySQL is not yet connected
export const memoryStore = {
  users: [] as any[],
  profiles: [] as any[],
  photos: [] as any[],
  preferences: [] as any[],
  likes: [] as any[],
  passes: [] as any[],
  matches: [] as any[],
  conversations: [] as any[],
  messages: [] as any[],
  allowances: new Map<string, { initialRemaining: number; distinctRecipients: string[]; repliesRemaining: number }>(),
  wallets: new Map<string, any>(),
  transactions: [] as any[],
  subscriptions: [] as any[],
  contactUnlocks: [] as any[],
  notifications: [] as any[],
  moderationEvents: [] as any[],
  reports: [] as any[],
  adminSettings: new Map<string, any>(),
  tutorials: [] as any[],
  stories: [] as any[],
  posts: [] as any[],
  postComments: [] as any[],
  postLikes: [] as any[],
  storyViews: [] as any[],
  withdrawals: [] as any[],
};

// Seed initial memory store with admin and realistic member profiles
function initMemoryStore() {
  const adminId = 'a0000000-0000-0000-0000-000000000001';
  memoryStore.users.push({
    id: adminId,
    email: 'admin@kunda.space',
    passwordHash: '$2a$10$wE73kYpQ9a83B3qKz0R0QegE8s9N8xV9PkWgK2U3a1OQh1sBf8v4G', // Admin@Kunda2026!
    role: 'super_admin',
    dob: '1990-05-15',
    phone: '788123456',
    phoneCode: '+250',
    preferredLanguage: 'rw',
    emailVerified: true,
    isSuspended: false,
    createdAt: new Date().toISOString(),
  });
  memoryStore.wallets.set(adminId, { balanceMinor: 50000, currency: 'RWF' });
  memoryStore.allowances.set(adminId, { initialRemaining: 3, distinctRecipients: [], repliesRemaining: 3 });

  // Super Admin: benirabok@gmail.com
  const benirAdminId = 'a0000000-0000-0000-0000-000000000002';
  memoryStore.users.push({
    id: benirAdminId,
    email: 'benirabok@gmail.com',
    passwordHash: '$2a$10$VxvCfWC10b98XDvgnLe7meEg1y9jTvTHU8fHKmRxfuADfVVyjqEZe', // 1202!birthDATE
    role: 'super_admin',
    dob: '1995-01-01',
    phone: '788000000',
    phoneCode: '+250',
    preferredLanguage: 'en',
    emailVerified: true,
    isSuspended: false,
    createdAt: new Date().toISOString(),
  });
  memoryStore.profiles.push({
    id: 'p-' + benirAdminId,
    userId: benirAdminId,
    displayName: 'Benir (Super Admin)',
    gender: 'other',
    interestedIn: 'everyone',
    country: 'Rwanda',
    city: 'Kigali',
    photos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'],
    verifiedBadge: true,
    profileCompleted: true,
  });
  memoryStore.wallets.set(benirAdminId, { balanceMinor: 100000, currency: 'RWF' });
  memoryStore.allowances.set(benirAdminId, { initialRemaining: 999, distinctRecipients: [], repliesRemaining: 999 });

  // Initial business settings
  memoryStore.adminSettings.set('free_initial_messages', 3);
  memoryStore.adminSettings.set('free_distinct_recipients', 3);
  memoryStore.adminSettings.set('free_replies', 3);
  memoryStore.adminSettings.set('hourly_pass_cost', 1500); // 24-Hour Pass
  memoryStore.adminSettings.set('three_day_pass_cost', 3000); // 3-Day Pass
  memoryStore.adminSettings.set('weekly_pass_cost', 5000); // Weekly Pass
  memoryStore.adminSettings.set('pay_per_message_cost', 150);
  memoryStore.adminSettings.set('contact_unlock_cost', 2000);
  memoryStore.adminSettings.set('welcome_bonus_amount', 500);
  memoryStore.adminSettings.set('referral_signup_reward', 200);
  memoryStore.adminSettings.set('referral_deposit_commission_pct', 5);
  memoryStore.adminSettings.set('contact_unlock_commission_pct', 15);
  memoryStore.adminSettings.set('minimum_withdrawal_amount', 2000);
  memoryStore.adminSettings.set('default_currency', 'RWF');

  // Email & Google Drive Settings
  memoryStore.adminSettings.set('email_provider', 'mock'); // 'resend' | 'smtp' | 'mock'
  memoryStore.adminSettings.set('resend_api_key', '');
  memoryStore.adminSettings.set('resend_from_email', 'Kunda Space <onboarding@resend.dev>');
  memoryStore.adminSettings.set('smtp_host', 'smtp.gmail.com');
  memoryStore.adminSettings.set('smtp_port', 587);
  memoryStore.adminSettings.set('smtp_secure', false);
  memoryStore.adminSettings.set('smtp_user', '');
  memoryStore.adminSettings.set('smtp_pass', '');
  memoryStore.adminSettings.set('smtp_from_email', 'Kunda Space <noreply@kunda.space>');
  memoryStore.adminSettings.set('google_drive_client_id', '');
  memoryStore.adminSettings.set('google_drive_client_secret', '');
  memoryStore.adminSettings.set('google_drive_refresh_token', '');
  memoryStore.adminSettings.set('google_drive_folder_id', '');

  // Pre-seed Tutorials shown to users during registration and onboarding
  memoryStore.tutorials.push(
    {
      id: 'tut-1',
      title_en: 'How Kunda Space Works: A Quick Beginner Guide',
      title_rw: "Uko Kunda Space Ikora: Inyoborabumenyi y'Ibanze",
      title_fr: 'Comment Fonctionne Kunda Space: Guide Débutant',
      content_en: 'Welcome to Kunda Space! Learn how to create an attractive, authentic profile, how our compatibility algorithm finds genuine matches in Rwanda, and how your privacy is protected at every step.',
      content_rw: "Murakaza neza kuri Kunda Space! Muri iyi nyoborabumenyi uramenya uko wuzuza umwirondoro witeguye neza, uko ikoranabuhanga riguha abahuje nawe mu Rwanda, n'uko amakuru yawe arindwa.",
      content_fr: 'Bienvenue sur Kunda Space ! Découvrez comment compléter votre profil, comment notre algorithme de compatibilité vous connecte aux profils sincères au Rwanda, et comment vos données privées sont sécurisées.',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
      stepTag: 'step1',
      displayOrder: 1,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tut-2',
      title_en: 'Safe Messaging & Direct Contact Unlocks',
      title_rw: 'Uko Wandikirana mu Mutekano no Gufungura Nimero',
      title_fr: 'Messagerie Sécurisée et Déblocage de Contact',
      content_en: 'To protect you from scams, phone numbers are locked in chat. You start with 3 free messages and 3 replies. When mutual rapport is built, both parties can consent to unlock direct contacts!',
      content_rw: "Mu rwego rwo kurinda umutekano wanyu, nimero za telefone ziba zifunze muri chat. Utangirana n'ubutumwa 3 bw'ubuntu n'ibisubizo 3. Iyo mwembi mwemeranyijwe, mushobora gufungura nimero ya telefone.",
      content_fr: 'Pour vous protéger des escroqueries, les numéros sont verrouillés dans le chat. Vous disposez de 3 messages gratuits et 3 réponses. Une fois la confiance établie, vous pouvez débloquer le numéro avec accord mutuel !',
      videoUrl: '',
      imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      stepTag: 'step2',
      displayOrder: 2,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tut-3',
      title_en: 'Photo Best Practices for Real Singles',
      title_rw: 'Inama ku Mafoto Meza Akurura Urukundo Nyakuri',
      title_fr: 'Conseils pour de Bonnes Photos de Profil',
      content_en: 'Profiles with clear, smiling photos showing your face receive 4x more mutual likes. Avoid sunglasses or heavily filtered photos for maximum trust.',
      content_rw: 'Umwirondoro uriho amafoto asobanutse amwenyura uboneka inshuro 4 kurenza andi. Irinde amadarubindi yirabura cyangwa filtri zikabije kugira ngo wizerewe kurushaho.',
      content_fr: 'Les profils avec des photos nettes et souriantes reçoivent 4 fois plus de matchs mutuels. Évitez les lunettes de soleil ou les filtres excessifs pour inspirer confiance.',
      videoUrl: '',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
      stepTag: 'step3',
      displayOrder: 3,
      isActive: true,
      createdAt: new Date().toISOString(),
    }
  );
}

initMemoryStore();

/**
 * Universal Query Adapter: Executes SQL on active PostgreSQL or MySQL connection pool
 * Automatically translates query syntax if running on MySQL, or executes natively on PostgreSQL.
 */
export async function query(sql: string, params: any[] = []): Promise<any> {
  // 1. If PostgreSQL connection pool is available, execute natively
  if (pgPool) {
    try {
      const res = await pgPool.query(sql, params);
      return res;
    } catch (err) {
      console.warn('PostgreSQL query error, falling back to memory store:', err);
    }
  }

  // 2. If MySQL connection pool is available, translate and execute
  if (mysqlPool) {
    try {
      let mysqlSql = sql.replace(/\$(\d+)/g, '?');
      mysqlSql = mysqlSql.replace(/ON\s+CONFLICT\s*\([^)]*\)\s*DO\s*NOTHING/gi, 'ON DUPLICATE KEY UPDATE id=id');
      mysqlSql = mysqlSql.replace(/ON\s+CONFLICT\s*DO\s*NOTHING/gi, 'ON DUPLICATE KEY UPDATE id=id');
      mysqlSql = mysqlSql.replace(/\s+RETURNING\s+[\w,\s.*]+/gi, '');

      const [results] = await mysqlPool.query(mysqlSql, params);

      if (Array.isArray(results)) {
        return {
          rows: results,
          rowCount: results.length,
        };
      }

      const header = results as mysql.ResultSetHeader;
      return {
        rows: [],
        rowCount: header.affectedRows ?? 0,
        insertId: header.insertId ?? null,
      };
    } catch (err) {
      console.warn('MySQL query error, falling back to memory store:', err);
    }
  }

  return null;
}

/**
 * Returns active database connection pool (PostgreSQL or MySQL)
 */
export function getDbPool(): pg.Pool | mysql.Pool | null {
  return pgPool || mysqlPool;
}

let settingsTableInitialized = false;

/**
 * Ensures admin_settings table exists in connected DB
 */
export async function ensureAdminSettingsTable(): Promise<void> {
  if (settingsTableInitialized) return;
  try {
    if (pgPool) {
      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS admin_settings (
          "key" VARCHAR(100) NOT NULL PRIMARY KEY,
          "value" TEXT NOT NULL,
          "description" TEXT,
          "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      settingsTableInitialized = true;
    } else if (mysqlPool) {
      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS \`admin_settings\` (
          \`key\` VARCHAR(100) NOT NULL PRIMARY KEY,
          \`value\` JSON NOT NULL,
          \`description\` TEXT,
          \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      settingsTableInitialized = true;
    }
  } catch (err) {
    console.warn('⚠️ ensureAdminSettingsTable warning:', err);
  }
}

/**
 * Loads all settings from DB table and hydrates memoryStore.adminSettings
 */
export async function loadAdminSettingsFromDb(): Promise<Map<string, any>> {
  await ensureAdminSettingsTable();
  try {
    let rows: any[] = [];
    if (pgPool) {
      const res = await pgPool.query('SELECT "key", "value" FROM admin_settings');
      rows = res.rows || [];
    } else if (mysqlPool) {
      const [res] = await mysqlPool.query('SELECT `key`, `value` FROM `admin_settings`');
      if (Array.isArray(res)) rows = res;
    }

    for (const r of rows) {
      const k = r.key ?? r.KEY;
      let v = r.value ?? r.VALUE;
      if (typeof v === 'string') {
        try {
          v = JSON.parse(v);
        } catch {
          // keep as raw string
        }
      }
      if (k !== undefined && v !== undefined) {
        memoryStore.adminSettings.set(k, v);
      }
    }
  } catch (err) {
    console.warn('⚠️ loadAdminSettingsFromDb warning:', err);
  }
  return memoryStore.adminSettings;
}

/**
 * Saves a setting to memoryStore and persists it to PostgreSQL or MySQL admin_settings table
 */
export async function saveAdminSettingToDb(key: string, value: any): Promise<boolean> {
  memoryStore.adminSettings.set(key, value);
  await ensureAdminSettingsTable();
  const jsonVal = JSON.stringify(value);
  try {
    if (pgPool) {
      await pgPool.query(
        `INSERT INTO admin_settings ("key", "value", "updated_at")
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updated_at" = CURRENT_TIMESTAMP`,
        [key, jsonVal]
      );
      return true;
    } else if (mysqlPool) {
      try {
        await mysqlPool.query(
          `INSERT INTO \`admin_settings\` (\`key\`, \`value\`)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`)`,
          [key, jsonVal]
        );
      } catch (insertErr) {
        // Fallback for MySQL / MariaDB compatibility
        await mysqlPool.query(
          `REPLACE INTO \`admin_settings\` (\`key\`, \`value\`) VALUES (?, ?)`,
          [key, jsonVal]
        );
      }
      return true;
    }
  } catch (err) {
    console.error(`⚠️ Failed to persist admin setting "${key}" to DB:`, err);
    return false;
  }
  return true;
}

// Background startup load of admin settings from database
setTimeout(() => {
  loadAdminSettingsFromDb().catch(() => {});
  loadFeedAndStoriesFromDb().catch(() => {});
}, 500);

let feedTablesInitialized = false;

export async function ensureFeedAndStoriesTables(): Promise<void> {
  if (feedTablesInitialized) return;
  try {
    if (pgPool) {
      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS posts (
          id VARCHAR(120) PRIMARY KEY,
          user_id VARCHAR(120) NOT NULL,
          caption TEXT,
          media_urls JSONB DEFAULT '[]'::jsonb,
          feeling VARCHAR(100),
          location VARCHAR(200),
          likes_count INT DEFAULT 0,
          comments_count INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS post_comments (
          id VARCHAR(120) PRIMARY KEY,
          post_id VARCHAR(120) NOT NULL,
          user_id VARCHAR(120) NOT NULL,
          user_name VARCHAR(120),
          user_avatar TEXT,
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS post_likes (
          id VARCHAR(120) PRIMARY KEY,
          post_id VARCHAR(120) NOT NULL,
          user_id VARCHAR(120) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT uniq_post_user_like UNIQUE (post_id, user_id)
        );
        CREATE TABLE IF NOT EXISTS stories (
          id VARCHAR(120) PRIMARY KEY,
          user_id VARCHAR(120) NOT NULL,
          media_url TEXT NOT NULL,
          media_type VARCHAR(20) DEFAULT 'image',
          duration INT DEFAULT 5,
          caption TEXT,
          segment_index INT DEFAULT 1,
          total_segments INT DEFAULT 1,
          likes_count INT DEFAULT 0,
          liked_by JSONB DEFAULT '[]'::jsonb,
          views_count INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP NOT NULL
        );
        CREATE TABLE IF NOT EXISTS story_views (
          id VARCHAR(120) PRIMARY KEY,
          story_id VARCHAR(120) NOT NULL,
          viewer_id VARCHAR(120) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT uniq_story_viewer UNIQUE (story_id, viewer_id)
        );
      `);
      feedTablesInitialized = true;
    } else if (mysqlPool) {
      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS \`posts\` (
          \`id\` VARCHAR(120) NOT NULL PRIMARY KEY,
          \`user_id\` VARCHAR(120) NOT NULL,
          \`caption\` TEXT,
          \`media_urls\` JSON,
          \`feeling\` VARCHAR(100),
          \`location\` VARCHAR(200),
          \`likes_count\` INT NOT NULL DEFAULT 0,
          \`comments_count\` INT NOT NULL DEFAULT 0,
          \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS \`post_comments\` (
          \`id\` VARCHAR(120) NOT NULL PRIMARY KEY,
          \`post_id\` VARCHAR(120) NOT NULL,
          \`user_id\` VARCHAR(120) NOT NULL,
          \`user_name\` VARCHAR(120),
          \`user_avatar\` TEXT,
          \`content\` TEXT NOT NULL,
          \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS \`post_likes\` (
          \`id\` VARCHAR(120) NOT NULL PRIMARY KEY,
          \`post_id\` VARCHAR(120) NOT NULL,
          \`user_id\` VARCHAR(120) NOT NULL,
          \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY \`uniq_post_user_like\` (\`post_id\`, \`user_id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS \`stories\` (
          \`id\` VARCHAR(120) NOT NULL PRIMARY KEY,
          \`user_id\` VARCHAR(120) NOT NULL,
          \`media_url\` TEXT NOT NULL,
          \`media_type\` VARCHAR(20) NOT NULL DEFAULT 'image',
          \`duration\` INT NOT NULL DEFAULT 5,
          \`caption\` TEXT,
          \`segment_index\` INT NOT NULL DEFAULT 1,
          \`total_segments\` INT NOT NULL DEFAULT 1,
          \`likes_count\` INT NOT NULL DEFAULT 0,
          \`liked_by\` JSON,
          \`views_count\` INT NOT NULL DEFAULT 0,
          \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`expires_at\` DATETIME NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS \`story_views\` (
          \`id\` VARCHAR(120) NOT NULL PRIMARY KEY,
          \`story_id\` VARCHAR(120) NOT NULL,
          \`viewer_id\` VARCHAR(120) NOT NULL,
          \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY \`uniq_story_viewer\` (\`story_id\`, \`viewer_id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      feedTablesInitialized = true;
    }
  } catch (err) {
    console.warn('⚠️ ensureFeedAndStoriesTables warning:', err);
  }
}

export async function loadFeedAndStoriesFromDb(): Promise<void> {
  await ensureFeedAndStoriesTables();
  try {
    // 1. Load Posts
    if (pgPool) {
      const pRes = await pgPool.query('SELECT * FROM posts ORDER BY created_at ASC');
      if (pRes?.rows?.length) {
        for (const row of pRes.rows) {
          if (!memoryStore.posts.some((p) => p.id === row.id)) {
            memoryStore.posts.push({
              id: row.id,
              userId: row.user_id,
              caption: row.caption || '',
              mediaUrls: Array.isArray(row.media_urls) ? row.media_urls : [],
              feeling: row.feeling,
              location: row.location,
              likesCount: Number(row.likes_count || 0),
              commentsCount: Number(row.comments_count || 0),
              createdAt: new Date(row.created_at).toISOString(),
            });
          }
        }
      }

      // Comments
      const cRes = await pgPool.query('SELECT * FROM post_comments ORDER BY created_at ASC');
      if (cRes?.rows?.length) {
        for (const row of cRes.rows) {
          if (!memoryStore.postComments.some((c) => c.id === row.id)) {
            memoryStore.postComments.push({
              id: row.id,
              postId: row.post_id,
              userId: row.user_id,
              userName: row.user_name,
              userAvatar: row.user_avatar,
              content: row.content,
              createdAt: new Date(row.created_at).toISOString(),
            });
          }
        }
      }

      // Likes
      const lRes = await pgPool.query('SELECT * FROM post_likes');
      if (lRes?.rows?.length) {
        for (const row of lRes.rows) {
          if (!memoryStore.postLikes.some((l) => l.postId === row.post_id && l.userId === row.user_id)) {
            memoryStore.postLikes.push({
              id: row.id,
              postId: row.post_id,
              userId: row.user_id,
              createdAt: new Date(row.created_at).toISOString(),
            });
          }
        }
      }

      // Stories
      const sRes = await pgPool.query('SELECT * FROM stories WHERE expires_at > CURRENT_TIMESTAMP');
      if (sRes?.rows?.length) {
        for (const row of sRes.rows) {
          if (!memoryStore.stories.some((s) => s.id === row.id)) {
            memoryStore.stories.push({
              id: row.id,
              userId: row.user_id,
              mediaUrl: row.media_url,
              mediaType: row.media_type,
              duration: Number(row.duration || 5),
              caption: row.caption,
              segmentIndex: Number(row.segment_index || 1),
              totalSegments: Number(row.total_segments || 1),
              likesCount: Number(row.likes_count || 0),
              likedBy: Array.isArray(row.liked_by) ? row.liked_by : [],
              viewsCount: Number(row.views_count || 0),
              createdAt: new Date(row.created_at).toISOString(),
              expiresAt: new Date(row.expires_at).toISOString(),
            });
          }
        }
      }
    } else if (mysqlPool) {
      const [pRows]: any = await mysqlPool.query('SELECT * FROM `posts` ORDER BY `created_at` ASC');
      if (Array.isArray(pRows)) {
        for (const row of pRows) {
          if (!memoryStore.posts.some((p) => p.id === row.id)) {
            let mUrls = row.media_urls;
            if (typeof mUrls === 'string') {
              try { mUrls = JSON.parse(mUrls); } catch { mUrls = []; }
            }
            memoryStore.posts.push({
              id: row.id,
              userId: row.user_id,
              caption: row.caption || '',
              mediaUrls: Array.isArray(mUrls) ? mUrls : [],
              feeling: row.feeling,
              location: row.location,
              likesCount: Number(row.likes_count || 0),
              commentsCount: Number(row.comments_count || 0),
              createdAt: new Date(row.created_at).toISOString(),
            });
          }
        }
      }

      // Comments
      const [cRows]: any = await mysqlPool.query('SELECT * FROM `post_comments` ORDER BY `created_at` ASC');
      if (Array.isArray(cRows)) {
        for (const row of cRows) {
          if (!memoryStore.postComments.some((c) => c.id === row.id)) {
            memoryStore.postComments.push({
              id: row.id,
              postId: row.post_id,
              userId: row.user_id,
              userName: row.user_name,
              userAvatar: row.user_avatar,
              content: row.content,
              createdAt: new Date(row.created_at).toISOString(),
            });
          }
        }
      }

      // Likes
      const [lRows]: any = await mysqlPool.query('SELECT * FROM `post_likes`');
      if (Array.isArray(lRows)) {
        for (const row of lRows) {
          if (!memoryStore.postLikes.some((l) => l.postId === row.post_id && l.userId === row.user_id)) {
            memoryStore.postLikes.push({
              id: row.id,
              postId: row.post_id,
              userId: row.user_id,
              createdAt: new Date(row.created_at).toISOString(),
            });
          }
        }
      }

      // Stories
      const [sRows]: any = await mysqlPool.query('SELECT * FROM `stories` WHERE `expires_at` > NOW()');
      if (Array.isArray(sRows)) {
        for (const row of sRows) {
          if (!memoryStore.stories.some((s) => s.id === row.id)) {
            let lBy = row.liked_by;
            if (typeof lBy === 'string') {
              try { lBy = JSON.parse(lBy); } catch { lBy = []; }
            }
            memoryStore.stories.push({
              id: row.id,
              userId: row.user_id,
              mediaUrl: row.media_url,
              mediaType: row.media_type,
              duration: Number(row.duration || 5),
              caption: row.caption,
              segmentIndex: Number(row.segment_index || 1),
              totalSegments: Number(row.total_segments || 1),
              likesCount: Number(row.likes_count || 0),
              likedBy: Array.isArray(lBy) ? lBy : [],
              viewsCount: Number(row.views_count || 0),
              createdAt: new Date(row.created_at).toISOString(),
              expiresAt: new Date(row.expires_at).toISOString(),
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('⚠️ loadFeedAndStoriesFromDb warning:', err);
  }
}

export async function savePostToDb(post: any): Promise<void> {
  await ensureFeedAndStoriesTables();
  try {
    const mediaUrlsJson = JSON.stringify(post.mediaUrls || []);
    if (pgPool) {
      await pgPool.query(
        `INSERT INTO posts (id, user_id, caption, media_urls, feeling, location, likes_count, comments_count, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET caption=EXCLUDED.caption, likes_count=EXCLUDED.likes_count, comments_count=EXCLUDED.comments_count`,
        [post.id, post.userId, post.caption, mediaUrlsJson, post.feeling, post.location, post.likesCount || 0, post.commentsCount || 0, post.createdAt]
      );
    } else if (mysqlPool) {
      await mysqlPool.query(
        `INSERT INTO \`posts\` (\`id\`, \`user_id\`, \`caption\`, \`media_urls\`, \`feeling\`, \`location\`, \`likes_count\`, \`comments_count\`, \`created_at\`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE \`caption\`=VALUES(\`caption\`), \`likes_count\`=VALUES(\`likes_count\`), \`comments_count\`=VALUES(\`comments_count\`)`,
        [post.id, post.userId, post.caption, mediaUrlsJson, post.feeling, post.location, post.likesCount || 0, post.commentsCount || 0, new Date(post.createdAt)]
      );
    }
  } catch (err) {
    console.warn('savePostToDb error:', err);
  }
}

export async function deletePostFromDb(postId: string): Promise<void> {
  await ensureFeedAndStoriesTables();
  try {
    if (pgPool) {
      await pgPool.query('DELETE FROM posts WHERE id = $1', [postId]);
      await pgPool.query('DELETE FROM post_comments WHERE post_id = $1', [postId]);
      await pgPool.query('DELETE FROM post_likes WHERE post_id = $1', [postId]);
    } else if (mysqlPool) {
      await mysqlPool.query('DELETE FROM `posts` WHERE `id` = ?', [postId]);
      await mysqlPool.query('DELETE FROM `post_comments` WHERE `post_id` = ?', [postId]);
      await mysqlPool.query('DELETE FROM `post_likes` WHERE `post_id` = ?', [postId]);
    }
  } catch (err) {
    console.warn('deletePostFromDb error:', err);
  }
}

export async function savePostCommentToDb(comment: any): Promise<void> {
  await ensureFeedAndStoriesTables();
  try {
    if (pgPool) {
      await pgPool.query(
        `INSERT INTO post_comments (id, post_id, user_id, user_name, user_avatar, content, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [comment.id, comment.postId, comment.userId, comment.userName, comment.userAvatar, comment.content, comment.createdAt]
      );
      await pgPool.query('UPDATE posts SET comments_count = comments_count + 1 WHERE id = $1', [comment.postId]);
    } else if (mysqlPool) {
      await mysqlPool.query(
        `INSERT INTO \`post_comments\` (\`id\`, \`post_id\`, \`user_id\`, \`user_name\`, \`user_avatar\`, \`content\`, \`created_at\`)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [comment.id, comment.postId, comment.userId, comment.userName, comment.userAvatar, comment.content, new Date(comment.createdAt)]
      );
      await mysqlPool.query('UPDATE `posts` SET `comments_count` = `comments_count` + 1 WHERE `id` = ?', [comment.postId]);
    }
  } catch (err) {
    console.warn('savePostCommentToDb error:', err);
  }
}

export async function savePostLikeToDb(postId: string, userId: string): Promise<void> {
  await ensureFeedAndStoriesTables();
  const id = `like-${postId}-${userId}`;
  try {
    if (pgPool) {
      await pgPool.query(
        `INSERT INTO post_likes (id, post_id, user_id, created_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (post_id, user_id) DO NOTHING`,
        [id, postId, userId]
      );
      await pgPool.query('UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1', [postId]);
    } else if (mysqlPool) {
      await mysqlPool.query(
        `INSERT IGNORE INTO \`post_likes\` (\`id\`, \`post_id\`, \`user_id\`, \`created_at\`)
         VALUES (?, ?, ?, NOW())`,
        [id, postId, userId]
      );
      await mysqlPool.query('UPDATE `posts` SET `likes_count` = `likes_count` + 1 WHERE `id` = ?', [postId]);
    }
  } catch (err) {
    console.warn('savePostLikeToDb error:', err);
  }
}

export async function deletePostLikeFromDb(postId: string, userId: string): Promise<void> {
  await ensureFeedAndStoriesTables();
  try {
    if (pgPool) {
      await pgPool.query('DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
      await pgPool.query('UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = $1', [postId]);
    } else if (mysqlPool) {
      await mysqlPool.query('DELETE FROM `post_likes` WHERE `post_id` = ? AND `user_id` = ?', [postId, userId]);
      await mysqlPool.query('UPDATE `posts` SET `likes_count` = GREATEST(0, `likes_count` - 1) WHERE `id` = ?', [postId]);
    }
  } catch (err) {
    console.warn('deletePostLikeFromDb error:', err);
  }
}

export async function saveStoryToDb(story: any): Promise<void> {
  await ensureFeedAndStoriesTables();
  try {
    const likedByJson = JSON.stringify(story.likedBy || []);
    if (pgPool) {
      await pgPool.query(
        `INSERT INTO stories (id, user_id, media_url, media_type, duration, caption, segment_index, total_segments, likes_count, liked_by, views_count, created_at, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [story.id, story.userId, story.mediaUrl, story.mediaType, story.duration, story.caption, story.segmentIndex, story.totalSegments, story.likesCount || 0, likedByJson, story.viewsCount || 0, story.createdAt, story.expiresAt]
      );
    } else if (mysqlPool) {
      await mysqlPool.query(
        `INSERT INTO \`stories\` (\`id\`, \`user_id\`, \`media_url\`, \`media_type\`, \`duration\`, \`caption\`, \`segment_index\`, \`total_segments\`, \`likes_count\`, \`liked_by\`, \`views_count\`, \`created_at\`, \`expires_at\`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [story.id, story.userId, story.mediaUrl, story.mediaType, story.duration, story.caption, story.segmentIndex, story.totalSegments, story.likesCount || 0, likedByJson, story.viewsCount || 0, new Date(story.createdAt), new Date(story.expiresAt)]
      );
    }
  } catch (err) {
    console.warn('saveStoryToDb error:', err);
  }
}

export async function deleteStoryFromDb(storyId: string): Promise<void> {
  await ensureFeedAndStoriesTables();
  try {
    if (pgPool) {
      await pgPool.query('DELETE FROM stories WHERE id = $1', [storyId]);
      await pgPool.query('DELETE FROM story_views WHERE story_id = $1', [storyId]);
    } else if (mysqlPool) {
      await mysqlPool.query('DELETE FROM `stories` WHERE `id` = ?', [storyId]);
      await mysqlPool.query('DELETE FROM `story_views` WHERE `story_id` = ?', [storyId]);
    }
  } catch (err) {
    console.warn('deleteStoryFromDb error:', err);
  }
}

export async function recordStoryViewInDb(storyId: string, viewerId: string): Promise<number> {
  await ensureFeedAndStoriesTables();
  const id = `view-${storyId}-${viewerId}`;
  try {
    if (pgPool) {
      const res = await pgPool.query(
        `INSERT INTO story_views (id, story_id, viewer_id, created_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (story_id, viewer_id) DO NOTHING
         RETURNING id`,
        [id, storyId, viewerId]
      );
      if (res?.rowCount && res.rowCount > 0) {
        await pgPool.query('UPDATE stories SET views_count = views_count + 1 WHERE id = $1', [storyId]);
      }
    } else if (mysqlPool) {
      const [res]: any = await mysqlPool.query(
        `INSERT IGNORE INTO \`story_views\` (\`id\`, \`story_id\`, \`viewer_id\`, \`created_at\`)
         VALUES (?, ?, ?, NOW())`,
        [id, storyId, viewerId]
      );
      if (res?.affectedRows && res.affectedRows > 0) {
        await mysqlPool.query('UPDATE \`stories\` SET \`views_count\` = \`views_count\` + 1 WHERE \`id\` = ?', [storyId]);
      }
    }
  } catch (err) {
    console.warn('recordStoryViewInDb error:', err);
  }

  // Update in-memory
  const story = (memoryStore.stories || []).find((s) => s.id === storyId);
  if (story) {
    memoryStore.storyViews = memoryStore.storyViews || [];
    const alreadyViewed = memoryStore.storyViews.some((v) => v.storyId === storyId && v.viewerId === viewerId);
    if (!alreadyViewed) {
      memoryStore.storyViews.push({ id, storyId, viewerId, createdAt: new Date().toISOString() });
      story.viewsCount = (story.viewsCount || 0) + 1;
    }
    return story.viewsCount;
  }
  return 1;
}

