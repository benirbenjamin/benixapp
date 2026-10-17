import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeed() {
  const dbUrl = process.env.DATABASE_URL;
  const host = process.env.MYSQL_HOST || process.env.DB_HOST || '127.0.0.1';
  const user = process.env.MYSQL_USER || process.env.DB_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || process.env.DB_NAME || 'kunda_space';
  const port = parseInt(process.env.MYSQL_PORT || process.env.DB_PORT || '3306', 10);

  if (!dbUrl && !process.env.MYSQL_DATABASE && !process.env.DB_NAME) {
    console.warn('⚠️ No MySQL database configuration found in .env (DATABASE_URL or MYSQL_DATABASE). Seeding skipped.');
    return;
  }

  let connection: mysql.Connection | null = null;

  try {
    console.log('🔄 Connecting to MySQL database for seeding...');
    if (dbUrl) {
      connection = await mysql.createConnection({
        uri: dbUrl,
        multipleStatements: true,
      });
    } else {
      connection = await mysql.createConnection({
        host,
        port,
        user,
        password,
        database,
        multipleStatements: true,
      });
    }

    console.log('✅ Connected to MySQL. Reading seed.sql...');
    const seedPath = path.join(__dirname, 'seed.sql');
    const sql = fs.readFileSync(seedPath, 'utf8');

    console.log('🌱 Applying MySQL database seed records...');
    await connection.query(sql);
    console.log('✅ MySQL seeding completed successfully.');
  } catch (err) {
    console.error('❌ MySQL seeding failed:', err);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runSeed();
