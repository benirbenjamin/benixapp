/**
 * BENIX SPACE EASY CALC - Telemetry Baseline Seed Script
 * Generates realistic organic calculator traffic telemetry into Supabase analytics_events.
 */
const { Client } = require('pg');

async function seedAnalytics() {
  if (!process.argv.includes('--force-seed')) {
    console.warn('⚠️  Synthetic analytics seeding is DISABLED to protect live production telemetry.');
    console.warn('To override intentionally in dev/staging only, run with: node scripts/seed-analytics.js --force-seed');
    process.exit(0);
  }

  console.log('Connecting to Supabase PostgreSQL pooler...');
  const client = new Client({
    host: 'aws-0-eu-central-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.nfiocyypxoyfuzpfntja',
    password: '1202!birthDATE',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  await client.connect();
  console.log('Connected! Seeding launch analytics events...');

  const calculators = [
    { id: 'percentage-calculator', weight: 28 },
    { id: 'loan-calculator', weight: 19 },
    { id: 'bmi-calculator', weight: 16 },
    { id: 'age-calculator', weight: 14 },
    { id: 'compound-interest-calculator', weight: 12 },
    { id: 'unit-converter', weight: 11 },
    { id: 'mortgage-calculator', weight: 9 },
    { id: 'rwf-currency-converter', weight: 8 },
    { id: 'calorie-calculator', weight: 8 },
    { id: 'gpa-calculator', weight: 7 },
    { id: 'rwanda-paye-calculator', weight: 6 },
    { id: 'salary-calculator', weight: 6 },
    { id: 'date-difference-calculator', weight: 5 },
    { id: 'fraction-calculator', weight: 5 },
  ];

  const devices = [
    { type: 'mobile', browser: 'Chrome', os: 'Android', weight: 45 },
    { type: 'mobile', browser: 'Safari', os: 'iOS', weight: 23 },
    { type: 'desktop', browser: 'Chrome', os: 'Windows', weight: 18 },
    { type: 'desktop', browser: 'Safari', os: 'macOS', weight: 7 },
    { type: 'desktop', browser: 'Edge', os: 'Windows', weight: 4 },
    { type: 'tablet', browser: 'Safari', os: 'iOS', weight: 3 },
  ];

  const countries = ['United States', 'Rwanda', 'Kenya', 'United Kingdom', 'India', 'Canada', 'South Africa', 'Germany'];
  const referrers = [
    'https://www.google.com/',
    'https://www.google.com/',
    'https://www.google.com/',
    'https://www.bing.com/',
    'https://t.co/',
    '',
  ];

  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const events = [];

  // Generate sessions across the past 30 days
  for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
    // Traffic ramp-up curve
    const dayFactor = 0.5 + (30 - dayOffset) * 0.05; // 0.5 up to 2.0
    const sessionsToday = Math.floor((30 + Math.random() * 25) * dayFactor);

    for (let s = 0; s < sessionsToday; s++) {
      const sessionId = 's_' + Math.random().toString(36).substring(2, 10) + '_' + (30 - dayOffset);
      const devPick = pickWeighted(devices);
      const country = countries[Math.floor(Math.random() * countries.length)];
      const referrer = referrers[Math.floor(Math.random() * referrers.length)];

      const sessionTime = new Date(now - (dayOffset * DAY_MS) + (Math.random() * DAY_MS));

      // 1. Landing Page Visit
      const calcPick = pickWeighted(calculators);
      const pagePath = Math.random() > 0.3 ? `/calculators/${calcPick.id}` : '/';

      events.push({
        event_type: 'page_visit',
        calculator_id: pagePath.startsWith('/calculators/') ? calcPick.id : null,
        page_path: pagePath,
        session_id: sessionId,
        device_type: devPick.type,
        browser: devPick.browser,
        os: devPick.os,
        country: country,
        referrer: referrer,
        landing_page: `https://benix.space${pagePath}`,
        metadata: JSON.stringify({ referrerSource: referrer ? 'search' : 'direct' }),
        created_at: sessionTime.toISOString()
      });

      // 2. Calculator Opened & Used (if on calculator page)
      if (pagePath.startsWith('/calculators/')) {
        events.push({
          event_type: 'calculator_opened',
          calculator_id: calcPick.id,
          page_path: pagePath,
          session_id: sessionId,
          device_type: devPick.type,
          browser: devPick.browser,
          os: devPick.os,
          country: country,
          referrer: referrer,
          landing_page: `https://benix.space${pagePath}`,
          metadata: JSON.stringify({}),
          created_at: new Date(sessionTime.getTime() + 2000).toISOString()
        });

        // 80% complete a calculation
        if (Math.random() < 0.85) {
          events.push({
            event_type: 'calculation_completed',
            calculator_id: calcPick.id,
            page_path: pagePath,
            session_id: sessionId,
            device_type: devPick.type,
            browser: devPick.browser,
            os: devPick.os,
            country: country,
            referrer: referrer,
            landing_page: `https://benix.space${pagePath}`,
            metadata: JSON.stringify({ calculationTimeMs: Math.floor(Math.random() * 50) }),
            created_at: new Date(sessionTime.getTime() + 8000).toISOString()
          });
        }
      }
    }
  }

  console.log(`Inserting ${events.length} realistic telemetry events into Supabase analytics_events...`);

  // Batch insert in chunks of 200
  const CHUNK_SIZE = 200;
  for (let i = 0; i < events.length; i += CHUNK_SIZE) {
    const chunk = events.slice(i, i + CHUNK_SIZE);
    const placeholders = [];
    const values = [];

    chunk.forEach((ev, idx) => {
      const base = idx * 11;
      placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}::jsonb, $${base + 11}::timestamptz)`);
      values.push(
        ev.event_type,
        ev.calculator_id,
        ev.page_path,
        ev.session_id,
        ev.device_type,
        ev.browser,
        ev.os,
        ev.country,
        ev.referrer,
        ev.metadata,
        ev.created_at
      );
    });

    const insertSql = `
      INSERT INTO public.analytics_events (
        event_type,
        calculator_id,
        page_path,
        session_id,
        device_type,
        browser,
        os,
        country,
        referrer,
        metadata,
        created_at
      ) VALUES ${placeholders.join(',\n')};
    `;

    await client.query(insertSql, values);
    process.stdout.write(`\rInserted ${Math.min(i + CHUNK_SIZE, events.length)} / ${events.length} events...`);
  }

  console.log('\n✓ Seeding complete!');

  // Test RPC summary
  const summaryRes = await client.query(`SELECT public.get_admin_analytics(30) as stats;`);
  console.log('✓ Updated 30-Day Aggregated Analytics in Supabase:');
  console.log(JSON.stringify(summaryRes.rows[0]?.stats, null, 2));

  await client.end();
}

function pickWeighted(items) {
  const total = items.reduce((acc, it) => acc + it.weight, 0);
  let rand = Math.random() * total;
  for (const it of items) {
    if (rand < it.weight) return it;
    rand -= it.weight;
  }
  return items[0];
}

seedAnalytics().catch(console.error);
