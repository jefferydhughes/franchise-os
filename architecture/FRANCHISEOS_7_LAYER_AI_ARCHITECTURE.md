# FranchiseOS — 7-Layer AI Architecture

## Overview

FranchiseOS is an AI-first operating system for franchisors. The architecture inverts the traditional software stack: instead of UI → Business Logic → Database with AI bolted on, the system is built so **AI agents run the business** and the UI lets humans observe and intervene.

```
Traditional:                    FranchiseOS:
  Database                        Data Layer (Supabase/Postgres)
     ↓                                ↓
  Business Logic                  Event Bus
     ↓                                ↓
  UI                              AI Agent Swarm
     ↓                                ↓
  AI Plugin                       Tools & Automations
                                      ↓
                                  Client Layer (Mobile/Web/Chat)
```

---

## Layer 1: Data Layer

**Purpose:** Single source of truth for all franchise system state.

**Technology:**
- Supabase (hosted Postgres)
- pgvector for embedding storage and similarity search
- Row-level security for multi-brand tenant isolation

**Core Tables:**
| Table | Description |
|-------|-------------|
| `leads` | Inbound and scraped prospect records |
| `candidates` | Qualified franchise buyer prospects |
| `franchisees` | Active franchise operators |
| `units` | Individual franchise locations |
| `territories` | Geographic territory definitions and status |
| `campaigns` | Marketing campaign records |
| `payments` | Royalty and fee transactions |
| `contracts` | Franchise agreement records |
| `training` | Operator training progress |
| `initiatives` | Swarm-created growth initiatives |
| `events` | System event log |

**Data Rules:**
- Agents never write to the database directly
- All mutations go through the Tools layer
- Every table mutation emits an event to the Event Bus
- All data is scoped to a `brand_id` for multi-tenant isolation

---

## Layer 2: Event Bus

**Purpose:** The nervous system of FranchiseOS. All actions create events. Agents subscribe to events and react.

**Technology:**
- Supabase Realtime (WebSocket-based pub/sub)
- Edge Functions for event handlers
- Serverless queue (for durable, ordered processing)

**Core Event Categories:**

| Category | Events |
|----------|--------|
| **Lead** | `lead.created`, `lead.replied`, `lead.scored`, `lead.routed` |
| **Sales** | `candidate.scored`, `discovery.call.booked`, `proposal.requested`, `franchise.sold` |
| **Territory** | `territory.score.generated`, `territory.priority.increased`, `territory.conflict.detected` |
| **Marketing** | `campaign.created`, `campaign.sequence.launched`, `landing_page.requested`, `landing_page.generated` |
| **Operations** | `onboarding.started`, `training.completed`, `unit.performance_drop`, `coaching.plan.generated` |
| **Finance** | `payment.received`, `royalty.calculated`, `invoice.generated` |
| **Intelligence** | `traffic.heatmap.updated`, `market.opportunity.detected`, `pattern.detected`, `learning.captured` |
| **Initiatives** | `initiative.recommended`, `initiative.created`, `initiative.review.scheduled` |

**Event Payload Standard:**
```json
{
  "event_type": "market.opportunity.detected",
  "brand_id": "skill-samurai",
  "timestamp": "2026-03-08T10:08:00Z",
  "source_agent": "MARKET_OPPORTUNITY_AGENT",
  "payload": {
    "region": "Dallas",
    "traffic_change": "+212%",
    "time_window": "14_days",
    "existing_franchise": false,
    "opportunity_score": 87
  }
}
```

**Rules:**
- Every event must include `event_type`, `brand_id`, `timestamp`, `source_agent`
- Agents subscribe declaratively — no polling
- Events are immutable once emitted
- Event handlers must be idempotent

---

## Layer 3: AI Agent Swarm

**Purpose:** The workforce. Agents reason, retrieve memory, call tools, and emit new events. They replace traditional business logic modules.

**Technology:**
- OpenCode runtime (provider-agnostic agent execution)
- OpenClaw model router (routes agents to optimal LLM by tier)
- Markdown-based agent definitions (`swarm/agents/*.md`)

**Agent Tiers:**

### Tier 1 — Executive Agents (Claude Sonnet/Opus)
Strategic oversight. Run infrequently, reason deeply.

| Agent | Responsibility |
|-------|---------------|
| `CEO_AGENT` | System-wide strategic oversight, growth priorities |
| `CRO_AGENT` | Revenue leadership, franchise sales pipeline |
| `COO_AGENT` | Operations leadership, onboarding, compliance |
| `CMO_AGENT` | Marketing direction, campaign strategy, brand alignment |

### Tier 2 — Department Agents (Gemini Pro / GPT-4o-mini / Mistral)
Operational reasoning. Run frequently, moderate cost.

| Agent | Responsibility |
|-------|---------------|
| `MARKET_OPPORTUNITY_AGENT` | Detect geographic demand signals |
| `TERRITORY_INTELLIGENCE_AGENT` | Territory scoring and expansion planning |
| `LEAD_INTELLIGENCE_AGENT` | Lead scoring and routing |
| `SALES_PIPELINE_AGENT` | Move candidates through the funnel |
| `CAMPAIGN_AGENT` | Orchestrate multi-channel campaigns |
| `CONTENT_STRATEGY_AGENT` | Determine content themes and messaging |
| `ONBOARDING_AGENT` | New franchise activation sequences |
| `COACHING_AGENT` | Franchisee performance monitoring |

### Tier 3 — Memory & Learning Agents
Compounding intelligence. These make the system smarter over time.

| Agent | Responsibility |
|-------|---------------|
| `MEMORY_CURATOR_AGENT` | Maintain and compress system memory |
| `PATTERN_DETECTION_AGENT` | Find cross-system patterns and anomalies |
| `LEARNING_AGENT` | Score outcomes, update playbooks |

### Tier 4 — Worker Agents (Gemini Flash / DeepSeek / Local)
Narrow execution. Cheap, fast, high-volume.

| Agent | Responsibility |
|-------|---------------|
| `LANDING_PAGE_AGENT` | Generate localized franchise recruitment pages |
| `EMAIL_AGENT` | Write outreach and nurture sequences |
| `SOCIAL_CONTENT_AGENT` | Create local and brand-aligned social campaigns |
| `REPORT_AGENT` | Generate executive and operational reports |
| `INITIATIVE_AGENT` | Convert insights into coordinated action plans |

**Agent Execution Rules:**
1. Subscribe to specific events
2. Retrieve context from memory
3. Perform reasoning
4. Call tools (never write to DB directly)
5. Emit new events

**Agent Constraints:**
- No agent modifies data directly — all changes go through tools
- No unlimited recursive loops — max event chain depth of 10
- No duplicate active initiatives — check before creating
- All decisions must be logged to `memory/decision-log/`

---

## Layer 4: Tools & Automations

**Purpose:** The hands of the system. Tools encapsulate database writes, external API calls, and side effects. Agents call tools; tools execute.

**Technology:**
- TypeScript Edge Functions (Supabase)
- n8n for complex automation workflows
- Serverless workers for background jobs

**Tool Categories:**

| Tool | Functions |
|------|-----------|
| **CRM** | `crm.create_lead()`, `crm.update_candidate()`, `crm.get_pipeline()` |
| **Territory** | `territory.get_status()`, `territory.score()`, `territory.check_conflicts()` |
| **Marketing** | `marketing.create_campaign()`, `marketing.get_performance()` |
| **Documents** | `document.generate_landing_page()`, `document.generate_proposal()` |
| **Email** | `email.generate_sequence()`, `email.send()` |
| **Payments** | `payments.calculate_royalty()`, `payments.split_payment()` |
| **Analytics** | `analytics.get_traffic_by_region()`, `analytics.get_campaign_performance()` |
| **Memory** | `memory.retrieve_market_context()`, `memory.retrieve_campaign_history()`, `memory.write_learning_record()` |
| **Initiative** | `initiative.create()`, `initiative.check_duplicates()`, `initiative.schedule_review()` |

**Tool Rules:**
- Every tool call is logged
- Every database write emits an event
- Tools validate inputs before execution
- Tools are brand-scoped via `brand_id`

---

## Layer 5: Client Layer

**Purpose:** The window into the system. Humans observe, intervene, and command. Most interaction is through AI chat.

**Technology:**
- Next.js (web dashboard)
- React Native (mobile app)
- Tailwind CSS
- AI Chat Interface (natural language command bar)

**Interfaces:**

### War Room Dashboard
The CEO command center. Six core widgets:
1. **Opportunity Radar** — emerging territory opportunities
2. **Territory Heatmap** — map overlay with traffic, leads, coverage
3. **Initiative Board** — kanban of swarm-driven growth initiatives
4. **Swarm Activity Feed** — real-time stream of agent actions
5. **AI Command Bar** — natural language queries to the system
6. **Memory Intelligence Widget** — what the system has learned

### Mobile App
Simplified daily briefing:
- Today's activity summary
- New leads and candidates
- AI suggestions and recommendations
- Quick approve/reject for initiatives

### AI Chat Interface
Primary interaction model:
```
"Where should we sell the next franchise?"
"Which cities are heating up?"
"Launch a teacher recruitment campaign in Texas."
"Show me underperforming units."
```

---

## Layer 6: Memory Layer

**Purpose:** Persistent intelligence that compounds over time. Agents query memory before acting.

**Structure:**
```
memory/
├── episodic/       # Short-term: what just happened (traffic spikes, recent campaigns)
├── semantic/       # Long-term: proven business knowledge (what works)
├── strategic/      # Current priorities and executive directives
├── brand/          # Brand-specific voice, positioning, offers
├── market/         # Per-city/region intelligence files
├── campaign/       # Campaign results and experiments
├── franchisee/     # Operator-level knowledge and coaching notes
├── territory/      # Territory status, history, fit scores
├── decision-log/   # Why actions were taken, what happened after
└── retrieval/      # Retrieval functions for controlled memory access
```

**Memory Rules:**
- Agents must query market, territory, and campaign memory before launching initiatives
- Raw events are compressed into summaries by the Memory Curator
- Repeated wins are promoted to semantic memory
- Failed strategies are flagged and downgraded
- Decision logs include evidence, reasoning, and outcome tracking

---

## Layer 7: Model Routing Layer (OpenClaw)

**Purpose:** Route each agent to the optimal LLM based on task complexity and cost.

**Technology:**
- OpenClaw model router
- BYOK API keys for all providers

**Routing Strategy:**

| Tier | Models | Use Case | % of Calls | Cost/Day |
|------|--------|----------|-----------|----------|
| Strategic | Claude Sonnet/Opus | Executive reasoning, pattern analysis | ~10% | ~$5-15 |
| Operational | Gemini Pro, GPT-4o-mini, Mistral | Department operations, territory scoring | ~40% | ~$5-15 |
| Worker | Gemini Flash, DeepSeek, Local Llama | Content generation, reports, emails | ~50% | ~$5-10 |

**Routing Logic:**
1. Cheap models detect signals and do initial processing
2. Claude analyzes when something interesting is found
3. Worker models execute the resulting tasks

**Target operational cost:** $450–$1,200/month for a 20-agent swarm running 800 calls/day.

---

## Data Flow: Dallas Opportunity Example

```
analytics data arrives
    ↓
[Event Bus] traffic.heatmap.updated
    ↓
[Agent] MARKET_OPPORTUNITY_AGENT
    → queries memory/market/dallas.json
    → queries memory/territory/
    → queries memory/campaign/
    → detects: rising traffic + no franchise + similar to Phoenix
    ↓
[Event Bus] market.opportunity.detected
    ↓
[Agent] TERRITORY_INTELLIGENCE_AGENT
    → calls territory.score("Dallas")
    → emits territory.score.generated
    ↓
[Agent] INITIATIVE_AGENT
    → checks for duplicate initiatives
    → calls initiative.create()
    → emits initiative.created
    ↓
[Agents in parallel]
    LANDING_PAGE_AGENT → document.generate_landing_page()
    EMAIL_AGENT → email.generate_sequence()
    SOCIAL_CONTENT_AGENT → creates local post series
    CAMPAIGN_AGENT → campaign.create()
    ↓
[Event Bus] campaign.sequence.launched
    ↓
[Agent] LEARNING_AGENT → schedules 14-day review
[Agent] REPORT_AGENT → updates CEO dashboard
```

---

## White-Label Architecture

Everything brand-specific lives in swappable folders:

```
brands/
├── skill-samurai/
│   ├── brand.json
│   ├── brand_voice.md
│   ├── ideal_franchisee.md
│   ├── marketing_playbook.md
│   ├── territory_rules.json
│   └── royalty_rules.json
├── beakid/
└── upward-sports/
```

Swap the brand folder → the entire system adapts: voice, offers, territory rules, royalty splits, campaign themes.
