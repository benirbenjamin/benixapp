# BENIX SPACE EASY CALC (benix.space)

> **Modern, extremely fast, SEO-friendly all-in-one online calculator platform.**

Built for production readiness, high-yield Google AdSense monetization, anonymous public access, and Supabase-powered backend telemetry & administration.

---

## 🌟 Key Features

- **100+ Calculators Across 12 Categories**:
  - **Math**: Percentage, Percentage Increase/Decrease/Difference, Fractions, Decimal/Fraction converters, Ratios, Average, Mean/Median/Mode, Standard Deviation, Square/Cube Roots, Exponents, Logarithms, GCF/LCM, Prime Factorization, Modulo, and Scientific.
  - **Finance**: Loan Payment, Mortgage (P&I, Taxes, Insurance), Compound Interest, Simple Interest, ROI, Profit Margin, Markup, Discounts, VAT, Tip/Split Bill, Break-Even Analysis, and Currency Converter.
  - **Health & Fitness**: BMI (WHO categories), BMR (Mifflin-St Jeor), TDEE / Daily Calories, Ideal Body Weight (Devine, Robinson, Miller), and Daily Water Intake with medical disclaimers.
  - **Unit Converters**: Universal Unit Converter, Length, Mass/Weight, Temperature (°C, °F, K), Area, Volume, Speed, and Digital Storage.
  - **Time & Date**: Exact Age (years, months, days, total hours), Date Difference, Business Days, Time Duration (HH:MM), and Unix Timestamp.
  - **Geometry**: 2D Shape Area, Circle (Circumference/Diameter), Pythagorean Theorem, and 3D Volume/Surface Area.
  - **Business**: Gross & Net Profit, Salary to Hourly Wage, Sales Commission, and Break-Even Volume.
  - **Education**: 4.0 College GPA / CGPA, Final Exam Grade Needed, and Weighted Class Grades.
  - **Everyday**: Fuel Trip Cost, Paint Quantity, and 90-Minute REM Sleep Cycle.
  - **Technology**: Binary / Decimal / Hexadecimal / Octal Converter, Download Time / Bandwidth, and IPv4 Subnet / CIDR.
  - **Agriculture**: Land Area (Hectares / Acres), and NPK Fertilizer Application Rates.
  - **Africa & Local Tools**: Rwandan Franc (RWF) Currency Converter, Rwanda 18% VAT (RRA), and Rwanda Progressive PAYE Salary Tax.
- **Client-Side Sub-Millisecond Execution**: Calculations run directly in the browser with zero network latency, offline readiness, and 100% privacy (zero user numbers transmitted).
- **AdSense Ready**:
  - Client ID: `ca-pub-4078466828008985`
  - Automated `ads.txt` served at `/ads.txt` with publisher verification.
  - Balanced, high-yield ad placements (header, post-calculation high-CTR slot, mid-content, and desktop sticky rail).
- **SEO Architecture**:
  - Unique titles, meta descriptions, and canonical URLs for every tool.
  - Dynamic XML sitemaps: `/sitemap.xml`, `/calculators-sitemap.xml`, `/categories-sitemap.xml`.
  - Schema.org JSON-LD Structured Data: `WebApplication`, `BreadcrumbList`, and `FAQPage`.
  - `robots.txt` configuration.
- **Supabase Backend**:
  - Anonymous event tracking (page visits, calculations completed, results copied/shared, search queries).
  - Admin authentication via Supabase Auth.
  - Calculator metadata override editor & Google Search Console verification manager.
  - Complete SQL migration schema with Row-Level Security (RLS) policies in `supabase/schema.sql`.
- **Modern Responsive Design**:
  - Mobile-first thumb-friendly controls, accessible buttons, and dark mode support.
  - Incorporates the official brand logo (`/logo.png`) and favicon (`/favicon.ico`).

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ or 20+
- npm, pnpm, or yarn

### 2. Installation
```bash
git clone https://github.com/benirbenjamin/benixEasyCalc.git
cd benixEasyCalc
npm install
```

### 3. Environment Setup (Optional)
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase project URL and anon key if you wish to link live database analytics:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-4078466828008985
```
*(Note: If Supabase is unconfigured, the application runs with full client-side calculation functionality and demo telemetry fallback).*

### 4. Running Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build
```bash
npm run build
npm run start
```

---

## 🗄️ Supabase Database Setup

To enable live analytics and admin settings in Supabase:
1. Open your project on [supabase.com](https://supabase.com).
2. Navigate to the **SQL Editor**.
3. Copy and run the entire SQL script from [`supabase/schema.sql`](./supabase/schema.sql).
4. Create an admin user under **Authentication -> Users**, then insert their `user_id` into `public.admin_roles`.

---

## 📊 Admin Dashboard

Access the secure admin panel at `/admin`:
- **URL**: `/admin` (Redirects to `/admin/login` if not authenticated)
- **Features**:
  - Telemetry KPI cards (Visitors, Page views, Calculations completed, Usage rate)
  - Interactive SVG charts (Daily volume, Device distribution, Top referrers)
  - Calculator Metadata Editor (Edit SEO titles, descriptions, formulas, and FAQs)
  - Global SEO & AdSense settings manager

---

## 📄 License & Attribution

© Benix Space (benix.space). All rights reserved.
