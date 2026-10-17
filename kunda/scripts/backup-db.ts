import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { getDriveConfig, uploadBackupToGoogleDrive } from '../api/_lib/drive.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function escapeSqlValue(val: any): string {
  if (val === null || val === undefined) {
    return 'NULL';
  }
  if (typeof val === 'number') {
    return Number.isFinite(val) ? val.toString() : 'NULL';
  }
  if (typeof val === 'bigint') {
    return val.toString();
  }
  if (typeof val === 'boolean') {
    return val ? '1' : '0';
  }
  if (val instanceof Date) {
    return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
  }
  if (Buffer.isBuffer(val)) {
    return `X'${val.toString('hex')}'`;
  }
  if (typeof val === 'object') {
    const jsonStr = JSON.stringify(val);
    return `'${jsonStr.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\0/g, '\\0')}'`;
  }

  const str = String(val);
  return `'${str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\0/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x1a/g, '\\Z')}'`;
}

export async function runDatabaseBackup(options: { force?: boolean } = {}) {
  const force = options.force || process.argv.includes('--force') || process.argv.includes('-f');
  console.log('=============================================================');
  console.log(`📦 KUNDA SPACE: MySQL Database Backup Runner ${force ? '[FORCED]' : ''}`);
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log('=============================================================');

  const dbUrl = process.env.DATABASE_URL;
  const host = process.env.MYSQL_HOST || process.env.DB_HOST || '127.0.0.1';
  const user = process.env.MYSQL_USER || process.env.DB_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || process.env.DB_NAME || 'kunda_space';
  const port = parseInt(process.env.MYSQL_PORT || process.env.DB_PORT || '3306', 10);

  let connection: mysql.Connection | null = null;

  try {
    if (dbUrl) {
      connection = await mysql.createConnection({ uri: dbUrl });
    } else {
      connection = await mysql.createConnection({
        host,
        port,
        user,
        password,
        database,
      });
    }
    console.log(`✅ Connected to MySQL database "${database}" on ${host}:${port}.`);
  } catch (connErr: any) {
    console.error('❌ Failed to connect to MySQL database:', connErr.message);
    return { success: false, error: connErr.message };
  }

  try {
    const [tablesRes]: any = await connection.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
    const tables: string[] = tablesRes.map((r: any) => Object.values(r)[0]);

    if (tables.length === 0) {
      console.warn('⚠️ No tables found in database to backup.');
      return { success: false, error: 'Database has no tables.' };
    }

    console.log(`📋 Found ${tables.length} tables to evaluate.`);

    // Checksum & Change Detection
    const checksumParts: string[] = [];
    let totalRowCount = 0;

    for (const table of tables) {
      try {
        const [cntRes]: any = await connection.query(`SELECT COUNT(*) AS cnt FROM \`${table}\``);
        const count = cntRes[0]?.cnt || 0;
        totalRowCount += Number(count);

        const [chkRes]: any = await connection.query(`CHECKSUM TABLE \`${table}\``);
        const checksum = chkRes[0]?.Checksum || 0;
        checksumParts.push(`${table}:${count}:${checksum}`);
      } catch (chkErr) {
        checksumParts.push(`${table}:fallback`);
      }
    }

    const currentHash = crypto.createHash('sha256').update(checksumParts.join('|')).digest('hex');

    const backupsDir = path.resolve(__dirname, '../backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const stateFile = path.join(backupsDir, '.last_backup_meta.json');
    let lastMeta: any = null;
    if (fs.existsSync(stateFile)) {
      try {
        lastMeta = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      } catch (e) {
        lastMeta = null;
      }
    }

    // Skip if unchanged
    if (!force && lastMeta && lastMeta.checksumHash === currentHash) {
      console.log('-------------------------------------------------------------');
      console.log('ℹ️  DATABASE UNCHANGED:');
      console.log(`    Last backup: ${lastMeta.lastBackupTime}`);
      console.log(`    File: ${lastMeta.lastBackupFile}`);
      console.log('    No database changes detected. Skipping duplicate backup.');
      console.log('-------------------------------------------------------------');
      return {
        success: true,
        skipped: true,
        reason: 'Database contents unchanged since last backup.',
        lastBackupFile: lastMeta.lastBackupFile,
      };
    }

    console.log('🔄 Database changes detected! Generating .sql backup...');

    const timestampStr = new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').slice(0, 15);
    const backupFileName = `kunda_backup_${timestampStr}.sql`;
    const localFilePath = path.join(backupsDir, backupFileName);

    let sqlDump = '';
    sqlDump += `-- =============================================================\n`;
    sqlDump += `-- Kunda Space MySQL Database Backup\n`;
    sqlDump += `-- Generated: ${new Date().toISOString()}\n`;
    sqlDump += `-- Database: ${database}\n`;
    sqlDump += `-- Total Tables: ${tables.length}\n`;
    sqlDump += `-- Total Rows: ${totalRowCount}\n`;
    sqlDump += `-- =============================================================\n\n`;
    sqlDump += `SET NAMES utf8mb4;\n`;
    sqlDump += `SET FOREIGN_KEY_CHECKS = 0;\n`;
    sqlDump += `SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";\n`;
    sqlDump += `SET time_zone = "+00:00";\n\n`;

    for (const table of tables) {
      sqlDump += `-- -------------------------------------------------------------\n`;
      sqlDump += `-- Table structure and data for table \`${table}\`\n`;
      sqlDump += `-- -------------------------------------------------------------\n`;
      sqlDump += `DROP TABLE IF EXISTS \`${table}\`;\n`;

      const [createRes]: any = await connection.query(`SHOW CREATE TABLE \`${table}\``);
      const createTableSql = createRes[0]['Create Table'];
      sqlDump += `${createTableSql};\n\n`;

      const [rows]: any = await connection.query(`SELECT * FROM \`${table}\``);
      if (rows && rows.length > 0) {
        sqlDump += `LOCK TABLES \`${table}\` WRITE;\n`;

        const chunkSize = 100;
        const columns = Object.keys(rows[0]);
        const colList = columns.map((c) => `\`${c}\``).join(', ');

        for (let i = 0; i < rows.length; i += chunkSize) {
          const chunk = rows.slice(i, i + chunkSize);
          const valuesList = chunk
            .map((row: any) => `(${columns.map((c) => escapeSqlValue(row[c])).join(', ')})`)
            .join(',\n');

          sqlDump += `INSERT INTO \`${table}\` (${colList}) VALUES\n${valuesList};\n`;
        }

        sqlDump += `UNLOCK TABLES;\n\n`;
      }
    }

    sqlDump += `SET FOREIGN_KEY_CHECKS = 1;\n`;
    sqlDump += `-- Dump completed on ${new Date().toISOString()}\n`;

    // Save locally without deleting old files
    fs.writeFileSync(localFilePath, sqlDump, 'utf8');
    const fileStats = fs.statSync(localFilePath);
    console.log(`💾 Local backup saved: ${backupFileName} (${(fileStats.size / 1024).toFixed(2)} KB)`);

    // Upload to Google Drive (never deletes old backups)
    const fileBuffer = fs.readFileSync(localFilePath);
    const driveResult = await uploadBackupToGoogleDrive(fileBuffer, backupFileName, 'application/sql');

    if (driveResult.success) {
      console.log('✅ Google Drive upload successful!');
      console.log(`   File ID: ${driveResult.fileId}`);
      console.log(`   Link: ${driveResult.webViewLink || driveResult.url}`);
    } else {
      console.warn('⚠️ Google Drive upload notice:', driveResult.error);
    }

    const newMeta = {
      lastBackupTime: new Date().toISOString(),
      lastBackupFile: backupFileName,
      localFilePath,
      fileSizeBytes: fileStats.size,
      totalTables: tables.length,
      totalRows: totalRowCount,
      checksumHash: currentHash,
      driveUploaded: driveResult.success,
      driveFileId: driveResult.fileId || null,
      driveViewUrl: driveResult.webViewLink || driveResult.url || null,
    };

    fs.writeFileSync(stateFile, JSON.stringify(newMeta, null, 2), 'utf8');

    return {
      success: true,
      backupFile: backupFileName,
      localFilePath,
      sizeBytes: fileStats.size,
      driveResult,
    };
  } catch (err: any) {
    console.error('❌ Backup failure:', err);
    return { success: false, error: err.message };
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('backup-db.ts')) {
  runDatabaseBackup()
    .then((r) => {
      if (!r.success) process.exit(1);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
