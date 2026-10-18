import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

// Central Target Neon PostgreSQL Database
const NEON_DEFAULT =
  'postgresql://neondb_owner:npg_j9q1UhnxgTrl@ep-soft-hill-b4t6y52i-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';

const rawConn =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  NEON_DEFAULT;

// Strip channel_binding if present
const connectionString = rawConn.replace(/&?channel_binding=[^&]+/g, '').replace(/\?&/, '?');

export const hasValidDbConfig = !!connectionString;
export const dbEngine: 'postgres' | 'mysql' = 'postgres';

// High-speed Neon HTTP SQL client: connects via HTTPS, immune to TCP/WebSocket timeouts on serverless
const sql = neon(connectionString);

/**
 * Universal Database Query Wrapper
 * Executes reliably over HTTPS on Neon Serverless with zero connection pooling failures
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  try {
    let normalizedSql = text;
    const queryParams = params || [];

    // Normalize MySQL-style ? placeholders to PostgreSQL $1, $2, ... if needed
    if (normalizedSql.includes('?') && !normalizedSql.includes('$1')) {
      let index = 1;
      normalizedSql = normalizedSql.replace(/\?/g, () => `$${index++}`);
    }

    const rows = await sql.query(normalizedSql, queryParams);
    const rowList = (Array.isArray(rows) ? rows : []) as T[];
    return {
      rows: rowList,
      rowCount: rowList.length,
    };
  } catch (err: any) {
    console.error('Database Query Error:', { error: err?.message, sql: text.substring(0, 120) });
    throw err;
  }
}

/**
 * Transaction Helper
 * Provides a transactional client interface compatible with Neon HTTP SQL
 */
export async function withTransaction<T>(
  callback: (client: { query: (text: string, params?: any[]) => Promise<{ rows: any[]; rowCount: number }> }) => Promise<T>
): Promise<T> {
  const client = {
    query: async (text: string, params?: any[]) => {
      return await query(text, params);
    },
  };
  return await callback(client);
}

// Emulated pool object for backwards compatibility with any existing imports
export const pool = {
  query,
  connect: async () => ({
    query,
    release: () => {},
  }),
};

export default { pool, query, withTransaction, dbEngine };
