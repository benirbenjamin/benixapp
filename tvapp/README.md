# RBA Streaming Platform (Rwanda Broadcasting Agency / RTV)

A modern, production-ready streaming web application for **Rwanda Broadcasting Agency (RBA)**, featuring:
- **RTV Live** & **KC2** High-Definition HLS video streams with custom controls and native player fallbacks.
- **8+ Regional & National Radio Stations** (Radio Rwanda 100.7 FM, Magic FM, Radio Rubavu, Radio Nyagatare, Radio Inteko, Radio Huye, Radio Musanze, Radio Rusizi).
- **Persistent Global Radio Player** that seamlessly continues playing audio during navigation across all pages.
- **Real PostgreSQL Analytics Engine** tracking anonymous visitors, sessions, page views, and media playback events with deduplication and interactive visual charts.
- **Administrative Control Panel** with Role-Based Access Control (`SUPER_ADMIN` and `ADMIN`) for station management, YouTube video embedding, stream diagnostics, user management, and system settings.
- **Zero-Setup Database Architecture**: No local database installation required. Configured for cloud PostgreSQL (Neon, Supabase, Vercel Postgres, Railway) with automated schema migrations and seeding on boot/first request.

**Official Application URL**: `https://tv.benix.space`

---

## 🚀 Key Features

### 1. High Performance Media Streaming
- **TV Broadcasts (HLS)**: Powered by `hls.js` for RTV Live and KC2 with buffer management, live badge pulse, unmuting prompts, and error recovery.
- **Persistent Radio Bar**: Fixed bottom audio player on desktop and mobile. Smooth playback across Home, Radio, TV, Videos, About, Contact, Search, and Admin.
- **Animated Equalizer**: Real-time visualizer waveform active only while streaming.
- **One Stream at a Time**: Seamlessly stops previous stream when changing stations.
- **Direct Client Streaming**: Connects directly from client to stream servers, preventing server bandwidth bottlenecks.

### 2. Comprehensive Content Organization
- **Homepage (`/`)**: Hero RTV Live player, auto-advancing touch-friendly Radio Slider, latest RTV videos, most watched broadcasts, and full station directory.
- **Radio Page (`/radio`)**: Dedicated station cards with live indicators, search, category filters (National, Regional Community, Favorites), and currently playing banner.
- **TV Page (`/tv`)**: Large live player with instant channel switcher (RTV / KC2) and categorized on-demand video archive.
- **Individual Watch Pages (`/tv/:id`)**: High quality embedded video player, views counter, share button, and recommended videos.
- **Global Search (`/search`)**: Real-time search across radio stations, TV channels, video bulletins, and categories.
- **Favorites**: LocalStorage-backed station favoriting for quick access.

### 3. Real PostgreSQL Analytics
- Tracks:
  - Total and unique visitors
  - Visitors Today, Yesterday, This Week, This Month, This Year
  - Radio Plays Today, TV Plays Today, Video Views Today
  - Traffic Sources (Direct, Google Search, Social, Referral)
  - Device Categories (Mobile, Desktop, Tablet)
  - Operating Systems and Web Browsers
- Date filters: Today, Yesterday, Last 7 Days, Last 30 Days, This Month, This Year, Custom Date Range.
- Interactive time-series distribution and 1-click CSV export.
- Privacy-first: Anonymous visitor and session UUIDs; no personal data collected.

### 4. Admin Portal & Stream Diagnostics
- **Live Station Editor**: Modify stream URLs, logos, station types, frequency, and display order directly from the database without redeploying code.
- **Stream Diagnostics Tool**: Real-time reachability test displaying HTTP status, Content-Type, protocol detection (HLS / MP3 / AAC), and response latency.
- **Video Embedding**: Enter any YouTube URL — the system automatically parses the video ID, generates the embed URL, and fetches the high-resolution thumbnail.
- **User Management (Super Admin)**: Create staff accounts, assign roles (`SUPER_ADMIN` / `ADMIN`), toggle active status, and reset passwords.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router DOM, Lucide Icons, HLS.js
- **Backend**: Node.js, Express, TypeScript, RESTful API
- **Database**: PostgreSQL (Cloud PostgreSQL / Vercel Postgres / Neon / Supabase)
- **Authentication**: Salted bcrypt password hashing & JSON Web Tokens (JWT)
- **Deployment Target**: Vercel (Frontend SPA + Vercel Serverless Functions `/api/*`)

---

## 🔐 Default Administrative Credentials

The database auto-seeds these default accounts upon first startup:

| Role | Email | Default Password |
| :--- | :--- | :--- |
| **Super Administrator** | `superadmin@rba.co.rw` | `RbaAdmin2026!#` |
| **Content Administrator** | `admin@rba.co.rw` | `RbaAdmin2026!#` |

> [!TIP]
> Log in at `/admin/login`. Once logged in, you can change passwords and manage other staff members in **User Management**.

---

## 📡 Default Broadcast Streams Seeded

| Station | Type | Protocol | Stream URL |
| :--- | :--- | :--- | :--- |
| **RTV Live** | TV | HLS | `https://5c46fa289c89f.streamlock.net/rtv25/rtv/playlist.m3u8` |
| **KC2** | TV | HLS | `https://5c46fa289c89f.streamlock.net/kc2/kc2/playlist.m3u8` |
| **Radio Rwanda** | Radio | Audio | `https://listen.rba.co.rw:8008/rwanda` |
| **Magic FM** | Radio | Audio | `https://listen.rba.co.rw:8085/mgcfm` |
| **Radio Rubavu** | Radio | Audio | `https://listen.rba.co.rw:8004/rubavu` |
| **Radio Nyagatare** | Radio | Audio | `https://listen.rba.co.rw:3053/nyagatare` |
| **Radio Inteko** | Radio | Audio | `https://listen.rba.co.rw:8007/inteko` |
| **Radio Huye** | Radio | Audio | `https://listen.rba.co.rw:5053/huye` |
| **Radio Musanze** | Radio | Audio | `https://listen.rba.co.rw:8003/musanze` |
| **Radio Rusizi** | Radio | Audio | `https://listen.rba.co.rw:8009/rusizi` |

---

## ☁️ Deployment Guide (Vercel)

This application is ready to deploy directly to Vercel with zero manual migration steps.

### Step 1: Provision a Free Cloud PostgreSQL Database
1. Go to [Neon.tech](https://neon.tech), [Supabase.com](https://supabase.com), or create a Vercel Postgres database.
2. Copy your connection string (e.g. `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require`).

### Step 2: Push to GitHub / GitLab
```bash
git init
git add .
git commit -m "Initial commit: RBA streaming platform"
git remote add origin https://github.com/your-org/rba-streaming.git
git push -u origin main
```

### Step 3: Deploy on Vercel
1. In the [Vercel Dashboard](https://vercel.com), click **Add New Project** and import your repository.
2. Under **Environment Variables**, add:
   - `DATABASE_URL`: `your_cloud_postgres_connection_string`
   - `JWT_SECRET`: `your_random_secret_jwt_key`
   - `VITE_APP_URL`: `https://rba.benix.space`
3. Click **Deploy**.
4. That's it! When Vercel builds and handles the first request, the database initialization script (`api/db/init.ts`) automatically creates all tables, constraints, indexes, superadmin accounts, 10 stations, categories, and site settings.

---

## 💻 Local Development (Optional)

If you wish to run the development server locally:

```bash
# 1. Install dependencies
npm install

# 2. Configure .env
cp .env.example .env

# 3. Start Frontend & Backend
npm run dev      # Runs Vite at http://localhost:3000
npm run server   # Runs Express API at http://localhost:5000
```

---

## 🛡️ Security & Privacy Architecture
- **SQL Injection Protection**: Parameterized queries across all database drivers.
- **Password Security**: Strong bcrypt salt rounds (10 rounds).
- **JWT Protection**: Cryptographically signed access tokens with role validation.
- **CORS Protection**: Restricted origins in production while allowing seamless media streaming.
- **Zero Sensitive Data in Analytics**: Only anonymous UUIDs and technical device metadata.
