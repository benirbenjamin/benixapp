# 💖 Kunda Space (Bilingual & Trilingual Dating Platform)

> **"Find Your Connection"** | **"Shaka Umukunzi"** | **"Trouvez Votre Moitié"**

Kunda Space is a complete, production-ready bilingual and trilingual relationship platform targeting Rwanda and international members interested in authentic, verified connections. Built with a modern, high-performance architecture: React, Vite, TypeScript, Tailwind CSS, secure Vercel Serverless Functions, PostgreSQL with auditable wallet accounting, Flutterwave payments, and layered multilingual contact protection.

---

## 🌟 Key Highlights & Architectural Features

1. **Trilingual Internationalization (`en`, `rw`, `fr`)**:
   - Comprehensive translation dictionaries covering every navigation item, form field, button, policy, empty state, and error message in **English**, **Kinyarwanda**, and **French**.
   - Language selector with persistent storage and URL synchronization (`/`, `/rw/`, `/fr/`, `/en/`).

2. **Strict Server-Side 18+ Verification**:
   - Every member's birth date is verified on the server.
   - Database constraint `check_adult_age` ensures accounts under 18 cannot be created.

3. **3-Step Registration Wizard**:
   - **Step 1: Account & Location**: Display name, email, password, DOB, gender, country selector with ISO calling codes, auto-suggested Rwandan & international cities, international phone validation.
   - **Step 2: Relationship Goals & Preferences**: Relationship intentions (serious relationship, marriage, friendship, casual dating), age ranges, height, languages, hobbies, and adult stock photo reference examples.
   - **Step 3: Photos & Publishing**: Primary photo, gallery, preview review, and Terms/Privacy confirmation.

4. **Algorithmic Compatibility Engine (0–100 Score)**:
   - Evaluates Relationship Intentions (25%), Age Alignment (20%), Location (15%), Shared Interests (15%), Language (10%), and Lifestyle (10%).
   - Normalizes scores and generates human-readable match explanations ("Why you match").
   - Hard mutual gender identity filters.

5. **Messaging with Free Allowances & Paid Safeguards**:
   - 3 free initial outgoing messages to 3 distinct recipients.
   - 3 free conversation replies.
   - Pay-Per-Message (150 RWF) fallback or unlimited passes.
   - In-app notification center with Web Audio chime alerts.

6. **Layered Multilingual Contact Leak Detection**:
   - Restricts sharing raw phone digits, spaced phone numbers, or international codes in chat.
   - Detects spelled-out numbers in **English** (*"zero seven eight..."*), **Kinyarwanda** (*"zeru karindwi umunani..."*), and **French** (*"zéro sept huit..."*).
   - Blocks WhatsApp links, Telegram handles, and external social media redirection.
   - Proactive guidance with safe suggestions and moderation audit logging.

7. **Direct Contact Unlock with Mutual Consent**:
   - Contact numbers are masked in chat until unlocked.
   - Requires recipient's explicit `contactSharingConsent`.
   - Debits 2,000 RWF atomically from wallet ledger.

8. **Auditable Wallet Ledger & Flutterwave Payments**:
   - Minor-unit integer ledger tracking deposits, message deductions, contact unlocks, and subscriptions.
   - Server-side Flutterwave initialization with HMAC-SHA256 signature verification (`verif-hash`).
   - Idempotency keys prevent duplicate wallet credits on repeated webhooks.
   - Built-in Sandbox/Test Mode for immediate local verification.

9. **Administrative Dashboard**:
   - Overview KPI metrics (registered members, active passes, lifetime deposits).
   - User management (search, suspend, reactivate, toggle verification badges).
   - Dynamic business pricing editor (live adjustments to free message counts and costs).
   - Moderation queue for reviewing flagged messages and leak events.
   - Financial ledger audit trail with manual authorized adjustment credits.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite 6, TypeScript, Lucide React Icons
- **Styling**: Tailwind CSS with custom Kunda Space color palette (`brand-rose`, `violet`, `slate`)
- **Backend**: Node.js, Vercel Serverless Functions (`/api/*`), Express development runner
- **Database**: PostgreSQL (compatible with Supabase, Neon, AWS RDS)
- **Payments**: Flutterwave (MTN Mobile Money, Airtel Money, Visa, Mastercard)
- **Audio Synthesis**: Native Web Audio API chime alerts (zero external MP3 dependencies)
- **Testing**: Vitest (Unit & integration test suites)

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- Node.js 18+ (tested on v22)
- npm 9+

### 2. Clone and Install Dependencies
```bash
git clone <repository-url>
cd kunda
npm install
```

### 3. Environment Configuration
Copy the template configuration:
```bash
cp .env.example .env
```
Fill in your credentials or keep defaults for local mock mode:
```env
PORT=3001
APP_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kunda_space
JWT_SECRET=your-64-character-jwt-secret-key-here
FLW_PUBLIC_KEY=FLWPUBK_TEST-xxxxxxxxxxxxxxx
FLW_SECRET_KEY=FLWSECK_TEST-xxxxxxxxxxxxxxx
FLW_SECRET_HASH=kunda_space_flw_webhook_secret_hash_verify
```

### 4. Running Migrations & Seeds
If using a live PostgreSQL database (e.g. Supabase):
```bash
npm run db:migrate
npm run db:seed
```
*Note: If `DATABASE_URL` is omitted, Kunda Space automatically activates an in-memory storage engine preloaded with adult Rwandan profiles and an initial admin account.*

### 5. Running the Application
In your terminal, start the local API server and Vite frontend:
```bash
# Terminal 1: API Server
npm run dev:server

# Terminal 2: Frontend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Default Seed Admin Credentials

For demonstration and admin review:
- **Email**: `admin@kunda.space`
- **Password**: `Admin@Kunda2026!`
- **Role**: `super_admin`
- **Initial Wallet Balance**: 50,000 RWF

---

## 🧪 Running Automated Tests

Run the test suite with Vitest:
```bash
npm test
```
The test suite covers:
- Server-side adult age verification (18+)
- Multilingual contact moderation (English, Kinyarwanda, French)
- Algorithmic compatibility scoring (0–100) & hard gender filtering
- Atomic wallet ledger & idempotency protection
- Free messaging allowances and pay-per-message logic

---

## 🚢 Vercel Deployment Guide

1. Push your repository to GitHub or GitLab.
2. In the [Vercel Dashboard](https://vercel.com):
   - Click **Add New** -> **Project**.
   - Select your repository.
   - Framework Preset: **Vite**.
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. In **Settings -> Environment Variables**, configure:
   - `DATABASE_URL`: Your Supabase or PostgreSQL connection string
   - `JWT_SECRET`: Random 64-character secret
   - `APP_URL`: Your production domain (e.g. `https://kunda.space`)
   - `FLW_SECRET_KEY`: Flutterwave Secret Key
   - `FLW_PUBLIC_KEY`: Flutterwave Public Key
   - `FLW_SECRET_HASH`: Your custom webhook secret hash
   - `EMAIL_PROVIDER`: `resend` or `smtp` (or leave default for mock)
   - `RESEND_API_KEY`: Your Resend API Key (`re_...`)
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: Your SMTP credentials (if using SMTP)
   - `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`, `GOOGLE_DRIVE_REFRESH_TOKEN`: Google Drive OAuth2 credentials (optional folder ID)
4. Click **Deploy**. Vercel will install dependencies, build the frontend, and deploy all serverless API endpoints under `/api/*`.

---

## 📧 Email Verification & Password Recovery (Resend & SMTP)

Kunda Space features a unified, multi-provider email engine configured either via environment variables or directly inside the **Admin Portal -> Settings**:
- **Email Verification**: Dispatches a 6-digit verification code and a one-click activation link upon user registration.
- **Password Reset**: Secure forgot-password flow delivering an expiring 6-digit recovery code and reset link.
- **Provider Switching**: Toggle on-the-fly between **Resend REST API**, **SMTP (Gmail, SendGrid, Amazon SES, etc.)**, or **Local Mock/Console Mode**.

---

## 📁 Google Drive Media Storage (Refresh Token Method)

Member profile pictures and gallery uploads are stored in Google Drive without requiring local server storage:
1. Create a Google Cloud project and enable the **Google Drive API v3**.
2. Create an OAuth 2.0 Web Application client ID and secret.
3. Generate a long-lived **Refresh Token** via OAuth Playground or Google OAuth flow with `https://www.googleapis.com/auth/drive.file` scope.
4. Add the credentials to `.env` or paste them into the **Admin Portal -> Settings** panel.
5. Uploads are streamed via multipart upload to Google Drive and given public read permissions, generating direct CDN viewing links.

---

## 🎓 Registration Tutorials & Platform Guides

Admins can post, edit, reorder, and toggle onboarding tutorials from the Admin Portal:
- Tutorials appear in an interactive modal directly inside the 3-step registration wizard.
- Supports multilingual titles and descriptions (English, Kinyarwanda, French), step badges, and video links so new users learn how to use Kunda Space while registering.

---

## 💳 Flutterwave Setup Guide

1. Log into your [Flutterwave Dashboard](https://dashboard.flutterwave.com).
2. Go to **Settings -> API Keys & Webhooks**.
3. Copy **Public Key** (`FLW_PUBLIC_KEY`) and **Secret Key** (`FLW_SECRET_KEY`).
4. Set **Secret Hash** to match `FLW_SECRET_HASH` in your `.env`.
5. Set Webhook URL to: `https://your-domain.com/api/payments/webhook`.
6. Enable payments for:
   - **Rwanda**: MTN Mobile Money Rwanda, Airtel Money Rwanda, Cards.
   - **International**: Visa, Mastercard, American Express.

---

## 🛡️ Security & Privacy Checklist

- [x] Date of birth strictly validated on server; under-18 registrations rejected.
- [x] Passwords hashed with bcrypt (10 rounds).
- [x] JWT sessions authenticated on all private endpoints.
- [x] Phone numbers masked from public discovery payloads.
- [x] Contact unlock requires mutual recipient consent before disclosure.
- [x] Webhook signatures verified using HMAC hash header.
- [x] Transaction ledger uses minor units with idempotency protection.
- [x] Private dashboards, chat, and wallet disallowed in `robots.txt`.

---

## 🚀 cPanel & MySQL Deployment Guide

Kunda Space is configured for seamless deployment on cPanel hosting (CloudLinux Node.js Selector, Passenger, or VPS).

### 1. Create MySQL Database in cPanel
1. Log into your **cPanel Dashboard**.
2. Go to **MySQL Databases**:
   - Create a database: e.g. `cpaneluser_kunda`.
   - Create a user: e.g. `cpaneluser_dbuser` with a strong password.
   - Assign the user to the database with **ALL PRIVILEGES**.
3. Open **phpMyAdmin** from cPanel:
   - Select your database.
   - Click **Import** -> Choose file [`db/schema.sql`](file:///c:/Users/DEV/Desktop/kunda/db/schema.sql) -> Click **Go**.
   - (Optional) Import [`db/seed.sql`](file:///c:/Users/DEV/Desktop/kunda/db/seed.sql) for default plans and sample data.

### 2. Configure Environment Variables in cPanel
In cPanel **Setup Node.js App** (or your `.env` file):
```env
# MySQL Connection
DATABASE_URL=mysql://cpaneluser_dbuser:your_password@localhost:3306/cpaneluser_kunda
# Or individual variables:
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=cpaneluser_dbuser
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=cpaneluser_kunda

# Google Drive Storage & Daily Backups
GOOGLE_DRIVE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_DRIVE_CLIENT_SECRET=GOCSPX-your-secret
GOOGLE_DRIVE_REFRESH_TOKEN=1//your-refresh-token
GOOGLE_DRIVE_FOLDER_ID=your-folder-id
```

### 3. Automated Daily MySQL Backup to Google Drive (.sql)
The system includes an automated backup engine that exports `.sql` dumps whenever the database has changed and uploads them to Google Drive:
- **Historical Retention**: Old backups are **never deleted**; every backup is preserved permanently on Google Drive and in `/backups`.
- **Change Detection**: Compares table checksums and row counts so duplicate backups are skipped if the database hasn't changed.
- **Run via cPanel Cron Job (Daily at 02:00 AM)**:
  ```bash
  0 2 * * * cd /home/cpaneluser/public_html && /usr/local/bin/node scripts/backup-db.cjs >> backups/cron.log 2>&1
  ```
- **Run Manually**:
  - From CLI: `npm run db:backup` (or `npm run db:backup:force`)
  - From Admin Portal: **Settings -> Daily MySQL Database Backup -> Trigger Backup (.sql) Now**

---

## 📄 License & Compliance

© 2026 Kunda Space. All rights reserved. Exclusively for adults aged 18 and older.
