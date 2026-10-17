import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

// Vercel / Neon / Supabase / Railway Postgres connection string
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;

let pool: pg.Pool | null = null;
let pgliteInstance: any = null;
let isPglite = false;

if (connectionString) {
  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  pool = new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
  });
} else {
  // Cloudless / Zero-config fallback: dynamically load PGlite for in-process Postgres
  console.log('ℹ️ No DATABASE_URL provided. Initializing embedded PostgreSQL (PGlite)...');
  isPglite = true;
}

export async function getPglite() {
  if (!pgliteInstance) {
    const { PGlite } = await import('@electric-sql/pglite');
    pgliteInstance = new PGlite();
  }
  return pgliteInstance;
}

export async function query(text: string, params: any[] = []): Promise<{ rows: any[]; rowCount: number }> {
  if (pool) {
    try {
      const res = await pool.query(text, params);
      return {
        rows: res.rows,
        rowCount: res.rowCount ?? res.rows.length,
      };
    } catch (err: any) {
      if (
        err?.code === '28P01' ||
        err?.code === 'ECONNREFUSED' ||
        err?.code === 'ENOTFOUND' ||
        err?.message?.includes('password authentication failed') ||
        err?.message?.includes('connect ECONNREFUSED')
      ) {
        console.warn('⚠️ External PostgreSQL connection unreachable, activating embedded PGlite fallback...');
        pool = null;
        isPglite = true;
        const pgl = await getPglite();
        const res = await pgl.query(text, params);
        return {
          rows: res.rows || [],
          rowCount: res.rows ? res.rows.length : 0,
        };
      }
      throw err;
    }
  } else {
    const pgl = await getPglite();
    // PGlite uses standard query(sql, params)
    const res = await pgl.query(text, params);
    return {
      rows: res.rows || [],
      rowCount: res.rows ? res.rows.length : 0,
    };
  }
}

export default {
  query,
  pool,
};
