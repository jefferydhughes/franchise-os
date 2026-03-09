# FranchiseOS — Tools Specification

## Overview

Tools are the hands of the system. Agents reason and decide; tools execute. Every database write, external API call, and side effect flows through a tool. Agents never write to the database directly — all mutations go through tools, and every mutation emits an event to the Event Bus.

Tools are TypeScript functions called by the swarm controller on behalf of agents. They validate inputs, execute operations via the Supabase service-role client, emit events, and return structured results.

---

## 1. Tool Architecture

### Execution Flow

```
Agent decides to call tool
    |
    v
Swarm Controller validates tool call
    |
    v
Tool function executes
    |-- Validates input
    |-- Performs database operation (via Supabase)
    |-- Emits event to agent_events table
    |-- Returns result to agent
    |
    v
Swarm Controller logs tool call
```

### Tool Rules

1. Every tool call is logged to `agent_events` with tool name, parameters, and result.
2. Every database write emits an event to the Event Bus.
3. Tools validate inputs before execution — reject malformed data with descriptive errors.
4. Tools are brand-scoped via `brand_id` — never cross tenant boundaries.
5. Tool responses include the full created/updated record for agent reasoning.
6. Read-only tools do not emit events.
7. Tools use the service-role Supabase client for writes (bypasses RLS).

### Tool Registration

```typescript
interface ToolDefinition {
  name: string;
  category: ToolCategory;
  description: string;
  inputSchema: Record<string, unknown>;   // JSON Schema
  outputSchema: Record<string, unknown>;  // JSON Schema
  sideEffects: string[];                  // Events emitted
  requiresBrandId: boolean;
  readOnly: boolean;
}

type ToolCategory =
  | 'crm'
  | 'territory'
  | 'marketing'
  | 'documents'
  | 'email'
  | 'payments'
  | 'analytics'
  | 'memory'
  | 'initiative';
```

---

## 2. CRM Tools

Tools for managing leads, candidates, and the sales pipeline.

### crm.create_lead

Creates a new lead record and emits `lead.created`.

```typescript
async function createLead(input: {
  brand_id: string;
  name?: string;
  email?: string;
  phone?: string;
  source: 'website' | 'referral' | 'campaign' | 'manual' | 'scraped';
  territory_id?: string;
  persona?: string;
  data?: Record<string, unknown>;
}): Promise<Lead>

// Side effects:
// - Inserts row into `leads` table
// - Emits `lead.created` event
```

### crm.update_candidate

Updates a lead/candidate record and emits stage-appropriate events.

```typescript
async function updateCandidate(input: {
  id: string;
  brand_id: string;
  status?: LeadStatus;
  score?: number;
  persona?: string;
  data?: Record<string, unknown>;
}): Promise<Lead>

// Side effects:
// - Updates row in `leads` table
// - Emits `lead.scored` if score changed
// - Emits `lead.routed` if status changed to a pipeline stage
// - Emits `candidate.scored` if status is 'qualified' or beyond
```

### crm.get_lead

Retrieves a single lead by ID. Read-only.

```typescript
async function getLead(input: {
  id: string;
  brand_id: string;
}): Promise<Lead | null>
```

### crm.get_pipeline

Returns the current sales pipeline summary for a brand.

```typescript
async function getPipeline(input: {
  brand_id: string;
  status_filter?: LeadStatus[];
  territory_id?: string;
  limit?: number;
}): Promise<{
  leads: Lead[];
  summary: {
    total: number;
    by_status: Record<LeadStatus, number>;
    by_source: Record<string, number>;
    avg_score: number;
  };
}>
```

### crm.create_onboarding_checklist

Initializes the onboarding workflow for a new franchisee.

```typescript
async function createOnboardingChecklist(input: {
  franchisee_id: string;
  brand_id: string;
}): Promise<{
  franchisee_id: string;
  checklist: Array<{
    step: string;
    status: 'pending' | 'in_progress' | 'completed';
    due_date?: string;
  }>;
}>

// Side effects:
// - Updates franchisee.onboarding_data
// - Emits `onboarding.started`
```

### Type: Lead

```typescript
interface Lead {
  id: string;
  brand_id: string;
  territory_id?: string;
  name?: string;
  email?: string;
  phone?: string;
  source: string;
  persona?: string;
  score: number;
  status: LeadStatus;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

type LeadStatus =
  | 'new' | 'scored' | 'contacted' | 'qualified' | 'nurturing'
  | 'discovery_scheduled' | 'discovery_completed' | 'proposal_sent'
  | 'converted' | 'lost' | 'suppressed';
```

---

## 3. Territory Tools

Tools for territory scoring, status checking, and conflict detection.

### territory.score

Scores a geographic area using the territory scoring engine.

```typescript
async function scoreTerritory(input: {
  lat: number;
  lng: number;
  radius_km: number;
  brandId: string;
}): Promise<TerritoryScoringOutput>

// Side effects:
// - Persists score to `territory_scores` table
// - Emits `territory.score.generated`
```

**References:** `territory-engine/territory-scorer.ts` — the scoring logic with 5 dimensions (population density, median income, competitor proximity, franchise saturation, traffic/search signals).

### territory.get_status

Returns the current status of a territory.

```typescript
async function getTerritoryStatus(input: {
  territory_id: string;
  brand_id: string;
}): Promise<Territory>
```

### territory.check_conflicts

Checks whether a proposed territory would conflict with existing territories.

```typescript
async function checkConflicts(input: {
  lat: number;
  lng: number;
  radius_km: number;
  brand_id: string;
}): Promise<{
  has_conflicts: boolean;
  conflicts: Array<{
    territory_id: string;
    territory_name: string;
    overlap_type: 'full' | 'partial' | 'proximity';
    distance_km: number;
  }>;
}>

// Side effects:
// - Emits `territory.conflict.detected` if conflicts found
```

### territory.list

Returns all territories for a brand with optional filters.

```typescript
async function listTerritories(input: {
  brand_id: string;
  status?: 'open' | 'reserved' | 'active' | 'saturated';
  min_score?: number;
  region?: string;
  limit?: number;
}): Promise<Territory[]>
```

### Type: TerritoryScoringOutput

```typescript
interface TerritoryScoringOutput {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  breakdown: {
    populationDensity: DimensionScore;
    medianIncome: DimensionScore;
    competitorProximity: DimensionScore;
    franchiseSaturation: DimensionScore;
    trafficSearchSignal: DimensionScore;
  };
  recommendation: string;
}

interface DimensionScore {
  raw: number;
  normalized: number;
  weight: number;
  weighted: number;
  details: string;
}
```

---

## 4. Marketing Tools

Tools for campaign management and performance tracking.

### marketing.create_campaign

Creates a new marketing campaign record.

```typescript
async function createCampaign(input: {
  brand_id: string;
  initiative_id?: string;
  territory_id?: string;
  name: string;
  type: 'recruitment' | 'awareness' | 'retention';
  channels: string[];
  content?: Record<string, unknown>;
}): Promise<Campaign>

// Side effects:
// - Inserts row into `campaigns` table
// - Emits `campaign.created`
```

### marketing.launch_campaign

Activates a campaign and updates its status to `active`.

```typescript
async function launchCampaign(input: {
  campaign_id: string;
  brand_id: string;
  assets: {
    landing_page_url?: string;
    email_sequence_id?: string;
    social_post_ids?: string[];
  };
  review_date: string;
}): Promise<Campaign>

// Side effects:
// - Updates campaign status to 'active', sets launched_at
// - Emits `campaign.sequence.launched`
```

### marketing.get_performance

Returns campaign performance metrics.

```typescript
async function getCampaignPerformance(input: {
  campaign_id: string;
  brand_id: string;
}): Promise<{
  campaign_id: string;
  metrics: {
    impressions: number;
    clicks: number;
    leads_generated: number;
    conversions: number;
    cost_per_lead: number;
    roi: number;
  };
  by_channel: Record<string, {
    impressions: number;
    clicks: number;
    conversions: number;
  }>;
}>
```

### Type: Campaign

```typescript
interface Campaign {
  id: string;
  brand_id: string;
  initiative_id?: string;
  territory_id?: string;
  name: string;
  type: string;
  channels: string[];
  status: 'draft' | 'ready' | 'active' | 'paused' | 'completed' | 'archived';
  content: Record<string, unknown>;
  metrics: Record<string, unknown>;
  launched_at?: string;
  review_at?: string;
  created_at: string;
  updated_at: string;
}
```

---

## 5. Document Tools

Tools for generating franchise-specific documents.

### document.generate_landing_page

Generates a localized franchise recruitment landing page.

```typescript
async function generateLandingPage(input: {
  brand_id: string;
  territory_id?: string;
  headline: string;
  subheadline?: string;
  cta_text: string;
  cta_url: string;
  target_persona: string;
  brand_voice: string;
  market_data?: {
    city: string;
    state: string;
    population: number;
    opportunity_score: number;
  };
}): Promise<{
  html: string;
  url: string;
  metadata: {
    word_count: number;
    sections: string[];
    generated_at: string;
  };
}>

// Side effects:
// - Emits `landing_page.generated`
```

### document.generate_proposal

Generates a territory proposal document for a franchise candidate.

```typescript
async function generateProposal(input: {
  brand_id: string;
  territory_id: string;
  candidate_id: string;
  territory_score: TerritoryScoringOutput;
  brand_info: {
    name: string;
    franchise_fee: number;
    royalty_rate: number;
    programs: string[];
  };
}): Promise<{
  pdf_url: string;
  sections: string[];
  generated_at: string;
}>

// Side effects:
// - Emits `proposal.generated`
```

---

## 6. Email Tools

Tools for generating and sending email communications.

### email.generate_sequence

Generates a multi-step email sequence for lead nurturing or outreach.

```typescript
async function generateEmailSequence(input: {
  brand_id: string;
  type: 'outreach' | 'nurture' | 'followup' | 'onboarding';
  length: number;                // Number of emails in sequence
  territory?: string;            // Target market for localization
  target_persona: string;
  brand_voice: string;
  subject_line_style?: 'professional' | 'casual' | 'urgent';
}): Promise<{
  emails: Array<{
    sequence_number: number;
    subject: string;
    body_html: string;
    body_text: string;
    send_delay_days: number;     // Days after previous email
    cta: string;
  }>;
  metadata: {
    total_emails: number;
    total_sequence_days: number;
    generated_at: string;
  };
}>

// Side effects:
// - Emits `email_campaign.generated`
```

### email.send

Sends an individual email via the configured email provider.

```typescript
async function sendEmail(input: {
  to: string;
  subject: string;
  body_html: string;
  body_text?: string;
  from_name?: string;
  from_email?: string;
  brand_id: string;
  reply_to?: string;
  tags?: string[];
}): Promise<{
  sent: boolean;
  message_id?: string;
  error?: string;
}>

// Side effects:
// - Sends email via provider (SendGrid, Resend, etc.)
// - No event emitted (individual sends are not tracked as events)
```

---

## 7. Payment Tools

Tools for royalty calculation and payment processing.

### payments.calculate_royalty

Calculates the royalty owed by a franchise unit for a period.

```typescript
async function calculateRoyalty(input: {
  unit_id: string;
  brand_id: string;
  period: string;                // e.g., '2026-03'
  gross_revenue: number;
}): Promise<{
  unit_id: string;
  period: string;
  gross_revenue: number;
  royalty_rate: number;
  royalty_amount: number;
  platform_fee_rate: number;
  platform_fee_amount: number;
  net_to_franchisee: number;
  breakdown: {
    royalty: number;
    platform_fee: number;
    marketing_fund: number;
  };
}>

// Side effects:
// - Inserts row into `payments` table
// - Emits `royalty.calculated`
```

### payments.split_payment

Splits a received payment into the appropriate buckets (franchisor royalty, platform fee, marketing fund).

```typescript
async function splitPayment(input: {
  payment_id: string;
  brand_id: string;
}): Promise<{
  payment_id: string;
  splits: Array<{
    recipient: 'franchisor' | 'platform' | 'marketing_fund';
    amount: number;
    percentage: number;
  }>;
}>
```

### payments.process_payment

Records a payment received from a franchisee.

```typescript
async function processPayment(input: {
  franchisee_id: string;
  brand_id: string;
  amount: number;
  currency: string;
  type: 'royalty' | 'franchise_fee' | 'marketing_fund' | 'other';
  period?: string;
  reference?: string;
}): Promise<{
  payment_id: string;
  status: 'received' | 'pending' | 'failed';
}>

// Side effects:
// - Inserts row into `payments` table
// - Emits `payment.received`
```

---

## 8. Analytics Tools

Read-only tools for retrieving performance data and market intelligence.

### analytics.get_traffic_by_region

Returns web traffic and search volume data grouped by geographic region.

```typescript
async function getTrafficByRegion(input: {
  brand_id: string;
  region?: string;
  period?: string;
  limit?: number;
}): Promise<Array<{
  region: string;
  city?: string;
  state?: string;
  lat: number;
  lng: number;
  page_views: number;
  unique_visitors: number;
  search_volume: number;
  change_percent: number;
}>>
```

### analytics.get_campaign_performance

Returns performance metrics for a specific campaign.

```typescript
async function getCampaignPerformance(input: {
  campaign_id: string;
  brand_id: string;
}): Promise<{
  impressions: number;
  clicks: number;
  leads_generated: number;
  conversions: number;
  spend: number;
  cost_per_lead: number;
  cost_per_conversion: number;
  roi: number;
  by_channel: Record<string, Record<string, number>>;
}>
```

### analytics.get_unit_performance

Returns performance metrics for a franchise unit.

```typescript
async function getUnitPerformance(input: {
  unit_id?: string;
  franchisee_id?: string;
  brand_id: string;
  period?: string;
}): Promise<{
  unit_id: string;
  franchisee_id: string;
  territory_id: string;
  metrics: {
    revenue: number;
    revenue_change_percent: number;
    customer_count: number;
    customer_satisfaction: number;
    operational_score: number;
    royalty_compliance: boolean;
  };
  trend: 'improving' | 'stable' | 'declining';
  risk_level: 'low' | 'medium' | 'high' | 'critical';
}>
```

---

## 9. Memory Tools

Tools for storing and retrieving system memory across the 9-layer architecture.

### memory.store

Stores a memory record in the specified layer.

```typescript
async function storeMemoryRecord(input: {
  brand_id: string;
  layer: MemoryLayer;
  content: string;
  title?: string;
  metadata?: Record<string, unknown>;
}): Promise<MemoryRecord>

// Side effects:
// - Inserts row into `memory_entries` table
// - Generates embedding (when real embeddings are enabled)
```

### memory.retrieve

Retrieves memories by brand and layer with optional text query.

```typescript
async function retrieveMemoryRecords(input: {
  brand_id: string;
  layer: MemoryLayer;
  query?: string;
  limit?: number;
}): Promise<MemoryRecord[]>
```

### memory.retrieve_market_context

Retrieves market intelligence for a specific region.

```typescript
async function retrieveMarketContext(input: {
  brand_id: string;
  region: string;
  limit?: number;
}): Promise<MemoryRecord[]>

// Queries 'market' layer filtered by region metadata
```

### memory.retrieve_campaign_history

Retrieves campaign history and learnings.

```typescript
async function retrieveCampaignHistory(input: {
  brand_id: string;
  territory_id?: string;
  persona?: string;
  limit?: number;
}): Promise<MemoryRecord[]>

// Queries 'campaign' layer filtered by territory and persona metadata
```

### memory.retrieve_brand_context

Retrieves the full brand context (voice, positioning, offers) as a single string for agent prompts.

```typescript
async function retrieveBrandContext(input: {
  brand_id: string;
}): Promise<string>

// Combines brand memory entries into a formatted context string
```

### memory.retrieve_territory_context

Retrieves territory history and scoring data.

```typescript
async function retrieveTerritoryContext(input: {
  brand_id: string;
  territory_id: string;
}): Promise<MemoryRecord[]>

// Queries 'territory' layer filtered by territory_id metadata
```

### memory.retrieve_franchisee_context

Retrieves franchisee-specific knowledge and coaching notes.

```typescript
async function retrieveFranchiseeContext(input: {
  brand_id: string;
  franchisee_id: string;
}): Promise<MemoryRecord[]>

// Queries 'franchisee' layer filtered by franchisee_id metadata
```

### memory.write_learning_record

Stores a learning outcome from initiative or campaign review.

```typescript
async function writeLearningRecord(input: {
  brand_id: string;
  content: string;
  metadata: {
    source_agent: string;
    initiative_id?: string;
    campaign_id?: string;
    outcome: 'win' | 'mixed' | 'loss';
    confidence: number;
    lessons_learned: string[];
  };
}): Promise<MemoryRecord>

// Side effects:
// - Inserts row into `memory_entries` table (semantic layer)
// - Emits `learning.captured`
```

### memory.retrieve_sales_patterns

Retrieves proven sales patterns and lead conversion insights.

```typescript
async function retrieveSalesPatterns(input: {
  brand_id: string;
  persona?: string;
  region?: string;
  limit?: number;
}): Promise<MemoryRecord[]>

// Queries 'semantic' layer filtered by pattern_type and tags
```

### Type: MemoryRecord

```typescript
type MemoryLayer =
  | 'episodic' | 'semantic' | 'strategic' | 'brand' | 'market'
  | 'campaign' | 'franchisee' | 'territory' | 'decision-log';

interface MemoryRecord {
  id: string;
  brand_id: string;
  layer: MemoryLayer;
  title?: string;
  content: string;
  metadata: Record<string, unknown>;
  status: 'active' | 'archived' | 'superseded';
  created_at: string;
  updated_at: string;
}
```

**References:** `memory/index.ts` — the core memory implementation with `storeMemory()`, `retrieveMemory()`, `searchSimilarMemories()`, `logDecision()`.

---

## 10. Initiative Tools

Tools for creating and managing swarm-driven initiatives.

### initiative.create

Creates a new initiative after evaluating decision gates.

```typescript
async function createInitiative(input: {
  brand_id: string;
  title: string;
  type: InitiativeType;
  territory_id?: string;
  evidence: Array<{
    source: string;
    signal: string;
    score: number;
  }>;
  action_plan?: Array<{
    step: number;
    action: string;
    agent: string;
  }>;
}): Promise<Initiative>

// Side effects:
// - Inserts row into `initiatives` table
// - Emits `initiative.created`
// - Triggers downstream worker agents via action_plan
```

### initiative.check_duplicates

Checks for existing active initiatives that cover the same market or territory.

```typescript
async function checkDuplicates(input: {
  brand_id: string;
  type: InitiativeType;
  territory_id?: string;
  region?: string;
}): Promise<{
  has_duplicates: boolean;
  duplicates: Initiative[];
}>
```

### initiative.schedule_review

Sets a review date for an active initiative.

```typescript
async function scheduleReview(input: {
  initiative_id: string;
  brand_id: string;
  review_at: string;
}): Promise<Initiative>

// Side effects:
// - Updates initiatives.review_at
// - Emits `initiative.review.scheduled`
```

### initiative.update_status

Updates an initiative's status and optionally records the outcome.

```typescript
async function updateInitiativeStatus(input: {
  initiative_id: string;
  brand_id: string;
  status: InitiativeStatus;
  outcome?: 'win' | 'mixed' | 'loss';
  notes?: string;
}): Promise<Initiative>

// Side effects:
// - Updates initiatives table
// - Emits `initiative.review.completed` if status is 'learning_review' or 'archived'
```

### initiative.get_active

Returns all active initiatives for a brand.

```typescript
async function getActiveInitiatives(input: {
  brand_id: string;
  type?: InitiativeType;
  territory_id?: string;
  limit?: number;
}): Promise<Initiative[]>
```

### Type: Initiative

```typescript
type InitiativeType =
  | 'market_expansion'
  | 'unit_recovery'
  | 'campaign_optimization'
  | 'territory_outreach'
  | 'onboarding_support';

type InitiativeStatus =
  | 'detected' | 'recommended' | 'approved'
  | 'in_progress' | 'learning_review' | 'archived';

interface Initiative {
  id: string;
  brand_id: string;
  territory_id?: string;
  title: string;
  type: InitiativeType;
  status: InitiativeStatus;
  outcome?: 'win' | 'mixed' | 'loss';
  agent_assigned?: string;
  evidence: Array<Record<string, unknown>>;
  action_plan: Array<Record<string, unknown>>;
  kpis: Record<string, unknown>;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  review_at?: string;
  completed_at?: string;
}
```

---

## 11. Existing TypeScript Implementations

| Tool Category | Existing File | Status |
|--------------|--------------|--------|
| Territory scoring | `territory-engine/territory-scorer.ts` | Implemented — 5-dimension scoring with Supabase persistence |
| Expansion radar | `expansion-radar/radar-engine.ts` | Implemented — 4 signal sources with parallel scanning |
| Memory operations | `memory/index.ts` | Implemented — store, retrieve, search, logDecision |
| Model routing | `dashboard-app/src/lib/model-router.ts` | Implemented — getModel, routeRequest |
| Brand loading | `brand-engine/brand-loader.ts` | Implemented — loads brand config from filesystem |
| Config validation | `brand-engine/config-validator.ts` | Implemented — validates brand JSON |
| Slack notifications | `messaging/slack-gateway.ts` | Stub — gateway interface defined |
| SMS notifications | `messaging/sms-gateway.ts` | Stub — Twilio integration stubbed |
| WhatsApp notifications | `messaging/whatsapp-gateway.ts` | Stub — gateway interface defined |

---

## 12. Integration Points

### Agents (Layer 3)
Agents call tools via function calling in the Claude API. The swarm controller maps agent tool requests to the registered tool functions and passes the results back to the agent.

### Event Bus (Layer 2)
Tools emit events after successful write mutations. Events follow the envelope schema defined in `EVENT_SCHEMA.md`.

### Supabase (Layer 1)
All database operations use the Supabase client with service-role credentials. Read operations can use the anon key with RLS for client-side queries.

### External APIs (Layer 4)
Tools that call external APIs wrap the calls with:
- Error handling and retry logic
- Response caching (where appropriate)
- Rate limiting to stay within API quotas
- Fallback to cached/simulated data when APIs are unavailable

---

## 13. Implementation Notes

- V1: Tools are TypeScript functions called directly by the swarm controller after agent reasoning.
- V2: Tools may become Supabase Edge Functions for independent scaling and deployment.
- External API tools (Census Bureau, Google Maps Places, SerpApi, Stripe) are stubbed with TODO comments in existing code. Each stub returns simulated data and logs a warning.
- All tools use the service-role Supabase client for writes. Read-only tools can use the anon key.
- Tool execution timeout: 30 seconds for database operations, 60 seconds for external API calls.
- Tools must be idempotent where possible — duplicate calls with the same input should not create duplicate records.
