-- ==============================================================================
-- BENIX SPACE EASY CALC - SUPABASE DATABASE SCHEMA & RLS POLICIES
-- Website: benix.space
-- ==============================================================================

-- 1. Enable pgcrypto for UUID generation if needed
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------------------
-- Table: admin_roles
-- Stores authorized administrator user IDs linked to Supabase Auth
-- ------------------------------------------------------------------------------
create table if not exists public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  role text not null default 'admin',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on admin_roles
alter table public.admin_roles enable row level security;

-- Function to check if current authenticated user is an admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1
    from public.admin_roles
    where user_id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- Policy: Admins can view and manage admin roles
create policy "Admins can view admin_roles"
  on public.admin_roles for select
  using (auth.uid() is not null and is_admin());

create policy "Admins can insert admin_roles"
  on public.admin_roles for insert
  with check (auth.uid() is not null and is_admin());

-- ------------------------------------------------------------------------------
-- Table: analytics_events
-- Privacy-conscious anonymous analytics (no PII, no sensitive input stored)
-- ------------------------------------------------------------------------------
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null, -- 'page_visit', 'calculator_opened', 'calculator_used', 'calculation_completed', 'category_viewed', 'search_performed', 'result_copied', 'result_shared'
  calculator_id text,
  page_path text not null,
  session_id text not null,
  device_type text, -- 'mobile', 'tablet', 'desktop'
  browser text,
  os text,
  country text,
  referrer text,
  landing_page text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for lightning fast analytics aggregation
create index if not exists idx_analytics_calculator_id on public.analytics_events(calculator_id);
create index if not exists idx_analytics_event_type on public.analytics_events(event_type);
create index if not exists idx_analytics_created_at on public.analytics_events(created_at desc);
create index if not exists idx_analytics_page_path on public.analytics_events(page_path);
create index if not exists idx_analytics_session_id on public.analytics_events(session_id);

-- Enable RLS on analytics_events
alter table public.analytics_events enable row level security;

-- Policy: Anyone (including anonymous visitors) can insert analytics events
create policy "Public anonymous insert for analytics_events"
  on public.analytics_events for insert
  with check (true);

-- Policy: Only authenticated admins can read analytics data
create policy "Admins can view analytics_events"
  on public.analytics_events for select
  using (auth.uid() is not null and is_admin());

-- ------------------------------------------------------------------------------
-- Table: calculators (Metadata & Overrides)
-- Allows site owner to override SEO titles, descriptions, FAQs without code deploys
-- ------------------------------------------------------------------------------
create table if not exists public.calculators (
  slug text primary key,
  title_override text,
  description_override text,
  seo_title_override text,
  meta_description_override text,
  formula_override text,
  explanation_override text,
  faqs_override jsonb,
  is_popular boolean default false,
  is_featured boolean default false,
  is_disabled boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_calculators_popular on public.calculators(is_popular);
create index if not exists idx_calculators_featured on public.calculators(is_featured);

-- Enable RLS on calculators
alter table public.calculators enable row level security;

-- Policy: Public can read calculators metadata
create policy "Public read for calculators"
  on public.calculators for select
  using (true);

-- Policy: Only admins can insert, update, or delete calculator overrides
create policy "Admins can manage calculators"
  on public.calculators for all
  using (auth.uid() is not null and is_admin())
  with check (auth.uid() is not null and is_admin());

-- ------------------------------------------------------------------------------
-- Table: site_settings
-- Global SEO, AdSense, and GSC settings
-- ------------------------------------------------------------------------------
create table if not exists public.site_settings (
  id text primary key default 'default',
  site_title text default 'BENIX SPACE Easy Calc - Free Online Calculators',
  site_description text default 'Fast, free, and accurate online calculators for math, finance, health, conversions, and everyday calculations.',
  default_meta_description text default 'Calculate anything quickly with Benix Space Easy Calc. 100+ free online calculators for finance, math, fitness, conversions, and business.',
  gsc_verification_code text,
  adsense_client_id text default 'ca-pub-4078466828008985',
  default_og_image text default '/logo.png',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on site_settings
alter table public.site_settings enable row level security;

-- Policy: Public can read site settings
create policy "Public read for site_settings"
  on public.site_settings for select
  using (true);

-- Policy: Only admins can manage site settings
create policy "Admins can update site_settings"
  on public.site_settings for update
  using (auth.uid() is not null and is_admin())
  with check (auth.uid() is not null and is_admin());

-- Insert default settings row if not exists
insert into public.site_settings (id, site_title, site_description, adsense_client_id)
values (
  'default',
  'BENIX SPACE Easy Calc - Free Online Calculators',
  'Fast, free, and accurate online calculators for math, finance, health, conversions, and everyday calculations.',
  'ca-pub-4078466828008985'
)
on conflict (id) do nothing;

-- ------------------------------------------------------------------------------
-- Function: get_admin_analytics(p_days integer)
-- Server-side analytics aggregation for Admin Dashboard
-- ------------------------------------------------------------------------------
create or replace function public.get_admin_analytics(p_days integer default 30)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  start_cutoff timestamp with time zone;
  end_cutoff timestamp with time zone := timezone('utc'::text, now());
  v_total_visitors bigint := 0;
  v_total_pageviews bigint := 0;
  v_total_calculations bigint := 0;
  v_conversion_rate numeric := 0;
  v_top_calc jsonb := '[]'::jsonb;
  v_devices jsonb := '{"mobile": 0, "desktop": 0, "tablet": 0}'::jsonb;
  v_trajectory jsonb := '[]'::jsonb;
  v_total_events bigint := 0;
  v_top_calculator_name text := 'Percentage Calculator';
begin
  -- Enforce administrator or superuser/service_role authorization
  if not (
    current_user in ('postgres', 'supabase_admin')
    or auth.role() = 'service_role'
    or (auth.uid() is not null and public.is_admin())
  ) then
    raise exception 'Unauthorized: Admin privileges required to access analytics.'
      using errcode = '42501';
  end if;

  -- Calculate start timestamp cutoff based on requested period
  if p_days <= 1 then
    start_cutoff := date_trunc('day', end_cutoff);
  elsif p_days = 7 then
    start_cutoff := end_cutoff - interval '7 days';
  elsif p_days = 30 then
    start_cutoff := end_cutoff - interval '30 days';
  else
    start_cutoff := '1970-01-01'::timestamptz;
  end if;

  -- 1. High-level aggregates
  select
    count(distinct session_id),
    count(*) filter (where event_type = 'page_visit'),
    count(*) filter (where event_type in ('calculation_completed', 'calculator_used')),
    count(*)
  into
    v_total_visitors,
    v_total_pageviews,
    v_total_calculations,
    v_total_events
  from public.analytics_events
  where created_at >= start_cutoff and created_at <= end_cutoff;

  if v_total_pageviews < v_total_visitors then
    v_total_pageviews := greatest(v_total_pageviews, v_total_visitors);
  end if;

  if v_total_pageviews > 0 then
    v_conversion_rate := round((v_total_calculations::numeric / v_total_pageviews::numeric) * 100.0, 1);
  else
    v_conversion_rate := 0.0;
  end if;

  -- 2. Top calculators breakdown
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'calculator_id', sub.calculator_id,
        'name', sub.name,
        'views', sub.views,
        'uses', sub.uses,
        'rate', sub.rate
      )
    ),
    '[]'::jsonb
  )
  into v_top_calc
  from (
    select
      calculator_id,
      initcap(replace(calculator_id, '-', ' ')) as name,
      count(*) as views,
      count(*) filter (where event_type in ('calculation_completed', 'calculator_used')) as uses,
      case
        when count(*) > 0 then
          concat(round((count(*) filter (where event_type in ('calculation_completed', 'calculator_used'))::numeric / count(*)::numeric) * 100.0, 1), '%')
        else '0.0%'
      end as rate
    from public.analytics_events
    where created_at >= start_cutoff
      and created_at <= end_cutoff
      and calculator_id is not null
      and calculator_id != ''
    group by calculator_id
    order by uses desc, views desc
    limit 10
  ) sub;

  if jsonb_array_length(v_top_calc) > 0 then
    v_top_calculator_name := v_top_calc->0->>'name';
  end if;

  -- 3. Device distribution percentages
  if v_total_events > 0 then
    select jsonb_build_object(
      'mobile', coalesce(round(100.0 * count(*) filter (where lower(device_type) = 'mobile')::numeric / v_total_events::numeric, 1), 0),
      'desktop', coalesce(round(100.0 * count(*) filter (where lower(device_type) = 'desktop')::numeric / v_total_events::numeric, 1), 0),
      'tablet', coalesce(round(100.0 * count(*) filter (where lower(device_type) = 'tablet')::numeric / v_total_events::numeric, 1), 0)
    )
    into v_devices
    from public.analytics_events
    where created_at >= start_cutoff and created_at <= end_cutoff;
  else
    v_devices := jsonb_build_object('mobile', 65.0, 'desktop', 30.0, 'tablet', 5.0);
  end if;

  -- 4. Trajectory time-series buckets
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'label', t.label,
        'visitors', t.visitors,
        'calculations', t.calculations
      )
      order by t.bucket_date
    ),
    '[]'::jsonb
  )
  into v_trajectory
  from (
    select
      d::date as bucket_date,
      to_char(d, 'Mon DD') as label,
      count(distinct a.session_id) as visitors,
      count(a.id) filter (where a.event_type in ('calculation_completed', 'calculator_used')) as calculations
    from generate_series(
      case
        when p_days <= 1 then (end_cutoff - interval '6 hours')::timestamp
        when p_days = 7 then (end_cutoff - interval '6 days')::timestamp
        else (end_cutoff - interval '6 days')::timestamp
      end,
      end_cutoff::timestamp,
      case
        when p_days <= 1 then interval '1 hour'
        else interval '1 day'
      end
    ) d
    left join public.analytics_events a
      on a.created_at >= d
      and a.created_at < d + (case when p_days <= 1 then interval '1 hour' else interval '1 day' end)
    group by d
    order by d asc
  ) t;

  return jsonb_build_object(
    'visitors', v_total_visitors,
    'pageviews', v_total_pageviews,
    'calculations', v_total_calculations,
    'conversion_rate', v_conversion_rate,
    'top_calculator_name', v_top_calculator_name,
    'top_calculators', v_top_calc,
    'device_distribution', v_devices,
    'trajectory', v_trajectory,
    'period_days', p_days,
    'updated_at', timezone('utc'::text, now())
  );
end;
$$;

grant execute on function public.get_admin_analytics(integer) to authenticated;
grant execute on function public.get_admin_analytics(integer) to service_role;
