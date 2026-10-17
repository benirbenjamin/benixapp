# 🎙️ Reusable Radio Station Website Template & Management Platform

A modern, production-ready, reusable Radio Station Website Template & Multi-Station Broadcast Platform inspired by professional broadcast radio websites (such as KISS FM Rwanda, Capital FM, BBC Radio).

Built with **React 18**, **Tailwind CSS**, **Node.js / Express REST API**, and **PostgreSQL** (designed for **Vercel Postgres, Neon, Supabase**, or zero-config local storage).

---

## 🌟 Key Features

### 1. Multi-Station Architecture (One Template → Many Stations)
- Completely dynamic: **NO station data is hard-coded** into the frontend.
- Dynamic route resolution: `/station/:slug` (e.g. `/station/kigali-wave`, `/station/summit-news`, `/station/pulse-beat`).
- Root portal `/` displays an interactive directory of all active broadcasting stations.
- Deployable for single independent radio stations or as a multi-tenant radio network.

### 2. Five Distinct Pre-Built Themes
Each theme has its own architectural layout, typography hierarchy, card geometry, hero presentation, and broadcast feel:
1. **Theme 1 — Modern Radio**: Large bold hero with audio wave visualizer, rounded-3xl cards, glassmorphic badges, and floating live player.
2. **Theme 2 — Classic FM**: Traditional broadcast banner, structured timetable schedule column, compact cards, serif headlines.
3. **Theme 3 — Entertainment**: High-energy music & festival vibe, dark/neon backdrop, bold badges, trending DJ mixes.
4. **Theme 4 — News Radio**: Clean editorial newsroom appearance, breaking news bulletin ticker, headline story grid, multi-column article previews.
5. **Theme 5 — Minimal**: Apple-inspired design with generous whitespace, delicate hairline borders, light typography, and distraction-free audio player.

### 3. Custom Color & Typography Engine
- 9 customizable color design tokens:
  - `--primary-color`
  - `--secondary-color`
  - `--accent-color`
  - `--background-color`
  - `--surface-color`
  - `--text-color`
  - `--muted-color`
  - `--header-color`
  - `--footer-color`
- Visual color picker and real-time validated HEX inputs.
- Curated web fonts (*Plus Jakarta Sans, Inter, Poppins, Montserrat, Outfit, Playfair Display, Roboto*) + Custom Web Font URL loader.
- Split-screen live preview viewport in the dashboard reflecting real-time changes before saving.

### 4. Robust Live Audio Streaming Player
- Prominent **▶ PLAY LIVE** CTA with audio visualizer wave animation.
- Multi-stream switcher (Main FM, Afrobeats Chill, News Desk, etc.).
- Audio status states: `CONNECTING`, `LIVE`, `ERROR`, `UNAVAILABLE` with retry button.
- Persistent dockable bottom player bar when scrolling down.
- Automatic browser autoplay policy handling.

### 5. Programs & Schedule Engine
- Shows with presenter name, cover image, start/end time, and days of week.
- Dynamic **NOW ON AIR** and **COMING NEXT** computation based on station timezone and current time.
- Visitor schedule page with Monday–Sunday day tabs.

### 6. News CMS with Postimages.org Integration
- Rich Text Editor with headings, bold, italic, underline, lists, blockquotes, and embeds.
- Built-in **Postimages.org External Image Hosting Workflow**:
  1. Open Postimages.org
  2. Upload image
  3. Copy Direct Link
  4. Paste into Image URL field with live image preview & validation
  5. Publish article

### 7. Responsive YouTube Video Gallery
- Add videos via YouTube URL with automated 11-character video ID extraction and high-res thumbnail preview.
- Responsive modal video player.

### 8. Homepage Section Visibility Toggles
- Granular toggles for 8 homepage blocks:
  - Radio Player
  - Now On Air & Next
  - Programs Lineup
  - Latest News
  - YouTube Videos
  - About Station
  - Social Media Links
  - Studio Contact Form

### 9. Super Admin & Station Admin Security
- Strict role-based access control (RBAC) and station-level authorization (`verifyStationAccess`).
- Password hashing with bcrypt, JWT authentication.
- Station admins can only access and modify their assigned station's data.

---

## 🚀 Pre-Seeded Demo Accounts & Stations

The database auto-initializes all tables and seeds these demo stations on boot:

| Role | Username | Password | Assigned Station | Theme |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin` | `Admin123!Password` | Platform-wide (All stations) | All |
| **Station Admin** | `wave_admin` | `Admin123!Password` | Kigali Wave 94.7 FM (`kigali-wave`) | Theme 1 (Modern) |
| **Station Admin** | `summit_admin` | `Admin123!Password` | Summit Classic News 102.5 FM (`summit-news`) | Theme 4 (News) |
| **Station Admin** | `pulse_admin` | `Admin123!Password` | Pulse Beat Radio (`pulse-beat`) | Theme 3 (Entertainment) |

---

## 💻 Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Both Server & Client
```bash
npm run dev
```
This runs the Express API server (port 5000) and Vite frontend (port 3000) concurrently.

Open `http://localhost:3000` to browse stations or `/admin/login` for the admin portal.

---

## ☁️ Deployment to Vercel

This repository is organized as a single unified directory, 100% pre-configured for standard Vercel deployment without monorepo or dual-directory configuration.

### Steps:
1. Push this repository to GitHub or GitLab.
2. In the [Vercel Dashboard](https://vercel.com/new), import the repository.
   - **Framework Preset**: Vite (auto-detected)
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run build` (leave default)
   - **Output Directory**: `dist` (leave default)
3. In **Settings → Environment Variables**, add:
   - `DATABASE_URL`: Your PostgreSQL connection string (from Vercel Postgres, Neon, or Supabase).
     ```
     postgres://user:password@ep-cool-db.us-east-1.aws.neon.tech/neondb?sslmode=require
     ```
   - `JWT_SECRET`: A secure random secret string (e.g. `your_production_jwt_secret_key_2026`).
4. Click **Deploy**.
   Vercel will build the React SPA (`dist/`) and deploy the REST API as serverless functions (`/api/*`).
5. On the first cold start, tables and initial demo stations are automatically created in your PostgreSQL database!

---

## 📄 License
MIT License. Built for independent radio broadcasters and production media agencies.
