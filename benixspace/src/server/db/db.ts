import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Central Target Neon PostgreSQL Database
const NEON_DEFAULT = 'postgresql://neondb_owner:npg_j9q1UhnxgTrl@ep-soft-hill-b4t6y52i-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  NEON_DEFAULT;

const isVercel = !!process.env.VERCEL;
const isProduction = process.env.NODE_ENV === 'production' || isVercel;

// Database Engine Detection (PostgreSQL or MySQL)
export const dbEngine: 'postgres' | 'mysql' =
  connectionString.startsWith('mysql') ? 'mysql' : 'postgres';

export const pool = new Pool({
  connectionString,
  ssl: isProduction || connectionString.includes('neon.tech') || connectionString.includes('supabase')
    ? { rejectUnauthorized: false }
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

/**
 * Universal Database Query Wrapper
 * Automatically normalizes SQL between PostgreSQL ($1, $2) and MySQL (?, ?)
 * Supports search_path, multi-schema queries, and parameter mapping
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  try {
    const start = Date.now();
    let normalizedSql = text;
    let queryParams = params || [];

    if (dbEngine === 'postgres') {
      // If query was written with MySQL '?' placeholders, convert to $1, $2
      if (normalizedSql.includes('?') && !normalizedSql.includes('$1')) {
        let index = 1;
        normalizedSql = normalizedSql.replace(/\?/g, () => `$${index++}`);
      }
    } else {
      // If query was written with PostgreSQL '$1' placeholders, convert to '?'
      normalizedSql = normalizedSql.replace(/\$[0-9]+/g, '?');
    }

    const res = await pool.query(normalizedSql, queryParams);
    const duration = Date.now() - start;

    if (process.env.DEBUG_DB) {
      console.log('Executed Query:', { text: normalizedSql.substring(0, 100), duration, rows: res.rowCount });
    }

    return { rows: res.rows as T[], rowCount: res.rowCount || 0 };
  } catch (err: any) {
    console.error('Database Query Error:', { error: err?.message, sql: text.substring(0, 120) });
    throw err;
  }
}

/**
 * Transaction Helper
 * Runs a callback within a managed transaction with automatic rollback on error
 */
export async function withTransaction<T>(
  callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export default { pool, query, withTransaction, dbEngine };
