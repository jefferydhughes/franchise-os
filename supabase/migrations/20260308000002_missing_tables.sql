-- FranchiseOS — Additional Tables Migration
-- Migration: 20260308000002_missing_tables
-- Adds: expansion_signals, initiative_runs, brand_settings, playbooks

-- ============================================================
-- EXPANSION SIGNALS — detected expansion opportunities
-- ============================================================
create table if not exists public.expansion_signals (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id) on delete cascade,
  signal_type text not null
    check (signal_type in ('lead_cluster', 'territory_score', 'competitor_closed', 'search_spike')),
  location_lat numeric,
  location_lng numeric,
  location_name text,
  score numeric,
  summary text,
  recommended_action text,
  status text not null default 'new'
    check (status in ('new', 'reviewed', 'actioned', 'dismissed')),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index idx_expansion_signals_brand on public.expansion_signals(brand_id);
create index idx_expansion_signals_status on public.expansion_signals(brand_id, status);
create index idx_expansion_signals_type on public.expansion_signals(brand_id, signal_type);
create index idx_expansion_signals_created on public.expansion_signals(brand_id, created_at desc);

-- ============================================================
-- INITIATIVE RUNS — individual agent steps within an initiative
-- ============================================================
create table if not exists public.initiative_runs (
  id uuid primary key default gen_random_uuid(),
  initiative_id uuid references public.initiatives(id) on delete cascade,
  agent_name text not null,
  action text,
  result jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'completed', 'failed', 'skipped')),
  started_at timestamptz,
  completed_at timestamptz
);
create index idx_initiative_runs_initiative on public.initiative_runs(initiative_id);
create index idx_initiative_runs_agent on public.initiative_runs(agent_name);
create index idx_initiative_runs_status on public.initiative_runs(initiative_id, status);

-- ============================================================
-- BRAND SETTINGS — per-brand configuration overrides
-- ============================================================
create table if not exists public.brand_settings (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id) on delete cascade unique,
  slack_webhook_url text,
  twilio_phone text,
  whatsapp_number text,
  notification_prefs jsonb not null default '{}'::jsonb,
  ai_model_overrides jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create index idx_brand_settings_brand on public.brand_settings(brand_id);

-- Auto-update trigger for brand_settings
create trigger brand_settings_updated_at
  before update on public.brand_settings
  for each row execute function update_updated_at();

-- ============================================================
-- PLAYBOOKS — self-improving strategy playbooks
-- ============================================================
create table if not exists public.playbooks (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id) on delete cascade,
  name text not null,
  type text,
  version integer not null default 1,
  content jsonb not null default '{}'::jsonb,
  performance_score numeric,
  last_rewritten_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_playbooks_brand on public.playbooks(brand_id);
create index idx_playbooks_type on public.playbooks(brand_id, type);
create index idx_playbooks_score on public.playbooks(brand_id, performance_score);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.expansion_signals enable row level security;
alter table public.initiative_runs enable row level security;
alter table public.brand_settings enable row level security;
alter table public.playbooks enable row level security;

-- Expansion Signals RLS
create policy "brand_isolation" on public.expansion_signals
  for all using (
    brand_id in (select id from public.brands where clerk_org_id = current_setting('app.current_org_id', true))
  );
create policy "expansion_signals_service_role" on public.expansion_signals
  for all using (auth.role() = 'service_role');

-- Initiative Runs RLS (through initiative → brand chain)
create policy "brand_isolation" on public.initiative_runs
  for all using (
    initiative_id in (
      select i.id from public.initiatives i
      join public.brands b on i.brand_id = b.id
      where b.clerk_org_id = current_setting('app.current_org_id', true)
    )
  );
create policy "initiative_runs_service_role" on public.initiative_runs
  for all using (auth.role() = 'service_role');

-- Brand Settings RLS
create policy "brand_isolation" on public.brand_settings
  for all using (
    brand_id in (select id from public.brands where clerk_org_id = current_setting('app.current_org_id', true))
  );
create policy "brand_settings_service_role" on public.brand_settings
  for all using (auth.role() = 'service_role');

-- Playbooks RLS
create policy "brand_isolation" on public.playbooks
  for all using (
    brand_id in (select id from public.brands where clerk_org_id = current_setting('app.current_org_id', true))
  );
create policy "playbooks_service_role" on public.playbooks
  for all using (auth.role() = 'service_role');
