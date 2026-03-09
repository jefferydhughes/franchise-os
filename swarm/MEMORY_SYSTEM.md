# FranchiseOS — Memory System Specification

## Overview

The Memory System is a 9-layer persistent intelligence architecture that allows FranchiseOS agents to accumulate, retrieve, and compound knowledge over time. Instead of treating each agent invocation as stateless, the memory system gives agents access to what happened before, what worked, what failed, and what the current strategic priorities are.

The memory system answers: **What does this brand know, and how does it learn?**

---

## 1. Architecture

All memory is stored in the `memory_entries` Supabase table. Each record belongs to exactly one of nine layers, is scoped to a `brand_id`, and carries structured metadata for retrieval.

```
memory_entries
├── episodic/       Short-term: what just happened
├── semantic/       Long-term: proven business knowledge
├── strategic/      Current priorities and executive directives
├── brand/          Brand-specific voice, positioning, offers
├── market/         Per-city/region intelligence
├── campaign/       Campaign results and experiments
├── franchisee/     Operator-level knowledge and coaching notes
├── territory/      Territory status, history, fit scores
└── decision-log/   Why actions were taken, what happened after
```

### Table Schema

```sql
create table public.memory_entries (
  id uuid primary key default extensions.uuid_generate_v4(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  layer text not null
    check (layer in ('episodic','semantic','strategic','brand','market',
                     'campaign','franchisee','territory','decision-log')),
  title text,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  embedding_text text,
  status text not null default 'active'
    check (status in ('active','archived','superseded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## 2. Layer Definitions

### 2.1 Episodic Memory

**Purpose:** Short-term record of what just happened in the system. Raw agent outputs, recent events, and in-progress workflows.

**Data structure:**
```typescript
{
  layer: 'episodic',
  title: 'Market Opportunity Detected — Dallas',
  content: 'MARKET_OPPORTUNITY_AGENT detected +212% traffic increase in Dallas...',
  metadata: {
    event_type: 'market.opportunity.detected',
    correlation_id: 'chain_dallas_001',
    agent: 'MARKET_OPPORTUNITY_AGENT',
    region: 'Dallas',
    timestamp: '2026-03-08T10:00:00Z',
    ttl_days: 30
  }
}
```

**Retention policy:**
- Active for 30 days by default
- After 30 days: reviewed by Memory Curator for promotion or archival
- High-value episodic memories are promoted to semantic or market layers
- Low-value entries are archived (status = 'archived')

**Retrieval patterns:**
- Query by `event_type` and `correlation_id` for chain context
- Query by `region` for geographic context loading
- Query by `agent` for agent self-reference (what did I do last time?)
- Time-ordered retrieval for recent activity summaries

**Promotion rules:**
- If an episodic memory is referenced by 3+ agents in subsequent decisions, promote to semantic
- If an episodic memory describes a successful pattern, Memory Curator promotes to semantic
- If it describes a market insight, promote to market layer

**Demotion rules:**
- Episodic memories older than 30 days with no references are archived
- Episodic memories superseded by newer information are marked `superseded`

---

### 2.2 Semantic Memory

**Purpose:** Long-term proven knowledge. Facts, patterns, and insights that have been validated through repeated success. This is the institutional knowledge layer.

**Data structure:**
```typescript
{
  layer: 'semantic',
  title: 'Teacher-Persona Leads Convert 3x Better in Suburban Markets',
  content: 'Analysis across 12 territories shows that leads matching the teacher persona...',
  metadata: {
    pattern_type: 'conversion_insight',
    confidence: 0.89,
    supporting_evidence_count: 12,
    first_observed: '2026-01-15',
    last_confirmed: '2026-03-01',
    source_agent: 'PATTERN_DETECTION_AGENT',
    tags: ['conversion', 'persona', 'suburban']
  }
}
```

**Retention policy:**
- Permanent unless explicitly superseded or confidence drops below 0.5
- Reviewed quarterly by Memory Curator for continued validity
- Confidence score updated as new evidence confirms or contradicts

**Retrieval patterns:**
- Keyword and tag-based search for relevant knowledge
- Vector similarity search (when embeddings are enabled)
- Query by `pattern_type` for specific insight categories
- Confidence-weighted retrieval: higher-confidence memories rank first

**Promotion rules:**
- Semantic memories with confidence above 0.95 and 20+ evidence points become foundational knowledge (never auto-archived)

**Demotion rules:**
- If contradicting evidence reduces confidence below 0.5, demote to archived
- Memory Curator flags entries where supporting evidence is older than 6 months without reconfirmation

---

### 2.3 Strategic Memory

**Purpose:** Current priorities, directives, and strategic context. What the leadership (human or CEO_AGENT) has decided the brand should focus on.

**Data structure:**
```typescript
{
  layer: 'strategic',
  title: 'Q1 2026 Growth Priority: Southeast Expansion',
  content: 'CEO directive: prioritize Florida, Georgia, and Texas for franchise recruitment...',
  metadata: {
    directive_type: 'growth_priority',
    issued_by: 'CEO_AGENT',
    effective_date: '2026-01-01',
    expiry_date: '2026-03-31',
    priority_regions: ['Southeast', 'Texas'],
    priority_states: ['FL', 'GA', 'TX'],
    status: 'active'
  }
}
```

**Retention policy:**
- Active until expiry date or explicit supersession
- Expired directives archived automatically
- Historical directives retained for decision-log cross-reference

**Retrieval patterns:**
- All active strategic memories loaded as context for executive agents
- Filtered by `directive_type` for specific strategic questions
- Time-bounded retrieval for current quarter priorities

**Promotion rules:**
- N/A — strategic memories originate from executive directives, not from promotion

**Demotion rules:**
- Expired directives move to archived status
- Superseded directives marked `superseded` with reference to replacement

---

### 2.4 Brand Memory

**Purpose:** Brand-specific voice, positioning, offers, and identity. Loaded from `brands/{slug}/` config files and enriched by agent interactions.

**Data structure:**
```typescript
{
  layer: 'brand',
  title: 'Skill Samurai — Brand Voice Guidelines',
  content: 'Professional, empowering, education-focused. Emphasize STEM education...',
  metadata: {
    brand_slug: 'skill-samurai',
    source_file: 'brands/skill-samurai/brand_voice.md',
    content_type: 'voice_guidelines',
    last_synced: '2026-03-01'
  }
}
```

**Retention policy:**
- Permanent — updated when source files change
- Synced from brand config files on brand load/update

**Retrieval patterns:**
- Loaded by every agent that generates brand-facing content
- Filtered by `content_type`: voice_guidelines, ideal_franchisee, marketing_playbook, territory_rules

**Promotion/demotion rules:**
- N/A — brand memory is authoritative and comes from config files

---

### 2.5 Market Memory

**Purpose:** Per-city and per-region intelligence. What the system knows about specific geographic markets.

**Data structure:**
```typescript
{
  layer: 'market',
  title: 'Dallas Market Intelligence',
  content: 'Dallas North territory scored 81/100 (Grade A). Population 92,000, median income $78,000...',
  metadata: {
    city: 'Dallas',
    state: 'TX',
    region: 'Texas',
    lat: 32.9483,
    lng: -96.7299,
    last_scored: '2026-03-08',
    opportunity_score: 87,
    competitive_landscape: 'moderate',
    demand_trend: 'rising'
  }
}
```

**Retention policy:**
- Active indefinitely; updated as new data arrives
- Market summaries refreshed after each territory scoring or radar scan
- Stale market data (not updated in 90 days) flagged for re-evaluation

**Retrieval patterns:**
- Query by `city`, `state`, or `region` for geographic context
- Query by `demand_trend` to find rising/falling markets
- Loaded by MARKET_OPPORTUNITY_AGENT and TERRITORY_INTELLIGENCE_AGENT before analysis

**Promotion rules:**
- Episodic market events are compressed into market memory summaries by Memory Curator
- Consistent demand signals across multiple scans strengthen the market record

**Demotion rules:**
- Markets with no activity for 6+ months are flagged as stale (not archived, but deprioritized)

---

### 2.6 Campaign Memory

**Purpose:** Campaign results, experiments, and what worked or failed in marketing.

**Data structure:**
```typescript
{
  layer: 'campaign',
  title: 'Dallas Teacher Recruitment Email Campaign — Results',
  content: 'Email sequence targeting teacher persona in Dallas. 5 emails over 14 days...',
  metadata: {
    campaign_id: 'camp_dallas_001',
    initiative_id: 'init_dallas_001',
    territory_id: 'terr_dallas_north',
    channels: ['email'],
    target_persona: 'teacher',
    metrics: {
      emails_sent: 450,
      open_rate: 0.34,
      click_rate: 0.12,
      leads_generated: 8,
      conversions: 2
    },
    outcome: 'win',
    lessons_learned: ['Teacher persona responds well to STEM success stories', 'Subject lines with local school names improve open rates']
  }
}
```

**Retention policy:**
- Permanent — campaign history is essential for learning
- Outcome and metrics updated after review periods

**Retrieval patterns:**
- Query by `target_persona`, `channels`, `territory_id` for similar campaign history
- Query by `outcome` to find winning vs. losing campaigns
- Loaded by CAMPAIGN_AGENT and CONTENT_STRATEGY_AGENT before new campaign creation

**Promotion rules:**
- Winning campaign patterns are promoted to semantic memory as proven strategies
- Campaign lessons_learned are cross-referenced by Learning Agent

**Demotion rules:**
- Campaigns older than 12 months without reconfirmation have reduced retrieval priority

---

### 2.7 Franchisee Memory

**Purpose:** Operator-level knowledge. Performance history, coaching notes, communication preferences, and relationship context.

**Data structure:**
```typescript
{
  layer: 'franchisee',
  title: 'Unit 114 — Performance Notes',
  content: 'Franchisee John Smith, Dallas North territory. Strong start Q4 2025...',
  metadata: {
    franchisee_id: 'fran_114',
    territory_id: 'terr_dallas_north',
    unit_number: '114',
    performance_trend: 'declining',
    last_coaching_date: '2026-02-15',
    coaching_notes: ['Needs help with local marketing', 'Responsive to direct feedback'],
    communication_preference: 'slack',
    risk_level: 'medium'
  }
}
```

**Retention policy:**
- Active while franchisee is active or at_risk
- Archived when franchisee status changes to churned
- Historical records retained for pattern detection across franchisee cohorts

**Retrieval patterns:**
- Query by `franchisee_id` or `territory_id` for operator context
- Query by `risk_level` for at-risk franchisee identification
- Loaded by COACHING_AGENT and ONBOARDING_AGENT before interactions

**Promotion rules:**
- Successful franchisee patterns (e.g., "owners with teaching background outperform by 20%") promoted to semantic memory

**Demotion rules:**
- Franchisee records for churned operators archived after 6 months

---

### 2.8 Territory Memory

**Purpose:** Territory-level history. Scoring history, assignment changes, performance over time.

**Data structure:**
```typescript
{
  layer: 'territory',
  title: 'Dallas North — Territory History',
  content: 'Territory scored 81/100 on 2026-03-08. Previously scored 74/100 on 2026-01-15...',
  metadata: {
    territory_id: 'terr_dallas_north',
    current_score: 81,
    previous_score: 74,
    score_trend: 'improving',
    status: 'open',
    assignment_history: [],
    scoring_history: [
      { date: '2026-01-15', score: 74, grade: 'B' },
      { date: '2026-03-08', score: 81, grade: 'A' }
    ]
  }
}
```

**Retention policy:**
- Permanent — territory history is essential for trend analysis
- Updated after every territory scoring run

**Retrieval patterns:**
- Query by `territory_id` for territory context
- Query by `score_trend` to find improving/declining territories
- Query by `status` for available territories

**Promotion rules:**
- Territory patterns (e.g., "territories near universities score higher") promoted to semantic memory

**Demotion rules:**
- N/A — territory memory is historical record, always retained

---

### 2.9 Decision Log

**Purpose:** Why actions were taken, what the reasoning was, and what happened after. The audit trail of AI decision-making.

**Data structure:**
```typescript
{
  layer: 'decision-log',
  title: 'Decision: Launch Dallas Expansion Initiative',
  content: 'Decision: Launch market expansion initiative for Dallas North...',
  metadata: {
    agent: 'INITIATIVE_AGENT',
    trigger_event: 'market.opportunity.detected',
    correlation_id: 'chain_dallas_001',
    decision: 'launch_expansion',
    alternatives_considered: ['watch_and_wait', 'research_only'],
    confidence: 0.87,
    rationale: 'Score 81/100, strategy aligned, territory available, no duplicates',
    gates_passed: ['registration', 'territory', 'strategy', 'duplication', 'confidence'],
    outcome: null,
    outcome_evaluated_at: null
  }
}
```

**Retention policy:**
- Permanent — decision logs are the accountability record
- Outcome field updated after initiative review
- Never archived or deleted

**Retrieval patterns:**
- Query by `agent` to review an agent's decision history
- Query by `correlation_id` to trace full decision chain
- Query by `outcome` to find successful vs. unsuccessful decisions
- Time-ordered retrieval for recent decision review

**Promotion rules:**
- Decisions with successful outcomes feed the Learning Agent
- Patterns across decisions promoted to semantic memory

**Demotion rules:**
- N/A — decision logs are immutable records

---

## 3. Memory Operations

### Core Functions

```typescript
// Store a memory record
storeMemory(brandId: string, layer: MemoryLayer, content: string, metadata?: Record<string, unknown>): Promise<MemoryRecord>

// Retrieve memories by layer with optional text query
retrieveMemory(brandId: string, layer: MemoryLayer, query?: string, limit?: number): Promise<MemoryRecord[]>

// Search similar memories across all layers using vector similarity
searchSimilarMemories(brandId: string, embedding: number[], threshold?: number): Promise<SimilarMemoryResult[]>

// Log a decision with structured metadata
logDecision(brandId: string, decision: string, context: DecisionContext): Promise<MemoryRecord>

// Store a strategic insight
storeStrategicInsight(brandId: string, insight: string, source: AgentSource): Promise<MemoryRecord>
```

### Memory Context Loading

Before every agent execution, the swarm controller loads relevant memory context:

```typescript
async function loadAgentContext(agentName: string, event: EventEnvelope): Promise<MemoryContext> {
  const brandId = event.brand_id;

  return {
    // Always loaded
    strategic: await retrieveMemory(brandId, 'strategic', null, 5),
    brand: await retrieveMemory(brandId, 'brand', null, 5),

    // Loaded based on event type
    market: event.payload.region
      ? await retrieveMemory(brandId, 'market', event.payload.region, 5)
      : [],
    territory: event.payload.territory_id
      ? await retrieveMemory(brandId, 'territory', event.payload.territory_id, 3)
      : [],
    campaign: ['campaign', 'marketing'].some(k => event.event_type.includes(k))
      ? await retrieveMemory(brandId, 'campaign', null, 5)
      : [],
    franchisee: event.payload.franchisee_id
      ? await retrieveMemory(brandId, 'franchisee', event.payload.franchisee_id, 3)
      : [],

    // Recent activity context
    episodic: await retrieveMemory(brandId, 'episodic', null, 10),

    // Relevant past decisions
    decisions: await retrieveMemory(brandId, 'decision-log', event.event_type, 3),

    // Proven knowledge
    semantic: await retrieveMemory(brandId, 'semantic', event.event_type, 5),
  };
}
```

---

## 4. Memory Curator Agent Integration

The MEMORY_CURATOR_AGENT is responsible for maintaining memory health:

### Scheduled Tasks

1. **Daily compression** — Review episodic memories older than 7 days. Compress clusters of related events into single summary entries.
2. **Weekly promotion review** — Identify episodic memories referenced by multiple agents and promote to appropriate long-term layers.
3. **Monthly staleness check** — Flag market and territory memories not updated in 90+ days.
4. **Quarterly semantic review** — Validate semantic memory entries still hold true based on recent evidence.

### Triggered Tasks

- **On `pattern.detected`:** Evaluate whether the pattern should be stored as semantic memory.
- **On `learning.captured`:** Update relevant campaign and market memories with new outcomes.
- **On `weekly.system.summary.generated`:** Compress the week's episodic activity into summary records.

### Compression Rules

When compressing episodic memories:
1. Group by `correlation_id` — all events in a chain become one summary
2. Extract key outcomes and metrics
3. Preserve the decision rationale
4. Discard intermediate processing steps
5. Link the compressed summary to the original episodic entries via metadata

---

## 5. Learning Agent Integration

The LEARNING_AGENT uses the memory system to close the feedback loop:

### Learning Workflow

1. `initiative.review.scheduled` fires after an initiative has been running for 14 days
2. Learning Agent retrieves:
   - Original initiative from decision-log
   - Campaign metrics from campaign memory
   - Territory performance changes
   - Lead volume changes in the target area
3. Learning Agent compares baseline vs. post-action metrics
4. Learning Agent scores the initiative outcome: `win`, `mixed`, or `loss`
5. Learning Agent stores:
   - Updated decision-log entry with outcome
   - Campaign memory with lessons learned
   - If pattern detected: semantic memory with the proven/disproven strategy

### Learning Output Events

- `learning.captured` — new learning recorded
- `playbook.updated` — marketing playbook adjusted based on evidence
- `strategy.recommended` — strategic recommendation based on accumulated learnings

---

## 6. Retrieval Strategy

### Phase 1: Text-Based (Current)

```sql
-- match_memories RPC function
select * from memory_entries
where brand_id = $1
  and status = 'active'
  and (layer = $2 or $2 is null)
  and (content ilike '%' || $3 || '%' or $3 is null)
order by created_at desc
limit $4;
```

### Phase 2: Vector Similarity (Planned)

```sql
-- pgvector cosine similarity search
select *, 1 - (embedding <=> $query_embedding) as similarity
from memory_entries
where brand_id = $1
  and status = 'active'
  and 1 - (embedding <=> $query_embedding) > $threshold
order by similarity desc
limit $4;
```

### Retrieval Priorities

When multiple memories are returned, they are ranked by:
1. **Relevance** — similarity score (vector) or keyword match count (text)
2. **Recency** — newer memories rank higher for episodic and market layers
3. **Confidence** — higher confidence memories rank higher for semantic layer
4. **Layer priority** — strategic and brand always rank above episodic

### Context Window Budget

Each agent has a bounded context window. Memory retrieval is selective:
- Executive agents: up to 50 memory entries
- Department agents: up to 30 memory entries
- Worker agents: up to 15 memory entries
- Memory/Learning agents: up to 100 memory entries (they need broad context)
