// FranchiseOS — Shared TypeScript types

export type MemoryLayer =
  | 'episodic'
  | 'semantic'
  | 'strategic'
  | 'brand'
  | 'market'
  | 'campaign'
  | 'franchisee'
  | 'territory'
  | 'decision-log';

export type SignalType =
  | 'lead_cluster'
  | 'territory_threshold'
  | 'competitor_closed'
  | 'search_volume_spike';

export type ModelTier = 'strategic' | 'operational' | 'worker';

// ── Brand ───────────────────────────────────────────────────────────────

export interface TerritoryRules {
  min_population: number;
  max_radius_km: number;
  min_school_density: number;
  max_units_per_territory: number;
}

export interface BrandConfig {
  colors: { primary: string; secondary: string; accent: string };
  voice_tone: string;
  programs: string[];
  royalty_rate: number;
  platform_fee: number;
  territory_rules: TerritoryRules;
  onboarding_checklist: string[];
  ideal_persona: string;
  messaging: string;
  integrations: Record<string, unknown>;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  clerk_org_id: string;
  domain: string;
  config: BrandConfig;
  status: string;
  created_at: string;
  updated_at: string;
}

// ── Territory ───────────────────────────────────────────────────────────

export interface GeoData {
  center: { lat: number; lng: number };
  radius_km: number;
  city: string;
  state: string;
  country: string;
}

export interface Demographics {
  population: number;
  households: number;
  median_income: number;
  school_count: number;
  family_density_score: number;
  school_density_score: number;
}

export interface Territory {
  id: string;
  brand_id: string;
  name: string;
  region: string;
  geo_data: GeoData;
  demographics: Demographics;
  score: number;
  grade: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// ── Franchisee ──────────────────────────────────────────────────────────

export interface Franchisee {
  id: string;
  brand_id: string;
  clerk_org_id: string;
  clerk_user_id: string;
  name: string;
  email: string;
  phone: string;
  territory_id: string;
  unit_number: string;
  status: string;
  onboarding_data: Record<string, unknown>;
  performance_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ── Lead ────────────────────────────────────────────────────────────────

export interface Lead {
  id: string;
  brand_id: string;
  territory_id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  persona: string;
  score: number;
  status: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ── Initiative ──────────────────────────────────────────────────────────

export interface Initiative {
  id: string;
  brand_id: string;
  territory_id: string;
  title: string;
  type: string;
  status: string;
  outcome: string;
  agent_assigned: string;
  evidence: Record<string, unknown>;
  action_plan: Record<string, unknown>;
  kpis: Record<string, unknown>;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ── Agent Event ─────────────────────────────────────────────────────────

export interface AgentEvent {
  id: string;
  brand_id: string;
  agent_name: string;
  event_type: string;
  correlation_id: string;
  chain_depth: number;
  status: string;
  payload: Record<string, unknown>;
  result: Record<string, unknown>;
  error: string | null;
  model_tier: ModelTier;
  model_used: string;
  duration_ms: number;
  created_at: string;
  processed_at: string | null;
}

// ── Memory ──────────────────────────────────────────────────────────────

export interface MemoryEntry {
  id: string;
  brand_id: string;
  layer: MemoryLayer;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  embedding: number[] | null;
  status: string;
  created_at: string;
  updated_at: string;
}

// ── Campaign ────────────────────────────────────────────────────────────

export interface Campaign {
  id: string;
  brand_id: string;
  initiative_id: string;
  territory_id: string;
  name: string;
  type: string;
  channels: string[];
  status: string;
  content: Record<string, unknown>;
  metrics: Record<string, unknown>;
  launched_at: string | null;
  review_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Opportunity Signal ──────────────────────────────────────────────────

export interface GeoLocation {
  lat: number;
  lng: number;
  label?: string;
}

export interface OpportunitySignal {
  id: string;
  type: SignalType;
  location: GeoLocation;
  score: number;
  summary: string;
  recommended_action: string;
  created_at: string;
}

// ── Command ─────────────────────────────────────────────────────────────

export interface CommandAction {
  type: string;
  label: string;
  payload: Record<string, unknown>;
}

export interface CommandResponse {
  message: string;
  actions?: CommandAction[];
  data?: unknown;
}
