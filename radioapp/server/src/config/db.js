import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL;

let dbInstance = null;

// Lightweight file-backed SQL/Relational engine for zero-dependency local fallback
class LocalStorageAdapter {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = {
      users: [],
      radio_stations: [],
      station_admins: [],
      station_branding: [],
      radio_streams: [],
      programs: [],
      news_categories: [],
      news_articles: [],
      videos: [],
      homepage_sections: [],
      station_settings: [],
      analytics_events: [],
      analytics_sessions: [],
      audit_logs: [],
      verification_codes: [],
      radio_requests: [],
      in_app_notifications: []
    };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.data = { ...this.data, ...JSON.parse(raw) };
      } else {
        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        this.save();
      }
    } catch (e) {
      console.warn('[DB] Could not load local storage file, starting clean:', e.message);
    }
  }

  save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('[DB] Error writing local storage:', e.message);
    }
  }

  async query(text, params = []) {
    const trimmed = text.trim();

    // DDL statements (CREATE TABLE, ALTER TABLE, etc.)
    if (/^CREATE\s+TABLE/i.test(trimmed) || /^CREATE\s+EXTENSION/i.test(trimmed) || /^ALTER\s+TABLE/i.test(trimmed)) {
      return { rows: [], rowCount: 0 };
    }

    // Helper: matches WHERE condition for simple equality, OR branches, LOWER(), and booleans
    const matchRow = (row, whereClause, paramValues) => {
      if (!whereClause) return true;
      // Replace $1, $2 with corresponding value
      let expr = whereClause;
      paramValues.forEach((val, idx) => {
        const placeholder = new RegExp(`\\$${idx + 1}\\b`, 'g');
        const formatted = typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : (val === null ? 'NULL' : String(val));
        expr = expr.replace(placeholder, formatted);
      });

      // Split OR branches first (e.g. cond1 OR cond2)
      const orBranches = expr.split(/\s+OR\s+/i);

      return orBranches.some(branch => {
        // Inside each branch, all AND conditions must be satisfied
        const andTerms = branch.trim().split(/\s+AND\s+/i);

        return andTerms.every(term => {
          const trimmedTerm = term.trim();
          const eqMatch = trimmedTerm.match(/(?:LOWER\s*\(\s*)?([a-zA-Z0-9_]+)(?:\s*\))?\s*(=|!=|<>|LIKE|ILIKE|IS)\s*(.+)/i);
          if (!eqMatch) return false;

          const col = eqMatch[1].trim();
          const op = eqMatch[2].toUpperCase();
          let rawTarget = eqMatch[3].trim();

          // Check if LOWER() was wrapped around target
          const lowerTargetMatch = rawTarget.match(/^LOWER\s*\(\s*(.+?)\s*\)$/i);
          if (lowerTargetMatch) {
            rawTarget = lowerTargetMatch[1].trim();
          }

          let target = rawTarget;
          if (target.startsWith("'") && target.endsWith("'")) {
            target = target.substring(1, target.length - 1).replace(/''/g, "'");
          }

          const isLower = /LOWER\s*\(/i.test(trimmedTerm);
          const rowVal = row[col];

          // Boolean literal handling (e.g. used = false, is_read = true)
          if (target.toLowerCase() === 'false' || target.toLowerCase() === 'true') {
            const boolTarget = target.toLowerCase() === 'true';
            const boolRow = Boolean(rowVal);
            if (op === '=') return boolRow === boolTarget;
            if (op === '!=' || op === '<>') return boolRow !== boolTarget;
          }

          // NULL handling
          if (op === 'IS') {
            if (target.toUpperCase() === 'NULL') {
              return rowVal === null || rowVal === undefined;
            }
            if (target.toUpperCase() === 'NOT NULL') {
              return rowVal !== null && rowVal !== undefined;
            }
          }

          let v1 = rowVal;
          let v2 = target;

          if (isLower) {
            v1 = v1 !== null && v1 !== undefined ? String(v1).toLowerCase() : '';
            v2 = v2 !== null && v2 !== undefined ? String(v2).toLowerCase() : '';
          }

          if (op === '=') return String(v1 ?? '') === String(v2 ?? '');
          if (op === '!=' || op === '<>') return String(v1 ?? '') !== String(v2 ?? '');
          if (op === 'LIKE' || op === 'ILIKE') {
            const regex = new RegExp('^' + String(v2).replace(/%/g, '.*') + '$', 'i');
            return regex.test(String(v1 || ''));
          }

          return true;
        });
      });
    };

    // SELECT with JOIN (e.g. station_admins + radio_stations)
    const joinMatch = trimmed.match(/^SELECT\s+(.+?)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+[a-zA-Z0-9_]+)?\s+(?:LEFT\s+|INNER\s+)?JOIN\s+([a-zA-Z0-9_]+)(?:\s+[a-zA-Z0-9_]+)?\s+ON\s+(.+?)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+(.+?))?$/is);
    if (joinMatch) {
      const [, fieldsStr, table1Name, table2Name, onClause, whereClause] = joinMatch;
      const t1 = this.data[table1Name] || [];
      const t2 = this.data[table2Name] || [];

      const onParts = onClause.split('=').map(s => s.trim().replace(/^[a-zA-Z0-9_]+\./, ''));
      const [col1, col2] = onParts;

      const combined = [];
      t1.forEach(row1 => {
        const matches = t2.filter(row2 => String(row1[col1] || row1[col2]) === String(row2[col2] || row2[col1]));
        if (matches.length > 0) {
          matches.forEach(row2 => {
            combined.push({ ...row2, ...row1 });
          });
        }
      });

      const cleanedWhere = whereClause ? whereClause.replace(/[a-zA-Z0-9_]+\./g, '') : whereClause;
      let matched = combined.filter(row => matchRow(row, cleanedWhere, params));

      return { rows: JSON.parse(JSON.stringify(matched)), rowCount: matched.length };
    }

    // SELECT
    const selectMatch = trimmed.match(/^SELECT\s+(.+?)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+(.+?))?(?:\s+LIMIT\s+(\d+|\$\d+))?(?:\s+OFFSET\s+(\d+|\$\d+))?$/is);
    if (selectMatch) {
      const [, fieldsStr, tableName, whereClause, orderByClause, limitClause, offsetClause] = selectMatch;
      const table = this.data[tableName] || [];
      
      let matched = table.filter(row => matchRow(row, whereClause, params));

      // Handle COUNT(*)
      if (/COUNT\(\*\)/i.test(fieldsStr)) {
        return { rows: [{ count: matched.length.toString() }], rowCount: 1 };
      }

      // ORDER BY
      if (orderByClause) {
        const orderParts = orderByClause.split(',').map(s => s.trim());
        matched.sort((a, b) => {
          for (const op of orderParts) {
            const [col, dir] = op.split(/\s+/);
            const isDesc = dir && dir.toUpperCase() === 'DESC';
            if (a[col] < b[col]) return isDesc ? 1 : -1;
            if (a[col] > b[col]) return isDesc ? -1 : 1;
          }
          return 0;
        });
      }

      // OFFSET & LIMIT
      let offset = 0;
      if (offsetClause) {
        offset = offsetClause.startsWith('$') ? Number(params[parseInt(offsetClause.slice(1)) - 1]) : parseInt(offsetClause);
      }
      if (offset > 0) matched = matched.slice(offset);

      if (limitClause) {
        const limit = limitClause.startsWith('$') ? Number(params[parseInt(limitClause.slice(1)) - 1]) : parseInt(limitClause);
        if (limit > 0) matched = matched.slice(0, limit);
      }

      // Projection
      if (fieldsStr.trim() !== '*') {
        const cols = fieldsStr.split(',').map(s => {
          const alias = s.match(/([a-zA-Z0-9_]+)\s+AS\s+([a-zA-Z0-9_]+)/i);
          return alias ? { col: alias[1].trim(), as: alias[2].trim() } : { col: s.trim(), as: s.trim() };
        });
        matched = matched.map(row => {
          const res = {};
          cols.forEach(({ col, as }) => {
            res[as] = row[col] !== undefined ? row[col] : null;
          });
          return res;
        });
      }

      return { rows: JSON.parse(JSON.stringify(matched)), rowCount: matched.length };
    }

    // INSERT INTO table (cols) VALUES ($1, $2, ...) [ON CONFLICT ... DO UPDATE ...]
    const insertMatch = trimmed.match(/^INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*\((.+?)\)\s*VALUES\s*\((.+?)\)(?:\s+ON\s+CONFLICT.+)?(?:\s+RETURNING\s+(.+))?$/is);
    if (insertMatch) {
      const [, tableName, colsStr, valsStr, returningClause] = insertMatch;
      if (!this.data[tableName]) this.data[tableName] = [];

      const cols = colsStr.split(',').map(s => s.trim());
      const vals = valsStr.split(',').map(s => s.trim());
      const newRow = {};

      cols.forEach((col, idx) => {
        const valToken = vals[idx];
        if (!valToken) {
          newRow[col] = params[idx] !== undefined ? params[idx] : null;
        } else if (valToken.startsWith('$')) {
          const pIdx = parseInt(valToken.slice(1)) - 1;
          newRow[col] = params[pIdx] !== undefined ? params[pIdx] : null;
        } else if (valToken.toLowerCase() === 'false') {
          newRow[col] = false;
        } else if (valToken.toLowerCase() === 'true') {
          newRow[col] = true;
        } else if (valToken.toLowerCase() === 'null') {
          newRow[col] = null;
        } else if (valToken.startsWith("'") && valToken.endsWith("'")) {
          newRow[col] = valToken.slice(1, -1).replace(/''/g, "'");
        } else if (!isNaN(Number(valToken))) {
          newRow[col] = Number(valToken);
        } else {
          newRow[col] = valToken;
        }
      });

      if (!newRow.created_at) {
        newRow.created_at = new Date().toISOString();
      }

      // Handle conflict if id exists
      const existingIdx = newRow.id ? this.data[tableName].findIndex(r => r.id === newRow.id) : -1;
      if (existingIdx >= 0) {
        this.data[tableName][existingIdx] = { ...this.data[tableName][existingIdx], ...newRow };
      } else {
        this.data[tableName].push(newRow);
      }

      this.save();
      const returned = returningClause ? [newRow] : [];
      return { rows: returned, rowCount: 1 };
    }

    // UPDATE table SET col1 = $1, col2 = $2 WHERE ...
    const updateMatch = trimmed.match(/^UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+?))?(?:\s+RETURNING\s+(.+))?$/is);
    if (updateMatch) {
      const [, tableName, setClause, whereClause, returningClause] = updateMatch;
      const table = this.data[tableName] || [];
      let updatedCount = 0;
      const updatedRows = [];

      // Parse set clause: col1 = $1, col2 = 'value', col3 = false
      const setPairs = setClause.split(',').map(p => {
        const [col, rawVal] = p.split('=').map(s => s.trim());
        let val;
        if (rawVal.startsWith('$')) {
          const paramIdx = parseInt(rawVal.slice(1)) - 1;
          val = params[paramIdx];
        } else if (rawVal.toLowerCase() === 'false') {
          val = false;
        } else if (rawVal.toLowerCase() === 'true') {
          val = true;
        } else if (rawVal.toLowerCase() === 'null') {
          val = null;
        } else if (rawVal.startsWith("'") && rawVal.endsWith("'")) {
          val = rawVal.slice(1, -1).replace(/''/g, "'");
        } else if (!isNaN(Number(rawVal))) {
          val = Number(rawVal);
        } else {
          val = rawVal;
        }
        return { col, val };
      });

      for (let i = 0; i < table.length; i++) {
        if (matchRow(table[i], whereClause, params)) {
          setPairs.forEach(({ col, val }) => {
            table[i][col] = val;
          });
          table[i].updated_at = new Date().toISOString();
          updatedRows.push(table[i]);
          updatedCount++;
        }
      }

      this.save();
      return { rows: returningClause ? updatedRows : [], rowCount: updatedCount };
    }

    // DELETE FROM table WHERE ...
    const deleteMatch = trimmed.match(/^DELETE\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+?))?$/is);
    if (deleteMatch) {
      const [, tableName, whereClause] = deleteMatch;
      const table = this.data[tableName] || [];
      const beforeCount = table.length;
      this.data[tableName] = table.filter(row => !matchRow(row, whereClause, params));
      const deletedCount = beforeCount - this.data[tableName].length;
      this.save();
      return { rows: [], rowCount: deletedCount };
    }

    console.warn('[LocalStorageAdapter] Unhandled query pattern:', text);
    return { rows: [], rowCount: 0 };
  }
}

// Initialize the Database Connection (Postgres if DATABASE_URL is available, else local adapter)
export async function getDb() {
  if (dbInstance) return dbInstance;

  if (databaseUrl) {
    try {
      console.log('[DB] Connecting to PostgreSQL database at:', databaseUrl.split('@')[1] || 'provided URL');
      const pool = new pg.Pool({
        connectionString: databaseUrl,
        ssl: isProduction || databaseUrl.includes('sslmode=require') || databaseUrl.includes('vercel') || databaseUrl.includes('neon') || databaseUrl.includes('supabase')
          ? { rejectUnauthorized: false }
          : false,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      // Test connection
      await pool.query('SELECT 1');
      console.log('[DB] PostgreSQL successfully connected!');
      dbInstance = pool;
      return dbInstance;
    } catch (err) {
      console.warn('[DB] PostgreSQL connection failed (' + err.message + '). Falling back to local data store.');
    }
  }

  // Fallback to local storage
  const storagePath = process.env.VERCEL
    ? path.join('/tmp', 'radioapp_db.json')
    : (fs.existsSync(path.join(process.cwd(), 'server', 'data'))
        ? path.join(process.cwd(), 'server', 'data', 'radioapp_db.json')
        : path.join(process.cwd(), 'data', 'radioapp_db.json'));
  console.log('[DB] Using local database store at:', storagePath);
  dbInstance = new LocalStorageAdapter(storagePath);
  return dbInstance;
}

// Global query wrapper
export async function query(text, params = []) {
  const db = await getDb();
  return db.query(text, params);
}
