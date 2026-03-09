# FranchiseOS — Event Schema

## Overview

Events are the nervous system of FranchiseOS. Every action in the system — agent execution, data mutation, user interaction, scheduled job — produces an event. Agents subscribe to events and react. This document defines the event envelope format, the complete event type catalog, payload schemas for each event type, event chain rules, and examples.

---

## 1. Event Envelope

Every event in the system conforms to this envelope structure:

```typescript
interface EventEnvelope {
  /** Unique event identifier (format: evt_{ulid}) */
  event_id: string;

  /** Dot-notation event type (e.g., 'market.opportunity.detected') */
  event_type: string;

  /** Brand scope — all events are tenant-isolated */
  brand_id: string;

  /** ISO 8601 timestamp of when the event was emitted */
  timestamp: string;

  /** Which agent or system component created this event */
  source_agent: string;

  /** Links related events in a workflow chain */
  correlation_id: string;

  /** How many events deep in a chain (max 10) */
  chain_depth: number;

  /** Event-specific data */
  payload: Record<string, unknown>;

  /** Processing status */
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';

  /** Model tier used for the agent that processed this event */
  model_tier?: 'strategic' | 'operational' | 'worker';

  /** Specific model identifier used */
  model_used?: string;

  /** Execution duration in milliseconds */
  duration_ms?: number;

  /** Error message if status is 'failed' */
  error?: string;

  /** Result data from agent execution */
  result?: Record<string, unknown>;
}
```

### Envelope Rules

1. `event_id` must be globally unique. Use ULID or UUIDv4.
2. `event_type` uses dot-notation with category prefix: `{category}.{noun}.{verb}`.
3. `brand_id` is required on every event — no cross-brand events.
4. `timestamp` is always ISO 8601 UTC.
5. `source_agent` identifies the emitter: agent name, `SYSTEM`, or `USER`.
6. `correlation_id` groups related events in a workflow. All events triggered by the same root cause share a correlation ID.
7. `chain_depth` starts at 0 for root events and increments by 1 for each downstream event.
8. Events are immutable once emitted — status and result fields are updated in place but the payload never changes.

---

## 2. Event Type Catalog

### 2.1 Lead Events

| Event Type | Source | Description |
|------------|--------|-------------|
| `lead.created` | CRM tool / webhook | New prospect entered the system |
| `lead.replied` | Email tool / webhook | Prospect responded to outreach |
| `lead.scored` | LEAD_INTELLIGENCE_AGENT | Lead assigned a quality score (0-100) |
| `lead.routed` | LEAD_INTELLIGENCE_AGENT | Lead assigned to next action or agent |
| `lead.enriched` | LEAD_INTELLIGENCE_AGENT | Lead record enriched with external data |
| `lead.suppressed` | LEAD_INTELLIGENCE_AGENT | Lead marked as not viable |

**Payload: `lead.created`**
```typescript
{
  lead_id: string;
  name?: string;
  email?: string;
  phone?: string;
  source: string;           // 'website', 'referral', 'campaign', 'manual'
  territory_id?: string;
  city?: string;
  state?: string;
  lat?: number;
  lng?: number;
}
```

**Payload: `lead.scored`**
```typescript
{
  lead_id: string;
  score: number;             // 0-100
  persona_match: number;     // 0-100 match against ideal franchisee
  signals: string[];         // ['high_income', 'education_background', 'prior_business_owner']
  recommended_action: string;
}
```

**Payload: `lead.routed`**
```typescript
{
  lead_id: string;
  route_to: string;          // 'sales_pipeline', 'nurture_sequence', 'discovery_call', 'disqualified'
  reason: string;
  priority: 'high' | 'normal' | 'low';
}
```

### 2.2 Sales Events

| Event Type | Source | Description |
|------------|--------|-------------|
| `candidate.scored` | SALES_PIPELINE_AGENT | Franchise buyer prospect scored |
| `discovery.call.booked` | CRM tool | Discovery call scheduled |
| `discovery.call.completed` | CRM tool / webhook | Discovery call happened |
| `proposal.requested` | SALES_PIPELINE_AGENT | Franchise proposal needed |
| `proposal.sent` | Document tool | Proposal delivered to candidate |
| `franchise.sold` | CRM tool | Franchise agreement signed |

**Payload: `candidate.scored`**
```typescript
{
  candidate_id: string;
  lead_id: string;
  score: number;
  fit_assessment: string;
  financial_qualified: boolean;
  territory_preference?: string;
}
```

**Payload: `franchise.sold`**
```typescript
{
  franchisee_id: string;
  territory_id: string;
  agreement_date: string;
  franchise_fee: number;
  estimated_launch_date: string;
}
```

### 2.3 Territory Events

| Event Type | Source | Description |
|------------|--------|-------------|
| `territory.score.generated` | TERRITORY_INTELLIGENCE_AGENT | Territory evaluation complete |
| `territory.priority.increased` | CRO_AGENT | Territory moved up in priority |
| `territory.conflict.detected` | TERRITORY_INTELLIGENCE_AGENT | Overlap or saturation found |
| `territory.status.changed` | Territory tool | Territory status updated |
| `territory.inspected` | Dashboard UI | Human operator clicked into territory on heatmap |

**Payload: `territory.score.generated`**
```typescript
{
  territory_id: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  breakdown: {
    populationDensity: { normalized: number; weighted: number };
    medianIncome: { normalized: number; weighted: number };
    competitorProximity: { normalized: number; weighted: number };
    franchiseSaturation: { normalized: number; weighted: number };
    trafficSearchSignal: { normalized: number; weighted: number };
  };
  recommendation: string;
}
```

**Payload: `territory.conflict.detected`**
```typescript
{
  territory_id: string;
  conflict_type: 'overlap' | 'saturation' | 'proximity';
  conflicting_territory_id?: string;
  details: string;
  resolution_options: string[];
}
```

### 2.4 Marketing Events

| Event Type | Source | Description |
|------------|--------|-------------|
| `campaign.created` | CAMPAIGN_AGENT | New campaign registered |
| `campaign.approved` | CMO_AGENT | Campaign approved for launch |
| `campaign.sequence.launched` | CAMPAIGN_AGENT | Multi-channel campaign deployed |
| `campaign.performance` | Analytics tool | Campaign metrics updated |
| `campaign.paused` | CMO_AGENT / USER | Campaign paused |
| `landing_page.requested` | INITIATIVE_AGENT | Page generation needed |
| `landing_page.generated` | LANDING_PAGE_AGENT | Page ready |
| `email_campaign.requested` | INITIATIVE_AGENT | Email sequence needed |
| `email_campaign.generated` | EMAIL_AGENT | Email sequence ready |
| `social_campaign.requested` | INITIATIVE_AGENT | Social content needed |
| `social_content.generated` | SOCIAL_CONTENT_AGENT | Social content ready |
| `content.brief.created` | CONTENT_STRATEGY_AGENT | Content brief ready for workers |

**Payload: `campaign.created`**
```typescript
{
  campaign_id: string;
  initiative_id?: string;
  territory_id?: string;
  name: string;
  type: 'recruitment' | 'awareness' | 'retention';
  channels: string[];        // ['email', 'social', 'landing_page', 'paid_ads']
  target_audience: string;
  budget?: number;
}
```

**Payload: `campaign.sequence.launched`**
```typescript
{
  campaign_id: string;
  channels_activated: string[];
  assets: {
    landing_page_url?: string;
    email_sequence_id?: string;
    social_post_ids?: string[];
  };
  scheduled_review_date: string;
}
```

### 2.5 Operations Events

| Event Type | Source | Description |
|------------|--------|-------------|
| `onboarding.started` | ONBOARDING_AGENT | New franchise activation begun |
| `onboarding.step.completed` | ONBOARDING_AGENT | Onboarding checklist item done |
| `training.completed` | COO_AGENT / webhook | Operator finished training module |
| `unit.performance.updated` | Analytics tool | Unit metrics refreshed |
| `unit.performance_drop` | COACHING_AGENT | Unit KPIs below threshold |
| `coaching.plan.generated` | COACHING_AGENT | Coaching recommendation created |
| `support.escalation` | COO_AGENT | Support issue escalated |

**Payload: `unit.performance_drop`**
```typescript
{
  franchisee_id: string;
  territory_id: string;
  unit_number: string;
  metrics: {
    revenue_change_percent: number;
    customer_satisfaction: number;
    operational_score: number;
  };
  severity: 'warning' | 'critical';
  recommended_intervention: string;
}
```

### 2.6 Finance Events

| Event Type | Source | Description |
|------------|--------|-------------|
| `payment.received` | Payment tool / webhook | Payment processed |
| `royalty.calculated` | Payment tool | Royalty split computed |
| `invoice.generated` | Payment tool | Invoice created |

**Payload: `payment.received`**
```typescript
{
  payment_id: string;
  franchisee_id: string;
  amount: number;
  currency: string;
  type: 'royalty' | 'franchise_fee' | 'marketing_fund' | 'other';
  period?: string;
}
```

### 2.7 Intelligence Events

| Event Type | Source | Description |
|------------|--------|-------------|
| `traffic.heatmap.updated` | Analytics pipeline | New analytics data processed |
| `market.opportunity.detected` | MARKET_OPPORTUNITY_AGENT | Demand signal in open territory |
| `opportunity.detected` | Expansion Radar | Raw opportunity signal from any source |
| `pattern.detected` | PATTERN_DETECTION_AGENT | Cross-system pattern found |
| `learning.captured` | LEARNING_AGENT | Outcome evaluated and recorded |
| `semantic.memory.updated` | MEMORY_CURATOR_AGENT | Long-term knowledge promoted |
| `strategy.recommended` | LEARNING_AGENT | Strategy recommendation based on learnings |

**Payload: `market.opportunity.detected`**
```typescript
{
  region: string;
  city?: string;
  state?: string;
  lat: number;
  lng: number;
  traffic_change: string;     // e.g., '+212%'
  time_window: string;        // e.g., '14_days'
  existing_franchise: boolean;
  opportunity_score: number;
  signal_sources: string[];   // ['search_volume', 'lead_cluster', 'competitor_closure']
  recommended_action: string;
}
```

**Payload: `pattern.detected`**
```typescript
{
  pattern_type: 'opportunity' | 'risk' | 'trend';
  description: string;
  confidence: number;         // 0.0-1.0
  supporting_evidence: Array<{
    event_type: string;
    event_id: string;
    relevance: number;
  }>;
  affected_territories?: string[];
  recommended_action: string;
}
```

### 2.8 Initiative Events

| Event Type | Source | Description |
|------------|--------|-------------|
| `initiative.recommended` | MARKET_OPPORTUNITY_AGENT | Opportunity worthy of coordinated action |
| `initiative.created` | INITIATIVE_AGENT | Action plan launched |
| `initiative.approved` | USER / CEO_AGENT | Initiative approved for execution |
| `initiative.blocked` | INITIATIVE_AGENT | Initiative blocked by gate check |
| `initiative.review.scheduled` | INITIATIVE_AGENT | Evaluation checkpoint set |
| `initiative.review.completed` | LEARNING_AGENT | Evaluation done |
| `initiative.archived` | INITIATIVE_AGENT | Initiative completed or abandoned |

**Payload: `initiative.created`**
```typescript
{
  initiative_id: string;
  type: 'market_expansion' | 'unit_recovery' | 'campaign_optimization' | 'territory_outreach' | 'onboarding_support';
  title: string;
  territory_id?: string;
  region?: string;
  evidence: Array<{
    source: string;
    signal: string;
    score: number;
  }>;
  action_plan: Array<{
    step: number;
    action: string;
    agent: string;
    status: 'pending' | 'in_progress' | 'completed';
  }>;
  gates_evaluated: {
    registration: 'passed' | 'failed' | 'skipped';
    territory: 'passed' | 'failed' | 'skipped';
    strategy: 'passed' | 'failed' | 'skipped';
    duplication: 'passed' | 'failed' | 'skipped';
    confidence: 'passed' | 'failed' | 'skipped';
  };
  review_date: string;
}
```

**Payload: `initiative.blocked`**
```typescript
{
  initiative_id: string;
  blocked_by_gate: string;    // 'registration', 'territory', 'strategy', 'duplication', 'confidence'
  reason: string;
  alternative_action: string; // e.g., 'Created readiness initiative instead'
  notification_sent: boolean;
}
```

### 2.9 System Events

| Event Type | Source | Description |
|------------|--------|-------------|
| `daily.system.report` | REPORT_AGENT (scheduled) | Daily summary generated |
| `weekly.system.summary.generated` | REPORT_AGENT (scheduled) | Weekly rollup complete |
| `agent.health.check` | Swarm Controller | Periodic agent health verification |
| `budget.threshold.reached` | Model Router | Daily cost budget approaching limit |
| `brand.created` | bootstrap-brand.ts | New brand onboarded |
| `brand.update` | Brand engine | Brand configuration changed |

**Payload: `daily.system.report`**
```typescript
{
  report_id: string;
  period: string;             // '2026-03-08'
  summary: {
    leads_created: number;
    leads_scored: number;
    initiatives_launched: number;
    campaigns_active: number;
    agents_executed: number;
    total_model_cost: number;
  };
  highlights: string[];
  risks: string[];
  recommendations: string[];
}
```

---

## 3. Event Chain Rules

### Chain Depth

Events form chains when one event triggers an agent that emits another event. Chain depth tracks how deep we are in a causal chain.

```
traffic.heatmap.updated (depth 0)
  → MARKET_OPPORTUNITY_AGENT
    → market.opportunity.detected (depth 1)
      → TERRITORY_INTELLIGENCE_AGENT
        → territory.score.generated (depth 2)
      → INITIATIVE_AGENT
        → initiative.created (depth 3)
          → LANDING_PAGE_AGENT
            → landing_page.generated (depth 4)
          → EMAIL_AGENT
            → email_campaign.generated (depth 4)
          → CAMPAIGN_AGENT
            → campaign.sequence.launched (depth 5)
              → LEARNING_AGENT
                → initiative.review.scheduled (depth 6)
```

### Chain Rules

1. **Maximum depth:** 10. Events at depth 10 are processed but cannot emit further events.
2. **Correlation ID:** All events in a chain share the same `correlation_id`, set by the root event.
3. **Chain depth inheritance:** When an agent emits a new event, `chain_depth = parent_event.chain_depth + 1`.
4. **Parallel branches:** Multiple events at the same depth can execute concurrently (e.g., landing page + email + social at depth 4).
5. **Serialization:** Executive agent events within the same chain are serialized to prevent conflicting directives.

### Cooldown Rules

Each dispatch rule specifies a `cooldown_seconds` value. After an agent is triggered by an event type, it will not be re-triggered by the same event type until the cooldown expires. This prevents:
- Runaway loops where agent A triggers agent B which triggers agent A
- Redundant processing of rapid-fire events (e.g., multiple leads created in quick succession)

Cooldowns are scoped to `(brand_id, agent_name, event_type)`.

### Circuit Breaker Rules

1. If an agent fails 5 times within 1 hour, it is disabled until manual re-enable.
2. If the event queue exceeds 1000 pending items for a brand, new events for that brand are throttled.
3. If daily model cost exceeds the budget threshold, worker agents downgrade to the cheapest available tier.

---

## 4. Event Ordering and Delivery

### Ordering Guarantees
- Events within a single correlation chain are ordered by `chain_depth` and `timestamp`.
- Events across unrelated chains have no ordering guarantee and may execute concurrently.
- Within the same chain depth, events are processed in emission order.

### Delivery Guarantees
- Events are persisted to `agent_events` table before processing (at-least-once delivery).
- Event handlers must be idempotent — the same event may be processed more than once after a failure/retry.
- Failed events are retried up to 3 times with exponential backoff (1s, 4s, 16s).
- After 3 failures, the event is marked `failed` and an alert is sent to CEO_AGENT and the human operator.

### Event Lifecycle

```
CREATED → PENDING → PROCESSING → COMPLETED
                         ↓
                       FAILED → RETRY (1) → RETRY (2) → RETRY (3) → ESCALATED
```

---

## 5. Examples

### Example 1: Dallas Market Opportunity Chain

```json
[
  {
    "event_id": "evt_01H9X...",
    "event_type": "traffic.heatmap.updated",
    "brand_id": "skill-samurai",
    "source_agent": "SYSTEM",
    "correlation_id": "chain_dallas_001",
    "chain_depth": 0,
    "payload": {
      "regions_updated": ["Dallas", "Fort Worth", "Austin"],
      "data_source": "google_analytics",
      "period": "2026-03-01/2026-03-08"
    }
  },
  {
    "event_id": "evt_01H9Y...",
    "event_type": "market.opportunity.detected",
    "brand_id": "skill-samurai",
    "source_agent": "MARKET_OPPORTUNITY_AGENT",
    "correlation_id": "chain_dallas_001",
    "chain_depth": 1,
    "payload": {
      "region": "Dallas",
      "lat": 32.9483,
      "lng": -96.7299,
      "traffic_change": "+212%",
      "time_window": "14_days",
      "existing_franchise": false,
      "opportunity_score": 87,
      "signal_sources": ["search_volume", "lead_cluster"],
      "recommended_action": "Score territory and begin franchisee recruitment"
    }
  },
  {
    "event_id": "evt_01H9Z...",
    "event_type": "territory.score.generated",
    "brand_id": "skill-samurai",
    "source_agent": "TERRITORY_INTELLIGENCE_AGENT",
    "correlation_id": "chain_dallas_001",
    "chain_depth": 2,
    "payload": {
      "territory_id": "terr_dallas_north",
      "score": 81,
      "grade": "A",
      "recommendation": "Strong territory candidate."
    }
  },
  {
    "event_id": "evt_01HA0...",
    "event_type": "initiative.created",
    "brand_id": "skill-samurai",
    "source_agent": "INITIATIVE_AGENT",
    "correlation_id": "chain_dallas_001",
    "chain_depth": 3,
    "payload": {
      "initiative_id": "init_dallas_001",
      "type": "market_expansion",
      "title": "Dallas North Market Expansion",
      "territory_id": "terr_dallas_north",
      "gates_evaluated": {
        "registration": "passed",
        "territory": "passed",
        "strategy": "passed",
        "duplication": "passed",
        "confidence": "passed"
      },
      "review_date": "2026-03-22T00:00:00Z"
    }
  }
]
```

### Example 2: Lead Scored and Routed

```json
[
  {
    "event_id": "evt_02A...",
    "event_type": "lead.created",
    "brand_id": "skill-samurai",
    "source_agent": "SYSTEM",
    "correlation_id": "chain_lead_042",
    "chain_depth": 0,
    "payload": {
      "lead_id": "lead_042",
      "name": "Sarah Chen",
      "email": "sarah@example.com",
      "source": "website",
      "city": "Dallas",
      "state": "TX"
    }
  },
  {
    "event_id": "evt_02B...",
    "event_type": "lead.scored",
    "brand_id": "skill-samurai",
    "source_agent": "LEAD_INTELLIGENCE_AGENT",
    "correlation_id": "chain_lead_042",
    "chain_depth": 1,
    "payload": {
      "lead_id": "lead_042",
      "score": 85,
      "persona_match": 92,
      "signals": ["education_background", "prior_business_owner", "target_market"],
      "recommended_action": "Fast-track to discovery call"
    }
  },
  {
    "event_id": "evt_02C...",
    "event_type": "lead.routed",
    "brand_id": "skill-samurai",
    "source_agent": "LEAD_INTELLIGENCE_AGENT",
    "correlation_id": "chain_lead_042",
    "chain_depth": 1,
    "payload": {
      "lead_id": "lead_042",
      "route_to": "discovery_call",
      "reason": "High persona match (92%) with education background and business ownership experience",
      "priority": "high"
    }
  }
]
```

### Example 3: Initiative Blocked by Registration Gate

```json
[
  {
    "event_id": "evt_03A...",
    "event_type": "market.opportunity.detected",
    "brand_id": "skill-samurai",
    "source_agent": "MARKET_OPPORTUNITY_AGENT",
    "correlation_id": "chain_ca_001",
    "chain_depth": 1,
    "payload": {
      "region": "Los Angeles",
      "state": "CA",
      "opportunity_score": 78,
      "existing_franchise": false
    }
  },
  {
    "event_id": "evt_03B...",
    "event_type": "initiative.blocked",
    "brand_id": "skill-samurai",
    "source_agent": "INITIATIVE_AGENT",
    "correlation_id": "chain_ca_001",
    "chain_depth": 2,
    "payload": {
      "blocked_by_gate": "registration",
      "reason": "Brand is not registered in California. State is listed in restricted_states.",
      "alternative_action": "Created readiness initiative. Zor notified to review California filing.",
      "notification_sent": true
    }
  }
]
```
