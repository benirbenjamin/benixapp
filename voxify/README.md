# Voxify Space — Choir Management & Music Learning SaaS Platform

Voxify Space is a complete, multi-tenant SaaS application designed for managing choirs, scheduling Sunday worship services, assigning practice songs, distributing voice-part audio tracks (Soprano, Alto, Tenor, Bass), tracking member learning readiness, and managing subscription plans.

---

## ⚡ Automated Supabase Database Setup (Instant Tables & Buckets Creation)

When you connect your project to Supabase, you can set up all **20 PostgreSQL database tables**, **Row Level Security (RLS) policies**, **storage buckets**, and **initial SaaS subscription plans** automatically using either of these two methods:

### Method A: One-Click Web Setup Button (Easiest)
1. In your `.env` or Vercel Environment Variables, provide your Supabase PostgreSQL connection string:
   ```env
   DATABASE_URL=postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
2. Open your application at `/admin` (Super Admin Control Center).
3. Click the **⚡ Run One-Click Supabase DB Setup** button.
4. All tables, functions, RLS policies, storage buckets, and initial plans are created automatically in seconds!

---

### Method B: Automated Command-Line Setup Script (`npm run db:setup`)
1. Provide your `DATABASE_URL` in `.env` or `.env.local`:
   ```env
   DATABASE_URL=postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
2. Run the automated script:
   ```bash
   npm run db:setup
   ```
3. The script will automatically execute:
   - `00001_initial_schema.sql` (Creates all 20 normalized tables & code generator)
   - `00002_rls_policies.sql` (Applies multi-tenant Row Level Security policies)
   - `00003_storage_buckets.sql` (Creates storage buckets for audio, sheet music PDFs, and avatars)
   - `seed.sql` (Populates initial dynamic SaaS subscription plans)

---

## 🚀 Full Production Deployment Guide

### Step 1: Create Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard) and click **New Project**.
2. Copy your `Project URL`, `anon` key, and PostgreSQL Connection String (`DATABASE_URL`).

### Step 2: Run Automated Database Setup
Run `npm run db:setup` or hit the **One-Click Setup** button in `/admin`.

### Step 3: Deploy to Vercel
1. Import your GitHub repository into [Vercel](https://vercel.com/new).
2. Set Environment Variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   DATABASE_URL=postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   RESEND_API_KEY=your-resend-key
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   ```
3. Deploy!

---

## 🧪 Production Verification Checklist

- [x] Automated setup script `npm run db:setup` creates all tables, RLS policies & buckets.
- [x] Web API `/api/setup` supports one-click database setup.
- [x] `npm run build` compiles cleanly with 0 TypeScript errors.
- [x] Supabase RLS enforces multi-tenant choir data isolation.
- [x] Touch-friendly Audio Practice Engine supports variable speed & A-B looping.
- [x] Super Admin portal `/admin` manages dynamic SaaS plans.
