import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { query, hasValidDbConfig } from './db';
import {
  INITIAL_COMPANY_DATA,
  INITIAL_SOCIAL_LINKS,
  INITIAL_PROJECTS,
  INITIAL_CATEGORIES,
  INITIAL_BLOG_ARTICLES
} from './seed-data';

export async function initDb() {
  if (!hasValidDbConfig && process.env.VERCEL) {
    return;
  }

  console.log('🚀 Starting BenixSpace Database Verification & Initialization...');

  try {
    // 1. Read DDL Schema SQL
    const schemaPath = path.join(process.cwd(), 'src', 'server', 'db', 'schema.sql');
    let schemaSql = '';
    if (fs.existsSync(schemaPath)) {
      schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    } else {
      // Inline schema fallback if file path differs in compiled bundle
      schemaSql = `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'admin',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          slug VARCHAR(100) UNIQUE NOT NULL,
          type VARCHAR(50) DEFAULT 'general',
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS projects (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) UNIQUE NOT NULL,
          url VARCHAR(500) NOT NULL,
          short_description TEXT NOT NULL,
          full_description TEXT,
          image_url VARCHAR(500),
          gallery_images TEXT,
          category VARCHAR(100) DEFAULT 'Web Application',
          tags TEXT,
          technologies TEXT,
          status VARCHAR(50) DEFAULT 'published',
          featured BOOLEAN DEFAULT false,
          embed_mode VARCHAR(50) DEFAULT 'both',
          sort_order INT DEFAULT 0,
          seo_title VARCHAR(255),
          seo_description TEXT,
          seo_keywords TEXT,
          og_image_url VARCHAR(500),
          published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS articles (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          slug VARCHAR(255) UNIQUE NOT NULL,
          summary TEXT,
          content TEXT NOT NULL,
          featured_image_url VARCHAR(500),
          category VARCHAR(100) DEFAULT 'Technology',
          tags TEXT,
          author_name VARCHAR(100) DEFAULT 'Benir Benjamin',
          status VARCHAR(50) DEFAULT 'published',
          published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          seo_title VARCHAR(255),
          seo_description TEXT,
          seo_keywords TEXT,
          canonical_url VARCHAR(500),
          og_image_url VARCHAR(500),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS analytics_events (
          id SERIAL PRIMARY KEY,
          event_type VARCHAR(50) NOT NULL,
          page_url VARCHAR(500) NOT NULL,
          page_type VARCHAR(50),
          project_id INT REFERENCES projects(id) ON DELETE SET NULL,
          article_id INT REFERENCES articles(id) ON DELETE SET NULL,
          referrer VARCHAR(500),
          user_agent VARCHAR(500),
          device_type VARCHAR(50),
          browser VARCHAR(100),
          os VARCHAR(100),
          country VARCHAR(100) DEFAULT 'Unknown',
          region VARCHAR(100),
          session_id VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS contact_messages (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          subject VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          is_read BOOLEAN DEFAULT false,
          ip_address VARCHAR(100),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS company_settings (
          id SERIAL PRIMARY KEY,
          company_name VARCHAR(255) DEFAULT 'NebeluRw Co. Ltd',
          company_description TEXT,
          history TEXT,
          founder_name VARCHAR(255) DEFAULT 'Benir Benjamin',
          founder_bio TEXT,
          email VARCHAR(255) DEFAULT 'benirabok@gmail.com',
          phone VARCHAR(100) DEFAULT '0783987223',
          address VARCHAR(255) DEFAULT 'Kigali, Rwanda',
          services_json TEXT,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS social_links (
          id SERIAL PRIMARY KEY,
          platform VARCHAR(100) NOT NULL,
          handle VARCHAR(255) NOT NULL,
          custom_url VARCHAR(500),
          sort_order INT DEFAULT 0,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS article_comments (
          id VARCHAR(255) PRIMARY KEY,
          article_id INT NOT NULL,
          parent_id VARCHAR(255),
          author_name VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          likes_count INT DEFAULT 0,
          status VARCHAR(50) DEFAULT 'approved',
          is_admin_reply BOOLEAN DEFAULT false,
          user_ip VARCHAR(100),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS banned_ips (
          ip VARCHAR(100) PRIMARY KEY,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;
    }

    // Execute Schema DDL
    await query(schemaSql);
    console.log('✓ Database Tables Verified/Created.');

    // 2. Check & Seed Default Administrator Account
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'benirabok@gmail.com';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'BenixSpace2026!';
    
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    if (existingUser.rowCount === 0) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(adminPassword, salt);
      await query(
        'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4)',
        [adminEmail, hash, 'Benir Benjamin', 'admin']
      );
      console.log(`✓ Admin User created: ${adminEmail}`);
    }

    // 3. Check & Seed Company Settings
    const existingSettings = await query('SELECT id FROM company_settings LIMIT 1');
    if (existingSettings.rowCount === 0) {
      await query(
        `INSERT INTO company_settings (company_name, company_description, history, founder_name, founder_bio, email, phone, address, services_json)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          INITIAL_COMPANY_DATA.company_name,
          INITIAL_COMPANY_DATA.company_description,
          INITIAL_COMPANY_DATA.history,
          INITIAL_COMPANY_DATA.founder_name,
          INITIAL_COMPANY_DATA.founder_bio,
          INITIAL_COMPANY_DATA.email,
          INITIAL_COMPANY_DATA.phone,
          INITIAL_COMPANY_DATA.address,
          INITIAL_COMPANY_DATA.services_json
        ]
      );
      console.log('✓ Initial NebeluRw Company Settings Seeded.');
    }

    // 4. Check & Seed Social Links
    const existingSocial = await query('SELECT id FROM social_links LIMIT 1');
    if (existingSocial.rowCount === 0) {
      for (const item of INITIAL_SOCIAL_LINKS) {
        await query(
          'INSERT INTO social_links (platform, handle, custom_url, sort_order) VALUES ($1, $2, $3, $4)',
          [item.platform, item.handle, item.custom_url, item.sort_order]
        );
      }
      console.log('✓ Initial Social Links Seeded.');
    }

    // 5. Check & Seed Initial Projects
    const existingProjects = await query('SELECT id FROM projects LIMIT 1');
    if (existingProjects.rowCount === 0) {
      for (const proj of INITIAL_PROJECTS) {
        await query(
          `INSERT INTO projects 
            (name, slug, url, short_description, full_description, image_url, gallery_images, category, tags, technologies, status, featured, embed_mode, sort_order, seo_title, seo_description, seo_keywords)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
          [
            proj.name,
            proj.slug,
            proj.url,
            proj.short_description,
            proj.full_description,
            proj.image_url,
            proj.gallery_images,
            proj.category,
            proj.tags,
            proj.technologies,
            proj.status,
            proj.featured,
            proj.embed_mode,
            proj.sort_order,
            proj.seo_title,
            proj.seo_description,
            proj.seo_keywords
          ]
        );
      }
      console.log('✓ Initial NebeluRw Projects Seeded (Benix Space TV, Benix Games, Easy Calc, Radio, Voxify).');
    }

    // 6. Check & Seed Initial Categories
    const existingCategories = await query('SELECT id FROM categories LIMIT 1');
    if (existingCategories.rowCount === 0) {
      for (const cat of INITIAL_CATEGORIES) {
        await query(
          'INSERT INTO categories (name, slug, type, description) VALUES ($1, $2, $3, $4)',
          [cat.name, cat.slug, cat.type, cat.description]
        );
      }
      console.log('✓ Initial Blog & Project Categories Seeded.');
    }

    // 7. Check & Seed Initial Blog Articles
    const existingArticles = await query('SELECT id FROM articles LIMIT 1');
    if (existingArticles.rowCount === 0) {
      for (const article of INITIAL_BLOG_ARTICLES) {
        await query(
          `INSERT INTO articles 
            (title, slug, summary, content, featured_image_url, category, tags, author_name, status, seo_title, seo_description, seo_keywords)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            article.title,
            article.slug,
            article.summary,
            article.content,
            article.featured_image_url,
            article.category,
            article.tags,
            article.author_name,
            article.status,
            article.seo_title,
            article.seo_description,
            article.seo_keywords
          ]
        );
      }
      console.log('✓ Initial Blog Articles Seeded.');
    }

    // 8. Check & Seed Initial Analytics Baseline Events
    const existingAnalytics = await query('SELECT id FROM analytics_events LIMIT 1');
    if (existingAnalytics.rowCount === 0) {
      const sampleEvents = [
        { type: 'page_view', url: 'https://benix.space/', pType: 'home', dev: 'desktop', br: 'Chrome', os: 'Windows', ref: 'Google Search' },
        { type: 'page_view', url: 'https://benix.space/projects', pType: 'projects', dev: 'mobile', br: 'Safari', os: 'iOS', ref: 'Direct' },
        { type: 'page_view', url: 'https://benix.space/projects/benix-space-tv', pType: 'project_detail', projId: 1, dev: 'desktop', br: 'Chrome', os: 'Windows', ref: 'Google Search' },
        { type: 'project_external_click', url: 'https://benix.space/projects', pType: 'project_click', projId: 1, dev: 'desktop', br: 'Chrome', os: 'Windows', ref: 'Direct' },
        { type: 'project_external_click', url: 'https://benix.space/projects', pType: 'project_click', projId: 3, dev: 'mobile', br: 'Chrome', os: 'Android', ref: 'Google Search' },
        { type: 'page_view', url: 'https://benix.space/blog', pType: 'blog', dev: 'desktop', br: 'Firefox', os: 'Windows', ref: 'Facebook' },
        { type: 'page_view', url: 'https://benix.space/blog/building-modern-web-applications-rwanda-digital-ecosystem', pType: 'blog_detail', artId: 1, dev: 'desktop', br: 'Chrome', os: 'Windows', ref: 'X (Twitter)' },
        { type: 'page_view', url: 'https://benix.space/services', pType: 'services', dev: 'tablet', br: 'Safari', os: 'iOS', ref: 'Direct' },
        { type: 'page_view', url: 'https://benix.space/about', pType: 'about', dev: 'desktop', br: 'Edge', os: 'Windows', ref: 'Direct' },
        { type: 'project_external_click', url: 'https://benix.space/', pType: 'project_click', projId: 2, dev: 'mobile', br: 'Safari', os: 'iOS', ref: 'Instagram' },
      ];

      for (let i = 0; i < 45; i++) {
        const item = sampleEvents[i % sampleEvents.length];
        const daysAgo = Math.floor(Math.random() * 28);
        const hoursAgo = Math.floor(Math.random() * 23);
        const minutesAgo = Math.floor(Math.random() * 59);
        const createdAt = new Date(Date.now() - (daysAgo * 24 * 3600 * 1000 + hoursAgo * 3600 * 1000 + minutesAgo * 60 * 1000)).toISOString();
        const sessId = `sess_seed_${(i % 12) + 1}`;

        await query(
          `INSERT INTO analytics_events 
            (event_type, page_url, page_type, project_id, article_id, referrer, user_agent, device_type, browser, os, session_id, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            item.type, item.url, item.pType, item.projId || null, item.artId || null,
            item.ref, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', item.dev, item.br,
            item.os, sessId, createdAt
          ]
        );
      }
      console.log('✓ Initial Baseline Analytics Events Seeded.');
    }

    console.log('✨ BenixSpace Database Verification & Seeding Complete!');
  } catch (err: any) {
    console.error('⚠️ Database Initialization Error:', err?.message || err);
  }
}
