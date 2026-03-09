# FranchiseOS — Build Phases by Layer

## Overview

This document defines the build sequence for FranchiseOS, ordered by layer priority. Each phase builds on the foundation of the previous one. The guiding principle is: **data before events, events before agents, agents before UI.**

---

## Phase 1: Foundation

**Focus:** Data Layer + Event Bus basics
**Layers touched:** L1 (Data), L2 (Event Bus)
**Duration estimate:** 2-3 weeks
**Complexity:** Medium

### Key Deliverables

1. **Supabase schema finalized and migrated**
   - All core tables: brands, territories, franchisees, leads, initiatives, agent_events, memory_entries, campaigns
   - Row-level security policies for multi-brand isolation
   - Indexes optimized for common query patterns
   - `match_memories` RPC function for text-based memory search

2. **Brand configuration system**
   - `brand-loader.ts` — loads brand config from `brands/` directory
   - `config-validator.ts` — validates brand JSON against schema
   - Seed data for at least two brands (example-brand, skill-samurai)

3. **Event bus foundation**
   - Event envelope schema defined and validated
   - `agent_events` table as durable event store
   - Supabase Realtime channels configured per brand
   - Basic event emission utility function

4. **Environment and deployment**
   - Supabase project linked and migrations applied
   - Vercel project configured with environment variables
   - Local development environment documented in SETUP.md

### Dependencies
- Supabase project provisioned
- Clerk application configured
- Vercel project created

### Exit Criteria
- All tables exist with RLS policies
- Brand config loads correctly for both seed brands
- Events can be written to and read from `agent_events`
- Dashboard app deploys to Vercel (even if widgets show placeholder data)

---

## Phase 2: Intelligence

**Focus:** Agent Swarm + Memory Layer
**Layers touched:** L3 (Agent Swarm), L6 (Memory), L7 (Model Routing)
**Duration estimate:** 3-4 weeks
**Complexity:** High

### Key Deliverables

1. **Swarm controller**
   - `start-swarm.ts` event loop: poll `agent_events` for pending events, match dispatch rules, execute agents
   - Dispatch rules engine: load `dispatch-rules.json`, evaluate preconditions, respect cooldowns
   - Agent lifecycle management: IDLE to TRIGGERED to EXECUTING to COMPLETED/FAILED
   - Chain depth enforcement (max 10)
   - Concurrency limiter (max 10 agents per brand)

2. **Agent execution pipeline**
   - `executeAgent(agentName, event, brandContext)` function
   - Load agent persona from `swarm/agents/{agent}.md`
   - Load relevant memory context for the agent
   - Call Claude API with persona + context + event payload
   - Parse agent output for events to emit and tools to call
   - Log execution to `agent_events` with duration, model used, result

3. **Model routing (OpenClaw)**
   - `model-router.ts` — resolve model by tier (strategic/operational/worker)
   - Environment variable overrides: MODEL_STRATEGIC, MODEL_OPERATIONAL, MODEL_WORKER
   - Keyword-based routing for ad-hoc requests
   - Cost logging per invocation

4. **Memory system**
   - 9-layer memory architecture operational
   - `storeMemory()`, `retrieveMemory()`, `searchSimilarMemories()` functions
   - `logDecision()` for decision-log entries
   - Text-based search (phase 1); vector embeddings deferred to Phase 5
   - Memory Curator Agent compresses raw events into summaries

5. **Core agents operational (minimum viable set)**
   - MARKET_OPPORTUNITY_AGENT — detects geographic demand signals
   - TERRITORY_INTELLIGENCE_AGENT — scores territories on demand
   - INITIATIVE_AGENT — creates initiatives from opportunities
   - LEAD_INTELLIGENCE_AGENT — scores and routes incoming leads
   - REPORT_AGENT — generates daily system summaries

### Dependencies
- Phase 1 complete (data layer, event bus)
- Anthropic API key configured
- Agent persona markdown files written

### Exit Criteria
- Event loop processes pending events and dispatches to correct agents
- Agents execute against Claude API and emit output events
- Memory can be stored and retrieved by layer
- At least one end-to-end flow works: `traffic.heatmap.updated` triggers market opportunity detection, territory scoring, and initiative creation

---

## Phase 3: Execution

**Focus:** Tools & Automations
**Layers touched:** L4 (Tools), L2 (Event Bus — tool-emitted events)
**Duration estimate:** 2-3 weeks
**Complexity:** Medium

### Key Deliverables

1. **CRM tools**
   - `crm.create_lead()` — insert lead record, emit `lead.created`
   - `crm.update_candidate()` — update candidate status, emit stage-change event
   - `crm.get_pipeline()` — return pipeline summary for a brand

2. **Territory tools**
   - `territory.score()` — invoke territory-scorer.ts, persist result
   - `territory.get_status()` — return territory status and assignment
   - `territory.check_conflicts()` — detect overlap with existing territories

3. **Marketing tools**
   - `marketing.create_campaign()` — create campaign record, emit `campaign.created`
   - `marketing.get_performance()` — return campaign metrics

4. **Document generation tools**
   - `document.generate_landing_page()` — generate franchise recruitment page
   - `document.generate_proposal()` — generate territory proposal document

5. **Email tools**
   - `email.generate_sequence()` — create multi-step email sequence
   - `email.send()` — send email via provider (SendGrid, Resend, etc.)

6. **Initiative tools**
   - `initiative.create()` — create initiative record with gates evaluated
   - `initiative.check_duplicates()` — find existing initiatives for same market
   - `initiative.schedule_review()` — set review_at timestamp

7. **Messaging gateways connected**
   - Slack gateway sends notifications for high-priority events
   - SMS gateway sends alerts for critical opportunities
   - WhatsApp gateway stubbed for future activation

### Dependencies
- Phase 2 complete (agents can call tools)
- External API credentials: SendGrid/Resend, Twilio (optional)

### Exit Criteria
- Agents call tools and tools mutate the database correctly
- Every tool call emits the appropriate event
- Tool calls are logged in `agent_events` with duration and result
- Messaging gateways deliver notifications for critical events

---

## Phase 4: Interface

**Focus:** Client Layer + War Room Dashboard
**Layers touched:** L5 (Client), L2 (Event Bus — Realtime subscriptions)
**Duration estimate:** 3-4 weeks
**Complexity:** High

### Key Deliverables

1. **War Room Dashboard — 6 widgets**
   - AI Command Bar — natural language queries routed to CEO_AGENT
   - Swarm Activity Feed — real-time agent activity stream via Supabase Realtime
   - Opportunity Radar — latest expansion signals from radar engine
   - Territory Heatmap — Mapbox GL JS with 5 heat layers and territory markers
   - Initiative Board — kanban view of active initiatives by status
   - Memory Widget — recent learnings and strategic insights

2. **Dashboard shell**
   - Sidebar navigation with brand selector
   - Top navigation with user profile (Clerk)
   - Responsive layout: desktop, tablet, mobile
   - Dark theme with status accent colors

3. **Real-time data binding**
   - Supabase Realtime subscriptions on territories, leads, agent_events, initiatives
   - Optimistic UI updates with server reconciliation
   - Connection status indicator

4. **Swarm monitor page**
   - `/swarm` route showing agent status grid
   - Recent dispatches table with model tier and duration
   - Event log with filtering by type and agent
   - Queue depth and processing rate metrics

5. **Brand-specific theming**
   - Brand colors loaded from `brand.json` config
   - Logo and brand name displayed in sidebar
   - Multi-brand switching for platform operators

### Dependencies
- Phase 3 complete (tools produce data for widgets to display)
- Mapbox API key configured
- Clerk authentication working

### Exit Criteria
- War Room dashboard renders with live data from Supabase
- AI Command Bar sends queries and displays agent responses
- Territory Heatmap displays territories with correct status colors
- Initiative Board shows real initiatives created by the swarm
- Swarm Activity Feed updates in real-time as agents execute

---

## Phase 5: Optimization

**Focus:** Model Routing refinement + Self-improving loops
**Layers touched:** L7 (Model Routing), L6 (Memory), L3 (Agent Swarm — learning agents)
**Duration estimate:** 2-3 weeks
**Complexity:** High

### Key Deliverables

1. **Vector embeddings for memory**
   - Replace dummy embeddings with OpenAI `text-embedding-3-small`
   - Enable pgvector cosine similarity search in `match_memories`
   - Upgrade memory retrieval from keyword search to semantic search

2. **Advanced model routing**
   - Brand-level model overrides from `brand_settings`
   - Dynamic tier adjustment based on daily cost budget
   - Agent performance scoring: track success rate per model tier
   - A/B testing framework for model tier experiments

3. **Learning loops**
   - LEARNING_AGENT compares baseline vs. post-action metrics
   - Successful patterns promoted from episodic to semantic memory
   - Failed strategies flagged and downgraded
   - PATTERN_DETECTION_AGENT finds cross-brand patterns

4. **Memory Curator automation**
   - Scheduled compression of old episodic memories
   - Automatic archival of superseded entries
   - Memory health dashboard showing layer sizes and staleness

5. **Cost optimization**
   - Daily cost reports per brand, per agent, per model tier
   - Budget alerts when spending approaches thresholds
   - Automatic worker tier downgrade when budget exceeded
   - Cost-per-initiative tracking

### Dependencies
- Phase 4 complete (dashboard displays data for evaluation)
- OpenAI API key for embeddings
- Sufficient agent execution history for pattern detection

### Exit Criteria
- Memory retrieval uses vector similarity (measurably better context relevance)
- Learning Agent has captured and applied at least 5 learnings
- Model routing dynamically adjusts tiers based on budget
- Cost dashboard shows accurate per-agent spending

---

## Phase 6: Scale

**Focus:** Multi-brand operations, mobile app, advanced analytics
**Layers touched:** All layers
**Duration estimate:** 4-6 weeks
**Complexity:** Very High

### Key Deliverables

1. **Multi-brand operations**
   - Platform operator view: cross-brand dashboard
   - Brand onboarding wizard: `bootstrap-brand.ts` with guided setup
   - Per-brand billing and usage metering
   - Cross-brand pattern sharing (anonymized learnings)

2. **Mobile app**
   - React Native app with daily briefing view
   - Push notifications for high-priority opportunities and alerts
   - Quick approve/reject for initiatives
   - Offline-capable with sync-on-reconnect

3. **Advanced analytics**
   - Cohort analysis: franchise performance by vintage
   - Territory lifecycle analytics: time-to-activation, revenue ramp
   - Campaign attribution: which channels drive qualified leads
   - Swarm effectiveness metrics: initiative success rate, time-to-action

4. **External integrations**
   - Census Bureau API for real population data
   - Google Maps Places API for competitor detection
   - Google Trends API for search volume signals
   - CRM integrations: HubSpot, Salesforce connectors
   - Payment processing: Stripe for royalty collection

5. **Operational hardening**
   - Rate limiting on all API endpoints
   - Circuit breakers for external service failures
   - Comprehensive error tracking (Sentry)
   - Automated testing: unit, integration, end-to-end
   - CI/CD pipeline: lint, type-check, build, migration checks on PR

6. **White-label deployment**
   - Custom domain support per brand
   - Brand-specific email templates
   - Configurable feature flags per brand tier

### Dependencies
- Phases 1-5 complete
- React Native development environment
- External API agreements and credentials
- Sufficient operational data for analytics

### Exit Criteria
- Two or more brands running concurrently with full RLS isolation
- Mobile app delivers daily briefings
- Analytics dashboards show actionable insights
- External data sources provide real (not simulated) territory scores
- System handles 10+ brands and 1,000+ daily agent executions

---

## Phase Summary

| Phase | Focus | Layers | Weeks | Complexity |
|-------|-------|--------|-------|------------|
| 1 — Foundation | Data + Events | L1, L2 | 2-3 | Medium |
| 2 — Intelligence | Agents + Memory + Routing | L3, L6, L7 | 3-4 | High |
| 3 — Execution | Tools + Automations | L4, L2 | 2-3 | Medium |
| 4 — Interface | Client + War Room | L5, L2 | 3-4 | High |
| 5 — Optimization | Embeddings + Learning + Cost | L7, L6, L3 | 2-3 | High |
| 6 — Scale | Multi-brand + Mobile + Analytics | All | 4-6 | Very High |

**Total estimated timeline:** 16-23 weeks for a solo developer or small team.

---

## Critical Path

```
Phase 1 (Foundation)
    ↓
Phase 2 (Intelligence) ←── blocking: agents need data layer
    ↓
Phase 3 (Execution) ←── blocking: tools need agents to call them
    ↓
Phase 4 (Interface) ←── blocking: UI needs real data from tools
    ↓
Phase 5 (Optimization) ←── blocking: learning needs execution history
    ↓
Phase 6 (Scale) ←── blocking: multi-brand needs all layers stable
```

Phases 3 and 4 have some parallelism potential: tool development and UI development can overlap if the API contracts are agreed upon early.
