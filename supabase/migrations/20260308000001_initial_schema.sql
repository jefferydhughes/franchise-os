-- FranchiseOS Production Schema
-- Supabase: https://eggucsttihoxhxaaeiph.supabase.co
-- Migration: 20260308000001_initial_schema

create extension if not exists "uuid-ossp" with schema extensions;

-- ============================================================
-- BRANDS — Core tenant table
-- ============================================================
create table public.brands (
  id uuid primary key default extensions.uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  clerk_org_id text unique,
  domain text,
  config jsonb not null default '{}'::jsonb,
  status text not null default 'active'
    check (status in ('active','onboarding','paused','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_brands_slug on public.brands(slug);
create index idx_brands_clerk_org on public.brands(clerk_org_id);

-- ============================================================
-- TERRITORIES
-- ============================================================
create table public.territories (
  id uuid primary key default extensions.uuid_generate_v4(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  region text,
  geo_data jsonb not null default '{}'::jsonb,
  demographics jsonb not null default '{}'::jsonb,
  score numeric(5,2),
  grade text check (grade in ('A','B','C','D')),
  status text not null default 'open'
    check (status in ('open','reserved','active','saturated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_territories_brand on public.territories(brand_id);
create index idx_territories_status on public.territories(brand_id, status);

-- ============================================================
-- FRANCHISEES
-- ============================================================
create table public.franchisees (
  id uuid primary key default extensions.uuid_generate_v4(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  clerk_org_id text,
  clerk_user_id text,
  name text not null,
  email text,
  phone text,
  territory_id uuid references public.territories(id) on delete set null,
  unit_number text,
  status text not null default 'prospect'
    check (status in ('prospect','qualified','discovery','proposal','signed','onboarding','active','at_risk','churned')),
  onboarding_data jsonb not null default '{}'::jsonb,
  performance_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_franchisees_brand on public.franchisees(brand_id);
create index idx_franchisees_territory on public.franchisees(territory_id);
create index idx_franchisees_status on public.franchisees(brand_id, status);
create index idx_franchisees_clerk_org on public.franchisees(clerk_org_id);

-- ============================================================
-- LEADS
-- ============================================================
create table public.leads (
  id uuid primary key default extensions.uuid_generate_v4(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  territory_id uuid references public.territories(id) on delete set null,
  name text,
  email text,
  phone text,
  source text not null default 'unknown',
  persona text,
  score integer default 0,
  status text not null default 'new'
    check (status in ('new','scored','contacted','qualified','nurturing','discovery_scheduled','discovery_completed','proposal_sent','converted','lost','suppressed')),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_leads_brand on public.leads(brand_id);
create index idx_leads_status on public.leads(brand_id, status);
create index idx_leads_territory on public.leads(territory_id);
create index idx_leads_source on public.leads(brand_id, source);
create index idx_leads_created on public.leads(brand_id, created_at desc);
create index idx_leads_score on public.leads(brand_id, score desc);

-- ============================================================
-- INITIATIVES
-- ============================================================
create table public.initiatives (
  id uuid primary key default extensions.uuid_generate_v4(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  territory_id uuid references public.territories(id) on delete set null,
  title text not null,
  type text not null
    check (type in ('market_expansion','unit_recovery','campaign_optimization','territory_outreach','onboarding_support')),
  status text not null default 'detected'
    check (status in ('detected','recommended','approved','in_progress','learning_review','archived')),
  outcome text check (outcome in ('win','mixed','loss')),
  agent_assigned text,
  evidence jsonb not null default '[]'::jsonb,
  action_plan jsonb not null default '[]'::jsonb,
  kpis jsonb not null default '{}'::jsonb,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  review_at timestamptz,
  completed_at timestamptz
);
create index idx_initiatives_brand on public.initiatives(brand_id);
create index idx_initiatives_status on public.initiatives(brand_id, status);
create index idx_initiatives_territory on public.initiatives(territory_id);
create index idx_initiatives_type on public.initiatives(brand_id, type);
create index idx_initiatives_review on public.initiatives(review_at) where review_at is not null;

-- ============================================================
-- AGENT EVENTS
-- ============================================================
create table public.agent_events (
  id uuid primary key default extensions.uuid_generate_v4(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  agent_name text not null,
  event_type text not null,
  correlation_id text,
  chain_depth integer not null default 0,
  status text not null default 'pending'
    check (status in ('pending','processing','completed','failed','skipped')),
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  error text,
  model_tier text check (model_tier in ('strategic','operational','worker')),
  model_used text,
  duration_ms integer,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
create index idx_agent_events_brand on public.agent_events(brand_id);
create index idx_agent_events_type on public.agent_events(event_type);
create index idx_agent_events_status on public.agent_events(brand_id, status);
create index idx_agent_events_agent on public.agent_events(agent_name);
create index idx_agent_events_correlation on public.agent_events(correlation_id) where correlation_id is not null;
create index idx_agent_events_created on public.agent_events(brand_id, created_at desc);
create index idx_agent_events_pending on public.agent_events(brand_id, status, created_at) where status = 'pending';

-- ============================================================
-- MEMORY ENTRIES — text-based embeddings (pgvector-free)
-- ============================================================
create table public.memory_entries (
  id uuid primary key default extensions.uuid_generate_v4(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  layer text not null
    check (layer in ('episodic','semantic','strategic','brand','market','campaign','franchisee','territory','decision-log')),
  title text,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  embedding_text text,
  status text not null default 'active'
    check (status in ('active','archived','superseded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_memory_brand on public.memory_entries(brand_id);
create index idx_memory_layer on public.memory_entries(brand_id, layer);
create index idx_memory_status on public.memory_entries(brand_id, status);
create index idx_memory_created on public.memory_entries(brand_id, created_at desc);

-- ============================================================
-- CAMPAIGNS
-- ============================================================
create table public.campaigns (
  id uuid primary key default extensions.uuid_generate_v4(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  initiative_id uuid references public.initiatives(id) on delete set null,
  territory_id uuid references public.territories(id) on delete set null,
  name text not null,
  type text not null default 'recruitment',
  channels text[] not null default '{}',
  status text not null default 'draft'
    check (status in ('draft','ready','active','paused','completed','archived')),
  content jsonb not null default '{}'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  launched_at timestamptz,
  review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_campaigns_brand on public.campaigns(brand_id);
create index idx_campaigns_initiative on public.campaigns(initiative_id);
create index idx_campaigns_status on public.campaigns(brand_id, status);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Text-based memory search (replaces pgvector similarity search)
-- Uses simple text matching on content. For production vector search,
-- re-enable pgvector and restore the vector column + match_memories function.
create or replace function match_memories(
  query_text text,
  match_brand_id uuid,
  match_layer text default null,
  match_threshold float default 0.0,
  match_count int default 10
)
returns table (
  id uuid, brand_id uuid, layer text, title text,
  content text, metadata jsonb, similarity float
)
language plpgsql as $$
begin
  return query
  select me.id, me.brand_id, me.layer, me.title, me.content, me.metadata,
    1.0::float as similarity
  from public.memory_entries me
  where me.brand_id = match_brand_id
    and me.status = 'active'
    and (match_layer is null or me.layer = match_layer)
    and (query_text is null or me.content ilike '%' || query_text || '%')
  order by me.created_at desc
  limit match_count;
end;
$$;

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger brands_updated_at before update on public.brands for each row execute function update_updated_at();
create trigger territories_updated_at before update on public.territories for each row execute function update_updated_at();
create trigger franchisees_updated_at before update on public.franchisees for each row execute function update_updated_at();
create trigger leads_updated_at before update on public.leads for each row execute function update_updated_at();
create trigger initiatives_updated_at before update on public.initiatives for each row execute function update_updated_at();
create trigger memory_updated_at before update on public.memory_entries for each row execute function update_updated_at();
create trigger campaigns_updated_at before update on public.campaigns for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.brands enable row level security;
alter table public.territories enable row level security;
alter table public.franchisees enable row level security;
alter table public.leads enable row level security;
alter table public.initiatives enable row level security;
alter table public.agent_events enable row level security;
alter table public.memory_entries enable row level security;
alter table public.campaigns enable row level security;

-- Brand isolation: uses current_setting('app.current_org_id') set by
-- the application layer (Edge Function / middleware) from the Clerk JWT.
-- Service role bypasses RLS automatically.

create policy "brand_isolation" on public.brands
  for all using (
    clerk_org_id = current_setting('app.current_org_id', true)
  );
create policy "brands_service_role" on public.brands
  for all using (auth.role() = 'service_role');

create policy "brand_isolation" on public.territories
  for all using (
    brand_id in (select id from public.brands where clerk_org_id = current_setting('app.current_org_id', true))
  );
create policy "territories_service_role" on public.territories
  for all using (auth.role() = 'service_role');

create policy "brand_isolation" on public.franchisees
  for all using (
    brand_id in (select id from public.brands where clerk_org_id = current_setting('app.current_org_id', true))
  );
create policy "franchisees_service_role" on public.franchisees
  for all using (auth.role() = 'service_role');

create policy "brand_isolation" on public.leads
  for all using (
    brand_id in (select id from public.brands where clerk_org_id = current_setting('app.current_org_id', true))
  );
create policy "leads_service_role" on public.leads
  for all using (auth.role() = 'service_role');

create policy "brand_isolation" on public.initiatives
  for all using (
    brand_id in (select id from public.brands where clerk_org_id = current_setting('app.current_org_id', true))
  );
create policy "initiatives_service_role" on public.initiatives
  for all using (auth.role() = 'service_role');

create policy "brand_isolation" on public.agent_events
  for all using (
    brand_id in (select id from public.brands where clerk_org_id = current_setting('app.current_org_id', true))
  );
create policy "events_service_role" on public.agent_events
  for all using (auth.role() = 'service_role');

create policy "brand_isolation" on public.memory_entries
  for all using (
    brand_id in (select id from public.brands where clerk_org_id = current_setting('app.current_org_id', true))
  );
create policy "memory_service_role" on public.memory_entries
  for all using (auth.role() = 'service_role');

create policy "brand_isolation" on public.campaigns
  for all using (
    brand_id in (select id from public.brands where clerk_org_id = current_setting('app.current_org_id', true))
  );
create policy "campaigns_service_role" on public.campaigns
  for all using (auth.role() = 'service_role');

-- ============================================================
-- SEED: Skill Samurai
-- ============================================================
insert into public.brands (name, slug, domain, config, status) values (
  'Skill Samurai', 'skill-samurai', 'os.skillsamurai.com',
  '{"colors":{"primary":"#1E40AF","secondary":"#1E293B","accent":"#F59E0B"},"voice_tone":"Professional, empowering, education-focused.","territory_rules":{"min_population":50000,"max_radius_km":15,"min_school_density":10,"max_units_per_territory":3},"royalty_rate":0.07,"platform_fee":0.015,"onboarding_checklist":["territory_assignment","document_signing","training_schedule","system_access","marketing_setup","location_setup","soft_launch","grand_opening"],"ideal_persona":"teacher","programs":["after-school STEM","holiday camps","birthday parties","school workshops"]}'::jsonb,
  'active'
);

insert into public.territories (brand_id, name, region, geo_data, demographics, score, grade, status)
select b.id, 'Dallas North', 'Texas',
  '{"center":{"lat":32.9483,"lng":-96.7299},"radius_km":12,"city":"Dallas","state":"TX","country":"US"}'::jsonb,
  '{"population":92000,"households":33000,"median_income":78000,"school_count":18,"family_density_score":81,"school_density_score":76}'::jsonb,
  81.00, 'A', 'open'
from public.brands b where b.slug = 'skill-samurai';

insert into public.territories (brand_id, name, region, geo_data, demographics, score, grade, status)
select b.id, 'Phoenix Central', 'Arizona',
  '{"center":{"lat":33.4484,"lng":-112.074},"radius_km":10,"city":"Phoenix","state":"AZ","country":"US"}'::jsonb,
  '{"population":105000,"households":38000,"median_income":65000,"school_count":22,"family_density_score":74,"school_density_score":82}'::jsonb,
  79.00, 'B', 'active'
from public.brands b where b.slug = 'skill-samurai';

insert into public.territories (brand_id, name, region, geo_data, demographics, score, grade, status)
select b.id, 'Tampa South', 'Florida',
  '{"center":{"lat":27.9506,"lng":-82.4572},"radius_km":11,"city":"Tampa","state":"FL","country":"US"}'::jsonb,
  '{"population":88000,"households":31000,"median_income":72000,"school_count":15,"family_density_score":77,"school_density_score":71}'::jsonb,
  74.50, 'B', 'open'
from public.brands b where b.slug = 'skill-samurai';
