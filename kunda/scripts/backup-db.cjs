#!/usr/bin/env node
// =====================================================================
// KUNDA SPACE: AUTOMATED MYSQL DATABASE BACKUP TO GOOGLE DRIVE (.sql)
// =====================================================================
// Designed for cPanel Cron Jobs, CLI execution, and server automation.
// Features:
// 1. Dumps MySQL database to a complete, standalone .sql file.
// 2. Detects whether database has changed since last backup (skips unchanged).
// 3. Retains all historical backups permanently (never deletes old backups).
// 4. Uploads every generated .sql backup to Google Drive using OAuth refresh token.
// =====================================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load environment variables from project root .env
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

/**
 * Formats a SQL value safely for .sql dump output
 */
function escapeSqlValue(val) {
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

  // String escaping
  const str = String(val);
  return `'${str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\0/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x1a/g, '\\Z')}'`;
}

/**
 * Exchanges Google OAuth2 refresh_token for a fresh access_token
 */
async function getGoogleDriveAccessToken(clientId, clientSecret, refreshToken) {
  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    });

    const data = await res.json();
    if (res.ok && data.access_token) {
      return data.access_token;
    }
    console.error('⚠️ Google Drive OAuth token refresh failed:', data);
    return null;
  } catch (err) {
    console.error('⚠️ Error contacting Google OAuth service:', err.message);
    return null;
  }
}

/**
 * Uploads file buffer to Google Drive.
 * Keeps all previous backups; never deletes older backup files.
 */
async function uploadToGoogleDrive(buffer, filename, mimeType, config) {
  const accessToken = await getGoogleDriveAccessToken(
    config.clientId,
    config.clientSecret,
    config.refreshToken
  );

  if (!accessToken) {
    return {
      success: false,
      error: 'Google Drive credentials missing or invalid. Check GOOGLE_DRIVE_CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN.',
    };
  }

  try {
    const metadata = {
      name: filename,
      mimeType,
      description: `Kunda Space MySQL Automated Database Backup - ${new Date().toISOString()}`,
    };
    if (config.folderId) {
      metadata.parents = [config.folderId];
    }

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
    const mediaPart = `${delimiter}Content-Type: ${mimeType}\r\nContent-Transfer-Encoding: base64\r\n\r\n${Buffer.from(buffer).toString('base64')}${closeDelimiter}`;
    const multipartBody = metadataPart + mediaPart;

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      }
    );

    const fileData = await res.json();
    if (!res.ok || !fileData.id) {
      return { success: false, error: fileData.error?.message || 'Google Drive upload rejected.' };
    }

    return {
      success: true,
      fileId: fileData.id,
      webViewLink: fileData.webViewLink || `https://drive.google.com/file/d/${fileData.id}/view`,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Main Database Backup Runner
 */
async function runDatabaseBackup(options = {}) {
  const force = options.force || process.argv.includes('--force') || process.argv.includes('-f');
  console.log('=============================================================');
  console.log(`📦 KUNDA SPACE: MySQL Database Backup Runner ${force ? '[FORCED RUN]' : ''}`);
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log('=============================================================');

  const dbUrl = process.env.DATABASE_URL;
  const host = process.env.MYSQL_HOST || process.env.DB_HOST || '127.0.0.1';
  const user = process.env.MYSQL_USER || process.env.DB_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || process.env.DB_NAME || 'kunda_space';
  const port = parseInt(process.env.MYSQL_PORT || process.env.DB_PORT || '3306', 10);

  let connection = null;

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
  } catch (connErr) {
    console.error('❌ Failed to connect to MySQL database:', connErr.message);
    return { success: false, error: connErr.message };
  }

  try {
    // 1. Fetch all base tables in database
    const [tablesRes] = await connection.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
    const tables = tablesRes.map((r) => Object.values(r)[0]);

    if (tables.length === 0) {
      console.warn('⚠️ No tables found in database. Nothing to backup.');
      return { success: false, error: 'Database has no tables.' };
    }

    console.log(`📋 Found ${tables.length} tables to evaluate: ${tables.join(', ')}`);

    // 2. Checksum and Change Detection
    // Compute checksum for each table to verify if any data has changed
    const checksumParts = [];
    let totalRowCount = 0;

    for (const table of tables) {
      try {
        const [cntRes] = await connection.query(`SELECT COUNT(*) AS cnt FROM \`${table}\``);
        const count = cntRes[0]?.cnt || 0;
        totalRowCount += Number(count);

        // Try built-in CHECKSUM TABLE
        const [chkRes] = await connection.query(`CHECKSUM TABLE \`${table}\``);
        const checksum = chkRes[0]?.Checksum || 0;
        checksumParts.push(`${table}:${count}:${checksum}`);
      } catch (chkErr) {
        // Fallback for tables where CHECKSUM TABLE might not be supported
        checksumParts.push(`${table}:fallback`);
      }
    }

    const currentHash = crypto.createHash('sha256').update(checksumParts.join('|')).digest('hex');

    // 3. Inspect Previous Backup State
    const backupsDir = path.resolve(__dirname, '../backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const stateFile = path.join(backupsDir, '.last_backup_meta.json');
    let lastMeta = null;
    if (fs.existsSync(stateFile)) {
      try {
        lastMeta = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      } catch (e) {
        lastMeta = null;
      }
    }

    // If database hasn't changed since last backup, skip creating duplicate backup
    if (!force && lastMeta && lastMeta.checksumHash === currentHash) {
      console.log('-------------------------------------------------------------');
      console.log('ℹ️  DATABASE UNCHANGED:');
      console.log(`    Last backup was created on: ${lastMeta.lastBackupTime}`);
      console.log(`    File: ${lastMeta.lastBackupFile}`);
      console.log('    No changes detected since last backup. Skipping backup generation.');
      console.log('    (Tip: Use --force or -f to generate a backup anyway)');
      console.log('-------------------------------------------------------------');
      return {
        success: true,
        skipped: true,
        reason: 'Database contents unchanged since last backup.',
        lastBackupFile: lastMeta.lastBackupFile,
      };
    }

    console.log('🔄 Changes detected in database! Generating new .sql backup...');

    // 4. Construct SQL Dump Content
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

      // Get CREATE TABLE statement
      const [createRes] = await connection.query(`SHOW CREATE TABLE \`${table}\``);
      const createTableSql = createRes[0]['Create Table'];
      sqlDump += `${createTableSql};\n\n`;

      // Get table data
      const [rows] = await connection.query(`SELECT * FROM \`${table}\``);
      if (rows && rows.length > 0) {
        sqlDump += `LOCK TABLES \`${table}\` WRITE;\n`;

        // Chunk inserts for performance and to respect max_allowed_packet
        const chunkSize = 100;
        const columns = Object.keys(rows[0]);
        const colList = columns.map((c) => `\`${c}\``).join(', ');

        for (let i = 0; i < rows.length; i += chunkSize) {
          const chunk = rows.slice(i, i + chunkSize);
          const valuesList = chunk
            .map((row) => `(${columns.map((c) => escapeSqlValue(row[c])).join(', ')})`)
            .join(',\n');

          sqlDump += `INSERT INTO \`${table}\` (${colList}) VALUES\n${valuesList};\n`;
        }

        sqlDump += `UNLOCK TABLES;\n\n`;
      }
    }

    sqlDump += `SET FOREIGN_KEY_CHECKS = 1;\n`;
    sqlDump += `-- =============================================================\n`;
    sqlDump += `-- End of MySQL Database Backup\n`;
    sqlDump += `-- =============================================================\n`;

    // 5. Save Locally (Never delete old backups!)
    fs.writeFileSync(localFilePath, sqlDump, 'utf8');
    const fileStats = fs.statSync(localFilePath);
    console.log(`💾 Local backup saved: ${backupFileName} (${(fileStats.size / 1024).toFixed(2)} KB)`);
    console.log(`📁 Saved to directory: ${backupsDir}`);

    // 6. Upload to Google Drive (Retaining all historical backups)
    const driveConfig = {
      clientId: process.env.GOOGLE_DRIVE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET || '',
      refreshToken: process.env.GOOGLE_DRIVE_REFRESH_TOKEN || '',
      folderId: process.env.GOOGLE_DRIVE_FOLDER_ID || '',
    };

    let driveResult = { success: false, error: 'Google Drive credentials not set in .env' };

    if (driveConfig.clientId && driveConfig.clientSecret && driveConfig.refreshToken) {
      console.log('🚀 Uploading backup to Google Drive...');
      const fileBuffer = fs.readFileSync(localFilePath);
      driveResult = await uploadToGoogleDrive(fileBuffer, backupFileName, 'application/sql', driveConfig);

      if (driveResult.success) {
        console.log('-------------------------------------------------------------');
        console.log('✅ GOOGLE DRIVE UPLOAD SUCCESSFUL!');
        console.log(`   File ID: ${driveResult.fileId}`);
        console.log(`   View Link: ${driveResult.webViewLink}`);
        console.log('   All historical backups remain preserved in your Google Drive.');
        console.log('-------------------------------------------------------------');
      } else {
        console.warn('⚠️ Google Drive upload error:', driveResult.error);
      }
    } else {
      console.log('ℹ️  GOOGLE DRIVE NOT CONFIGURED:');
      console.log('   To enable automatic upload to Google Drive, specify in .env:');
      console.log('   - GOOGLE_DRIVE_CLIENT_ID');
      console.log('   - GOOGLE_DRIVE_CLIENT_SECRET');
      console.log('   - GOOGLE_DRIVE_REFRESH_TOKEN');
      console.log('   - GOOGLE_DRIVE_FOLDER_ID (optional)');
      console.log('   Backup remains safely stored in local /backups folder.');
    }

    // 7. Update Metadata State File
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
      driveViewUrl: driveResult.webViewLink || null,
    };

    fs.writeFileSync(stateFile, JSON.stringify(newMeta, null, 2), 'utf8');

    console.log('🎉 Database backup routine completed successfully.');
    return {
      success: true,
      backupFile: backupFileName,
      localFilePath,
      sizeBytes: fileStats.size,
      driveResult,
    };
  } catch (err) {
    console.error('❌ Database backup encountered an error:', err);
    return { success: false, error: err.message };
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// If executed directly from command line (e.g. node scripts/backup-db.cjs)
if (require.main === module) {
  runDatabaseBackup()
    .then((result) => {
      if (!result.success) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal backup error:', err);
      process.exit(1);
    });
}

module.exports = { runDatabaseBackup };
