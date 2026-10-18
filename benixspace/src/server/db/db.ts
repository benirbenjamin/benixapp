import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Central Target Neon PostgreSQL Database
const NEON_DEFAULT = 'postgresql://neondb_owner:npg_j9q1UhnxgTrl@ep-soft-hill-b4t6y52i-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';

let rawConn =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  NEON_DEFAULT;

// Strip channel_binding if present
const connectionString = rawConn.replace(/&?channel_binding=[^&]+/g, '').replace(/\?&/, '?');

export const hasValidDbConfig = !!connectionString;
export const dbEngine: 'postgres' | 'mysql' = 'postgres';

// Standard resilient PostgreSQL connection pool with connection timeout
export const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

/**
 * Universal Database Query Wrapper
 * Executes with high performance over Neon serverless channel with fallback
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  try {
    const start = Date.now();
    let normalizedSql = text;
    let queryParams = params || [];

    // Normalize parameter placeholders if necessary
    if (normalizedSql.includes('?') && !normalizedSql.includes('$1')) {
      let index = 1;
      normalizedSql = normalizedSql.replace(/\?/g, () => `$${index++}`);
    }

    const res = await pool.query(normalizedSql, queryParams);
    const duration = Date.now() - start;

    if (process.env.DEBUG_DB) {
      console.log('Executed Query:', { text: normalizedSql.substring(0, 100), duration, rows: res?.rowCount });
    }

    return { rows: (res?.rows || []) as T[], rowCount: res?.rowCount || 0 };
  } catch (err: any) {
    console.error('Database Query Error:', { error: err?.message, sql: text.substring(0, 120) });
    // Re-throw so caller knows, but caller should catch and fallback gracefully
    throw err;
  }
}

/**
 * Transaction Helper
 */
export async function withTransaction<T>(
  callback: (client: any) => Promise<T>
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
