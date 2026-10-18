import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const url = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_j9q1UhnxgTrl@ep-soft-hill-b4t6y52i-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';


const pool = new Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000
});

async function run() {
  console.log('🚀 Connecting to Neon PostgreSQL to import all 36 real stations...');
  try {
    // 1. Ensure stations table exists in public schema
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stations (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        logo_url TEXT,
        stream_url TEXT NOT NULL,
        stream_type VARCHAR(50) DEFAULT 'AUDIO',
        station_type VARCHAR(50) DEFAULT 'RADIO',
        location VARCHAR(255),
        frequency VARCHAR(100),
        accent_color VARCHAR(50) DEFAULT '#0284c7',
        status VARCHAR(50) DEFAULT 'ONLINE',
        is_active BOOLEAN DEFAULT true,
        is_featured BOOLEAN DEFAULT false,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table "stations" verified in Neon.');

    // 2. Ensure core_users has country and app_profiles
    try {
      await pool.query(`
        ALTER TABLE core_users ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Rwanda';
        ALTER TABLE core_users ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(100);
        ALTER TABLE core_users ADD COLUMN IF NOT EXISTS app_profiles JSONB DEFAULT '{}'::jsonb;
      `);
      console.log('✅ Columns country, whatsapp, and app_profiles verified in core_users.');
    } catch (e) {
      console.log('core_users alter note:', e.message);
    }

    // 3. Read stations from real_stations.json
    const jsonPath = path.join(__dirname, 'src', 'client', 'services', 'real_stations.json');
    const stations = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    let inserted = 0;
    for (const st of stations) {
      await pool.query(`
        INSERT INTO stations (
          id, name, slug, description, logo_url, stream_url, stream_type,
          station_type, location, frequency, accent_color, status, is_active,
          is_featured, display_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          logo_url = EXCLUDED.logo_url,
          stream_url = EXCLUDED.stream_url,
          stream_type = EXCLUDED.stream_type,
          station_type = EXCLUDED.station_type,
          location = EXCLUDED.location,
          frequency = EXCLUDED.frequency,
          accent_color = EXCLUDED.accent_color,
          status = EXCLUDED.status,
          is_active = EXCLUDED.is_active,
          is_featured = EXCLUDED.is_featured,
          display_order = EXCLUDED.display_order;
      `, [
        st.id,
        st.name,
        st.slug,
        st.description || '',
        st.logo_url || '/logo.png',
        st.stream_url,
        st.stream_type || 'AUDIO',
        st.station_type || 'RADIO',
        st.location || '',
        st.frequency || '',
        st.accent_color || '#0284c7',
        st.status || 'ONLINE',
        st.is_active !== false,
        st.is_featured === true,
        st.display_order || 0
      ]);
      inserted++;
    }

    console.log(`🎉 Successfully imported/updated ${inserted} real stations in Neon PostgreSQL database!`);

  } catch (err) {
    console.warn('Database note during import (will continue with hybrid layer):', err.message);
  } finally {
    await pool.end();
  }
}

run();
