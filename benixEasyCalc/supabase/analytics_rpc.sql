-- ==============================================================================
-- BENIX SPACE EASY CALC - Real-time Admin Analytics RPC Function
-- Calculates platform analytics metrics, top calculators, device distribution,
-- and traffic trajectory directly inside PostgreSQL for extreme speed.
-- ==============================================================================

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
  v_top_calculator_name text := 'None';
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
    count(*) filter (where event_type = 'calculation_completed'),
    count(*)
  into
    v_total_visitors,
    v_total_pageviews,
    v_total_calculations,
    v_total_events
  from public.analytics_events
  where created_at >= start_cutoff and created_at <= end_cutoff;

  -- Ensure pageviews is at least equal to visitors
  if v_total_pageviews < v_total_visitors then
    v_total_pageviews := greatest(v_total_pageviews, v_total_visitors);
  end if;

  if v_total_pageviews > 0 then
    v_conversion_rate := least(round((v_total_calculations::numeric / v_total_pageviews::numeric) * 100.0, 1), 100.0);
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
      count(*) filter (where event_type in ('page_visit', 'calculator_opened')) as views,
      count(*) filter (where event_type = 'calculation_completed') as uses,
      case
        when count(*) filter (where event_type in ('page_visit', 'calculator_opened')) > 0 then
          concat(least(round((count(*) filter (where event_type = 'calculation_completed')::numeric / count(*) filter (where event_type in ('page_visit', 'calculator_opened'))::numeric) * 100.0, 1), 100.0), '%')
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

  -- Fetch top calculator name
  if jsonb_array_length(v_top_calc) > 0 and (v_top_calc->0->>'uses')::bigint > 0 then
    v_top_calculator_name := v_top_calc->0->>'name';
  elsif jsonb_array_length(v_top_calc) > 0 then
    v_top_calculator_name := v_top_calc->0->>'name';
  else
    v_top_calculator_name := 'None';
  end if;

  -- 3. Device distribution percentages (0% fallback if no events)
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
    v_devices := jsonb_build_object('mobile', 0, 'desktop', 0, 'tablet', 0);
  end if;

  -- 4. Trajectory time-series buckets (aligned to midnight or hour)
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
      d as bucket_date,
      case
        when p_days <= 1 then to_char(d, 'HH24:00')
        else to_char(d, 'Mon DD')
      end as label,
      count(distinct a.session_id) as visitors,
      count(a.id) filter (where a.event_type = 'calculation_completed') as calculations
    from generate_series(
      case
        when p_days <= 1 then date_trunc('hour', end_cutoff) - interval '6 hours'
        else date_trunc('day', end_cutoff) - interval '6 days'
      end,
      case
        when p_days <= 1 then date_trunc('hour', end_cutoff)
        else date_trunc('day', end_cutoff)
      end,
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

-- Grant execute permissions to authenticated users (function internally checks is_admin)
grant execute on function public.get_admin_analytics(integer) to authenticated;
grant execute on function public.get_admin_analytics(integer) to service_role;
