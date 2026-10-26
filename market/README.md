# Umuguzipro — Full React & PostgreSQL Platform

Umuguzipro is a production-grade, full-stack video-sharing, creator studio, local and digital service marketplace, appointment booking portal, and immutable financial ledger platform.

Built with **Next.js (App Router)**, **React**, **TypeScript**, **Tailwind CSS**, and **PostgreSQL with Prisma ORM**, designed specifically for high-scale **Vercel Serverless** deployment.

---

## 🚀 Key Highlights & Architecture

1. **Public YouTube-Style Experience (No Login Required)**:
   - Public visitors can immediately explore the homepage, browse categories, watch public videos, view creator channels, search across all content, and discover local services and products without creating an account.
   - Authentication is only requested when taking member actions (uploading, creating channels, booking, buying, commenting, liking, withdrawing).

2. **Enterprise Authentication with 2FA**:
   - **Registration**: Email + Password + Username + Display Name $\to$ 6-digit numeric email verification code (dispatched via Resend/Nodemailer).
   - **Login**: Email/Username + Password $\to$ 6-digit Two-Factor Authentication (2FA) security code dispatched to verified email $\to$ Secure HTTP-only session cookie (`umuguzi_session`).
   - Rate limiting, brute-force protection, and audit logging.

3. **Dynamic Site Branding & Theme Engine**:
   - Platform name, tagline, logo URL, favicon, contact info (email, phone, address), social links (WhatsApp, YouTube, Twitter/X, Instagram, LinkedIn, TikTok), and **CSS primary & accent brand colors** are customizable in real-time inside `/admin/settings`.
   - The entire platform dynamically updates without rebuilding or redeploying code.

4. **Multi-Language Architecture**:
   - Native support for **English (`en`)**, **Kinyarwanda (`rw`)**, and **French (`fr`)**.

5. **Creator Studio (`/studio`)**:
   - Dedicated dashboard for creators: video upload flow (with access control: Public, Private, Premium with pay-per-view price in RWF), channel customizer, audience analytics (views, device types, geographic breakdown: Rwanda, East Africa, Global), and comments moderation.

6. **Service Marketplace & Booking Engine (`/services`)**:
   - Local professional services directory (photography, videography, software engineering, music production, events, cleaning, consulting).
   - "I Need This Service" job request board where clients post custom requirements and providers bid.
   - Full booking system: appointment schedule picker, client notes, package selection, and status updates (Pending, Confirmed, Completed).

7. **Digital Marketplace (`/products`)**:
   - Digital downloads (video LUTs, sound packs, ebooks, presets).
   - Instant license entitlement generation upon purchase.

8. **Immutable Wallet & Ledger (`/dashboard/wallet`)**:
   - Double-entry accounting system tracking `availableBalance`, `pendingBalance`, `totalEarnings`, and `totalWithdrawn`.
   - Balances are NEVER modified without an immutable `WalletTransaction` audit trail.
   - Withdrawal requests supporting **MTN Mobile Money (Rwanda)**, **Airtel Money**, **Bank of Kigali / Bank Transfer**, and **PayPal**.
   - Admin approval, payout marking, and automatic wallet refunds if an administrator rejects a payout request.

9. **Affiliate & Referral Engine**:
   - Unique referral links (`?ref=CODE`) and dynamic QR Code generation for offline and social media marketing.
   - Automated commission attribution.

10. **Customizable Payment Gateways**:
    - **Flutterwave**: Public key, secret key, encryption key customizable in Admin Settings.
    - **Manual Transfers**: MTN MoMo / Airtel Money / Bank of Kigali transfer instructions customizable in Admin Settings.
    - **Wallet Payments**: Users can pay for bookings or digital items directly from their wallet balance.

11. **Multi-Cloud Storage Engine**:
    - **Vercel Blob** (Primary recommended for Vercel deployment)
    - **AWS S3**
    - **Cloudflare R2**

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Frontend**: React 18 / 19, TypeScript, Tailwind CSS, Lucide Icons
- **ORM & Database**: Prisma ORM, PostgreSQL (Neon, Supabase, Vercel Postgres, or self-hosted)
- **Session & Security**: JWT in HTTP-only cookies, `bcryptjs` password hashing
- **Email Delivery**: Resend API & Nodemailer SMTP fallback
- **Payments**: Flutterwave API & Manual MoMo/Bank Transfer instructions
- **Storage**: Vercel Blob, AWS S3, Cloudflare R2
- **Deployment**: Vercel Serverless

---

## 📋 Environment Variables Setup

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
# PostgreSQL Connection (Use Neon, Supabase, Vercel PG, or local PostgreSQL)
DATABASE_URL="postgresql://username:password@ep-sample-pooler.region.neon.tech/umuguzi?sslmode=require"
DIRECT_URL="postgresql://username:password@ep-sample.region.neon.tech/umuguzi?sslmode=require"

# Application URL
APP_URL="https://your-domain.vercel.app"
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"

# Auth Secret (Generate with: openssl rand -base64 32)
AUTH_SECRET="super-secret-jwt-and-session-encryption-key-32-chars-minimum"

# Email Delivery (Resend)
RESEND_API_KEY="re_1234567890abcdef"
EMAIL_FROM="Umuguzipro <noreply@umuguzi.pro>"

# Storage (Vercel Blob - automatically provided when adding Vercel Blob in Vercel project)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."

# Optional: AWS S3 or Cloudflare R2
STORAGE_ENDPOINT=""
STORAGE_ACCESS_KEY=""
STORAGE_SECRET_KEY=""
STORAGE_BUCKET=""
NEXT_PUBLIC_STORAGE_URL=""
```

---

## 🗄️ Database Initialization & Migrations

The database initialization is **safe, non-destructive, and idempotent**. It never drops existing tables or resets production data.

### 1. Synchronize Database Schema
```bash
npm run db:migrate
```
*(Runs `prisma db push` safely applying all tables, foreign keys, and indexes without data loss)*.

### 2. Seed Default Admin, Categories, and Sample Content
```bash
npm run db:seed
```
This sets up:
- **Super Admin Account**: `admin@umuguzipro.com` / `Admin@123456`
- **Featured Creator**: `creator@umuguzipro.com` / `Creator@123456`
- **Service Provider**: `provider@umuguzi.pro`
- **Initial Categories**: Music, Technology, Entertainment, Culture & Rwanda, Photography, Web Dev, Video Presets.
- **Initial Videos, Services, and Digital Products**.

### 3. One-Step Idempotent Setup
```bash
npm run db:init
```

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Generate Prisma Client
npm run prisma:generate

# Start Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Vercel Deployment Guide

1. **Push Code to GitHub / Git Remote**:
   ```bash
   git add .
   git commit -m "Umuguzipro production platform"
   git push origin main
   ```

2. **Import Project to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new) and select the `umuguzi` repository.
   - Choose **Next.js** framework preset.

3. **Configure Environment Variables in Vercel Project Settings**:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `AUTH_SECRET`
   - `RESEND_API_KEY`
   - `EMAIL_FROM`
   - `APP_URL`
   - `BLOB_READ_WRITE_TOKEN` (Or connect **Vercel Blob** with one click in the Vercel Storage tab).

4. **Build Settings**:
   - Build Command: `npm run build` *(which automatically runs `prisma generate && next build`)*
   - Output Directory: `.next`

5. **Deploy**:
   - Click **Deploy**. Vercel will install packages, compile TypeScript, optimize static pages, and deploy serverless route handlers.
   - After deployment, run `npm run db:seed` against your production database to populate default administrative accounts and categories.

---

## 🔑 Default Credentials for Testing

- **Administrator Panel** (`/admin`):
  - Email: `admin@umuguzipro.com`
  - Password: `Admin@123456`
- **Creator Studio** (`/studio`):
  - Email: `creator@umuguzipro.com`
  - Password: `Creator@123456`

*(In local development without external SMTP configured, verification and 2FA codes are automatically printed to your terminal console for instant login).*

---

## 📄 License
Umuguzipro Proprietary &copy; 2026. All rights reserved.
