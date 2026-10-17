// =====================================================================
// GET & POST /api/admin/backup - Database Backup & Google Drive Sync
// =====================================================================
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractAuthUser, isAuthorizedRole } from '../../_lib/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let runDatabaseBackup: any = null;
try {
  // @ts-ignore
  const backupModule = await import('../../../scripts/backup-db.ts').catch(() => null);
  if (backupModule) runDatabaseBackup = backupModule.runDatabaseBackup;
} catch (e) {
  // Graceful fallback in serverless lambda
}

export default async function handler(req: any, res: any) {
  const auth = extractAuthUser(req);
  if (!auth || !isAuthorizedRole(auth.role, ['super_admin', 'admin'])) {
    return res.status(403).json({ success: false, error: 'Forbidden: Admin access required.' });
  }

  const backupsDir = path.resolve(__dirname, '../../../backups');
  const metaFile = path.join(backupsDir, '.last_backup_meta.json');

  // GET: Fetch status of database backups
  if (req.method === 'GET') {
    let lastMeta = null;
    if (fs.existsSync(metaFile)) {
      try {
        lastMeta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
      } catch (e) {
        lastMeta = null;
      }
    }

    // List all existing .sql backups (retained historically)
    let backupFiles: any[] = [];
    if (fs.existsSync(backupsDir)) {
      const files = fs.readdirSync(backupsDir);
      backupFiles = files
        .filter((f) => f.endsWith('.sql'))
        .map((f) => {
          const stat = fs.statSync(path.join(backupsDir, f));
          return {
            filename: f,
            sizeBytes: stat.size,
            sizeFormatted: `${(stat.size / 1024).toFixed(1)} KB`,
            createdAt: stat.birthtime.toISOString(),
          };
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    return res.status(200).json({
      success: true,
      lastBackup: lastMeta,
      historyCount: backupFiles.length,
      history: backupFiles,
    });
  }

  // POST: Trigger backup run (supports force: true)
  if (req.method === 'POST') {
    const { force } = req.body || {};
    try {
      const result = await runDatabaseBackup({ force: Boolean(force) });
      return res.status(200).json(result);
    } catch (err: any) {
      console.error('Manual backup trigger error:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to generate database backup',
      });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
