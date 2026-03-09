# FranchiseOS — Layer Mapping

## Overview

This document maps every feature and module in FranchiseOS to the seven architecture layers defined in `FRANCHISEOS_7_LAYER_AI_ARCHITECTURE.md`. A module may touch multiple layers depending on where it stores data, emits events, runs logic, and surfaces UI.

---

## Layer Reference

| Layer | Name | Technology |
|-------|------|------------|
| L1 | Data Layer | Supabase Postgres, pgvector, RLS |
| L2 | Event Bus | Supabase Realtime, Edge Functions, dispatch-rules.json |
| L3 | Agent Swarm | Claude API, agent markdown definitions, swarm controller |
| L4 | Tools & Automations | TypeScript Edge Functions, CRM/territory/marketing tools |
| L5 | Client Layer | Next.js App Router, Tailwind, War Room Dashboard |
| L6 | Memory Layer | memory_entries table, 9-layer memory architecture |
| L7 | Model Routing | OpenClaw model router, tier-based LLM selection |

---

## Feature-to-Layer Mapping

| Feature / Module | L1 Data | L2 Events | L3 Agents | L4 Tools | L5 Client | L6 Memory | L7 Routing |
|------------------|---------|-----------|-----------|----------|-----------|-----------|------------|
| **territory-engine** | territories, territory_scores tables | territory.score.generated, territory.priority.increased, territory.conflict.detected | TERRITORY_INTELLIGENCE_AGENT | territory.score(), territory.get_status(), territory.check_conflicts() | TerritoryHeatmap widget | territory memory layer | Operational tier |
| **expansion-radar** | leads, territory_scores, competitor_locations, search_signals, radar_scans tables | opportunity.detected, market.opportunity.detected | MARKET_OPPORTUNITY_AGENT | analytics.get_traffic_by_region() | OpportunityRadar widget | market memory layer | Strategic tier |
| **initiative-engine** | initiatives table | initiative.recommended, initiative.created, initiative.review.scheduled, initiative.review.completed | INITIATIVE_AGENT | initiative.create(), initiative.check_duplicates(), initiative.schedule_review() | InitiativeBoard widget | decision-log memory layer | Worker tier (creation), Strategic tier (gate evaluation) |
| **brand-engine** | brands table, brands/{slug}/ config files | brand.update | CEO_AGENT, CMO_AGENT (brand alignment) | brand-loader.ts, config-validator.ts, onboarding-wizard.ts | Brand settings UI | brand memory layer | N/A (config loader, no LLM calls) |
| **memory** | memory_entries table | semantic.memory.updated, learning.captured, pattern.detected | MEMORY_CURATOR_AGENT, LEARNING_AGENT | memory.retrieve_market_context(), memory.write_learning_record() | MemoryWidget | All 9 memory layers | Strategic tier (curation), Worker tier (retrieval) |
| **messaging** | agent_events (notification records) | Notification events on all channels | Report Agent (generates content) | slack-gateway.ts, sms-gateway.ts, whatsapp-gateway.ts | Toast notifications in dashboard | N/A | Worker tier |
| **swarm agents — Executive** | agent_events table | All event categories (subscribe and emit) | CEO_AGENT, CRO_AGENT, COO_AGENT, CMO_AGENT | Read-only tools; issue directives | War Room AI Command Bar | strategic memory layer | Strategic tier (Opus) |
| **swarm agents — Department** | agent_events, leads, candidates, territories, campaigns | Department-specific event subscriptions | MARKET_OPPORTUNITY, TERRITORY_INTELLIGENCE, LEAD_INTELLIGENCE, SALES_PIPELINE, CAMPAIGN, CONTENT_STRATEGY, ONBOARDING, COACHING | CRM tools, territory tools, marketing tools | Swarm Activity Feed | Respective domain memory layers | Operational tier (Sonnet) |
| **swarm agents — Memory/Learning** | memory_entries, agent_events | pattern.detected, learning.captured, semantic.memory.updated | MEMORY_CURATOR, PATTERN_DETECTION, LEARNING | memory.retrieve_*, memory.write_* | MemoryWidget | All layers (read/write/promote) | Strategic tier |
| **swarm agents — Worker** | campaigns, agent_events | Content generation events | LANDING_PAGE, EMAIL, SOCIAL_CONTENT, REPORT, INITIATIVE | document.generate_*, email.generate_*, marketing.create_campaign() | Generated content preview in dashboard | campaign memory layer | Worker tier (Haiku) |
| **dashboard — War Room** | All tables (read) | Supabase Realtime subscriptions | CEO_AGENT (command bar routing) | N/A (read-only UI) | All 6 War Room widgets | N/A | Strategic tier (command bar) |
| **dashboard — Swarm Monitor** | agent_events table | Real-time event stream | N/A (observability only) | N/A | SwarmActivityFeed widget | N/A | N/A |
| **scripts — start-swarm** | agent_events (event loop) | Event dispatch loop | All agents (orchestration) | All tools (delegated) | N/A | Context loading | Model routing per dispatch rule |
| **scripts — bootstrap-brand** | brands table, brands/ directory | brand.created | N/A | brand-loader.ts, config-validator.ts | N/A | brand memory initialization | N/A |

---

## Layer Dependency Direction

```
L1 Data Layer
    ↑ writes via tools only
L4 Tools & Automations
    ↑ called by agents
L3 Agent Swarm
    ↑ dispatched by events     ← L7 Model Routing (selects model)
L2 Event Bus                   ← L6 Memory (provides context)
    ↑ subscribed by client
L5 Client Layer
```

Key rules:
- Agents (L3) never write to the database (L1) directly — always through tools (L4)
- Tools (L4) emit events (L2) after every mutation
- The client (L5) subscribes to events (L2) for real-time updates
- Memory (L6) is queried by agents (L3) before every execution
- Model routing (L7) determines which LLM processes each agent invocation

---

## Cross-Cutting Concerns

| Concern | Layers Touched | Implementation |
|---------|---------------|----------------|
| Multi-brand isolation | L1 (RLS), L2 (brand_id scoping), L3 (brand context), L5 (Clerk org) | Every table has `brand_id` FK; RLS policies enforce tenant isolation |
| Audit trail | L1 (agent_events), L2 (event logging), L6 (decision-log) | All agent executions logged with duration, model, tools called |
| Cost tracking | L1 (agent_events.model_used), L7 (tier selection) | Model usage logged per event; budget thresholds trigger tier downgrades |
| Authentication | L1 (Clerk org mapping), L5 (Clerk middleware) | JWT-based auth with org_id extraction for RLS |
| Error handling | L2 (failed event status), L3 (retry with backoff), L5 (error boundaries) | 3 retries, then escalation to CEO_AGENT and human operator |
