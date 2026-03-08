# FranchiseOS — Swarm Controller Specification

## Overview

The Swarm Controller is the orchestration layer that manages the lifecycle, dispatch, and coordination of all agents in the FranchiseOS agent swarm. It ensures agents are triggered by the correct events, executed on the appropriate model tier, and constrained by safety rules.

---

## 1. Swarm Structure

The swarm is organized into three tiers reflecting organizational hierarchy. Each tier has different execution frequency, model cost, and authority level.

```
┌─────────────────────────────────────────────────┐
│            EXECUTIVE AGENTS (Tier 1)            │
│  CEO  ·  CRO  ·  COO  ·  CMO                   │
│  Strategic oversight · Low frequency · Claude    │
├─────────────────────────────────────────────────┤
│           DEPARTMENT AGENTS (Tier 2)            │
│  Market Opportunity · Territory Intelligence    │
│  Lead Intelligence · Sales Pipeline             │
│  Campaign · Content Strategy                    │
│  Onboarding · Coaching                          │
│  Operational reasoning · Medium frequency       │
├─────────────────────────────────────────────────┤
│        MEMORY & LEARNING AGENTS (Tier 2.5)      │
│  Memory Curator · Pattern Detection · Learning  │
│  Compounding intelligence · Background          │
├─────────────────────────────────────────────────┤
│            WORKER AGENTS (Tier 3)               │
│  Landing Page · Email · Social Content          │
│  Report · Initiative                            │
│  Narrow execution · High frequency · Cheap      │
└─────────────────────────────────────────────────┘
```

---

## 2. Executive Agents

Executive agents coordinate departments. They do not perform tasks directly — they set priorities, review system state, and escalate to human operators.

### CEO_AGENT
- **Frequency:** Daily summary, weekly deep review
- **Authority:** Can issue `strategy.adjustment`, `growth.priority` directives
- **Inputs:** `daily.system.report`, `weekly.sales.report`, `campaign.performance`, `unit.performance`
- **Outputs:** `strategy.adjustment`, `growth.priority`, `campaign.launch`, `territory.expansion`

### CRO_AGENT (Chief Revenue Officer)
- **Frequency:** Triggered by pipeline changes and lead volume shifts
- **Authority:** Can prioritize territories, adjust lead channel focus
- **Inputs:** `lead.created`, `lead.replied`, `candidate.scored`, `discovery.call.completed`, `territory.score.generated`
- **Outputs:** `pipeline.priority.changed`, `territory.outreach.requested`, `followup.requested`

### COO_AGENT (Chief Operating Officer)
- **Frequency:** Triggered by operational events and overdue tasks
- **Authority:** Can launch interventions, adjust onboarding workflows
- **Inputs:** `franchise.sold`, `onboarding.started`, `training.completed`, `unit.performance_drop`, `support.backlog.high`
- **Outputs:** `onboarding.workflow.updated`, `intervention.requested`, `support.escalation`

### CMO_AGENT (Chief Marketing Officer)
- **Frequency:** Triggered by traffic spikes, campaign reviews, brand initiatives
- **Authority:** Can approve campaigns, shift channel mix, adjust brand messaging
- **Inputs:** `traffic.heatmap.updated`, `campaign.performance`, `market.opportunity.detected`, `brand.update`
- **Outputs:** `campaign.approved`, `channel.mix.adjusted`, `content.direction.updated`

---

## 3. Department Agents

Department agents run the business day-to-day. They react to events, query memory, call tools, and emit downstream events.

| Agent | Primary Events | Tools | Output Events |
|-------|---------------|-------|---------------|
| **MARKET_OPPORTUNITY** | `traffic.heatmap.updated` | `analytics.get_traffic_by_region`, `territory.get_status`, `memory.retrieve_market_context` | `market.opportunity.detected`, `initiative.recommended` |
| **TERRITORY_INTELLIGENCE** | `market.opportunity.detected`, `candidate.requests_territory` | `territory.score`, `territory.check_conflicts`, `memory.retrieve_territory_context` | `territory.score.generated`, `territory.conflict.detected` |
| **LEAD_INTELLIGENCE** | `lead.created`, `lead.replied` | `crm.get_lead`, `crm.update_candidate`, `memory.retrieve_sales_patterns` | `lead.scored`, `lead.routed`, `high_value_candidate.detected` |
| **SALES_PIPELINE** | `lead.scored`, `discovery.call.completed` | `crm.get_pipeline`, `crm.update_candidate` | `followup.requested`, `proposal.requested`, `discovery_call.priority` |
| **CAMPAIGN** | `landing_page.generated`, `email_campaign.generated`, `initiative.created` | `marketing.create_campaign`, `marketing.get_performance` | `campaign.created`, `campaign.sequence.launched` |
| **CONTENT_STRATEGY** | `campaign.approved`, `market.opportunity.detected` | `memory.retrieve_brand_context`, `memory.retrieve_campaign_history` | `content.brief.created`, `campaign.theme.set` |
| **ONBOARDING** | `franchise.sold` | `crm.create_onboarding_checklist`, `email.send` | `onboarding.started`, `setup.task.created`, `launch.risk.detected` |
| **COACHING** | `unit.performance.updated`, `training.completed` | `analytics.get_unit_performance`, `memory.retrieve_franchisee_context` | `unit.performance_drop`, `coaching.plan.generated` |

---

## 4. Memory & Learning Agents

| Agent | Trigger | Responsibility | Output |
|-------|---------|---------------|--------|
| **MEMORY_CURATOR** | `pattern.detected`, `learning.captured`, `weekly.system.summary.generated` | Compress raw events into summaries, archive stale records, update structured memory files | Updated memory records, promoted learnings |
| **PATTERN_DETECTION** | `traffic.heatmap.updated`, `campaign.sequence.launched`, `unit.performance.updated` | Find cross-market patterns, compare current situations to historical | `pattern.detected`, `opportunity.pattern.detected`, `risk.pattern.detected` |
| **LEARNING** | `campaign.sequence.launched`, `initiative.review.scheduled` | Compare baseline vs post-action metrics, score effectiveness, update playbooks | `learning.captured`, `playbook.updated`, `strategy.recommended` |

---

## 5. Worker Agents

| Agent | Trigger | Action | Output |
|-------|---------|--------|--------|
| **LANDING_PAGE** | `landing_page.requested` | Generate localized franchise recruitment page using brand voice and market data | `landing_page.generated` |
| **EMAIL** | `email_campaign.requested`, `followup.requested` | Write outreach sequences, nurture emails, sales follow-ups | `email_campaign.generated` |
| **SOCIAL_CONTENT** | `social_campaign.requested` | Create local post sequences adapted to brand tone | `social_content.generated` |
| **REPORT** | `daily.system.report`, `initiative.review.completed` | Generate CEO summaries, weekly reports, initiative reviews | `report.generated` |
| **INITIATIVE** | `market.opportunity.detected`, `initiative.recommended` | Convert opportunity into coordinated multi-agent action plan | `initiative.created`, `landing_page.requested`, `email_campaign.requested`, `social_campaign.requested`, `review.scheduled` |

---

## 6. Event Schema

### Event Envelope
```json
{
  "event_id": "evt_a1b2c3d4",
  "event_type": "market.opportunity.detected",
  "brand_id": "skill-samurai",
  "timestamp": "2026-03-08T10:08:00Z",
  "source_agent": "MARKET_OPPORTUNITY_AGENT",
  "correlation_id": "init_dallas_001",
  "chain_depth": 2,
  "payload": {}
}
```

### Key Fields
| Field | Type | Description |
|-------|------|-------------|
| `event_id` | string | Unique event identifier |
| `event_type` | string | Dot-notation event name |
| `brand_id` | string | Tenant scope |
| `timestamp` | ISO 8601 | When the event was emitted |
| `source_agent` | string | Which agent created this event |
| `correlation_id` | string | Links related events in a workflow chain |
| `chain_depth` | integer | How many events deep in a chain (max 10) |
| `payload` | object | Event-specific data |

### Event Categories

**Lead Events:**
- `lead.created` — new prospect entered the system
- `lead.replied` — prospect responded to outreach
- `lead.scored` — lead assigned a quality score
- `lead.routed` — lead assigned to next action

**Sales Events:**
- `candidate.scored` — franchise buyer prospect scored
- `discovery.call.booked` — discovery call scheduled
- `discovery.call.completed` — discovery call happened
- `proposal.requested` — franchise proposal needed
- `franchise.sold` — franchise agreement signed

**Territory Events:**
- `territory.score.generated` — territory evaluation complete
- `territory.priority.increased` — territory moved up in priority
- `territory.conflict.detected` — overlap or saturation found

**Marketing Events:**
- `campaign.created` — new campaign registered
- `campaign.sequence.launched` — multi-channel campaign deployed
- `campaign.performance` — campaign metrics updated
- `landing_page.requested` — page generation needed
- `landing_page.generated` — page ready
- `email_campaign.requested` — email sequence needed
- `email_campaign.generated` — email sequence ready
- `social_campaign.requested` — social content needed

**Operations Events:**
- `onboarding.started` — new franchise activation begun
- `training.completed` — operator finished training module
- `unit.performance_drop` — unit KPIs below threshold
- `unit.performance.updated` — unit metrics refreshed
- `coaching.plan.generated` — coaching recommendation created

**Finance Events:**
- `payment.received` — payment processed
- `royalty.calculated` — royalty split computed
- `invoice.generated` — invoice created

**Intelligence Events:**
- `traffic.heatmap.updated` — new analytics data processed
- `market.opportunity.detected` — demand signal in open territory
- `pattern.detected` — cross-system pattern found
- `learning.captured` — outcome evaluated and recorded
- `semantic.memory.updated` — long-term knowledge promoted

**Initiative Events:**
- `initiative.recommended` — opportunity worthy of coordinated action
- `initiative.created` — action plan launched
- `initiative.review.scheduled` — evaluation checkpoint set
- `initiative.review.completed` — evaluation done

**System Events:**
- `daily.system.report` — daily summary generated
- `weekly.system.summary.generated` — weekly rollup complete

---

## 7. Dispatch Rules

The Swarm Controller uses dispatch rules to route events to agents. Rules are defined in `swarm/dispatch-rules.json`.

### Dispatch Logic
```
1. Event arrives on the Event Bus
2. Controller looks up matching dispatch rules
3. For each matching rule:
   a. Check preconditions (brand active, agent enabled, chain depth < max)
   b. Resolve model tier for the target agent
   c. Queue agent execution with event payload + memory context
4. Agent executes and emits output events
5. Output events re-enter the dispatch loop
```

### Dispatch Rule Format
```json
{
  "rule_id": "dispatch_market_opp",
  "trigger_event": "traffic.heatmap.updated",
  "target_agent": "MARKET_OPPORTUNITY_AGENT",
  "model_tier": "strategic",
  "priority": "high",
  "max_chain_depth": 10,
  "cooldown_seconds": 300,
  "preconditions": [
    "brand.active == true",
    "agent.enabled == true"
  ]
}
```

### Dispatch Configuration Fields
| Field | Description |
|-------|-------------|
| `rule_id` | Unique rule identifier |
| `trigger_event` | Event type that activates this rule |
| `target_agent` | Agent to execute |
| `model_tier` | `strategic`, `operational`, or `worker` |
| `priority` | `critical`, `high`, `normal`, `low` |
| `max_chain_depth` | Maximum event chain depth allowed |
| `cooldown_seconds` | Minimum time between re-triggers for same event type |
| `preconditions` | Conditions that must be true to dispatch |

---

## 8. Agent Lifecycle

### States
```
REGISTERED → IDLE → TRIGGERED → EXECUTING → COMPLETED
                                    ↓
                                  FAILED → RETRY (max 3) → ESCALATED
```

### Lifecycle Rules
1. **Registration:** Agent is declared in `AGENT_REGISTRY.md` and has a definition file in `swarm/agents/`
2. **Idle:** Agent waits for subscribed events
3. **Triggered:** Event arrives matching agent's subscription — dispatch rule is evaluated
4. **Executing:** Agent is running — model is selected, memory is loaded, tools are available
5. **Completed:** Agent emits output events and returns to idle
6. **Failed:** Agent execution errored — retry up to 3 times with exponential backoff
7. **Escalated:** After 3 failures, alert is sent to human operator and CEO_AGENT

### Execution Constraints
- **Timeout:** 60 seconds for worker agents, 120 seconds for department, 300 seconds for executive
- **Max concurrent:** 10 agents running simultaneously per brand
- **Chain depth limit:** 10 events deep before forced stop
- **Cooldown:** Configurable per agent to prevent runaway loops
- **Memory budget:** Each agent gets a bounded context window — memory retrieval is selective

### Health Monitoring
The CTO_AGENT (when enabled) monitors:
- Agent execution times
- Failure rates
- Event queue depth
- Model cost per agent tier
- Memory storage growth

---

## 9. Concurrency Model

### Parallel Execution
When an initiative triggers multiple worker agents (e.g., Landing Page + Email + Social Content), they execute in parallel. The Campaign Agent waits for all outputs before launching the sequence.

```
initiative.created
    ├──→ LANDING_PAGE_AGENT (parallel)
    ├──→ EMAIL_AGENT (parallel)
    └──→ SOCIAL_CONTENT_AGENT (parallel)
            ↓ (all complete)
        CAMPAIGN_AGENT
            ↓
        campaign.sequence.launched
```

### Event Ordering
- Events within a correlation chain are ordered by `chain_depth`
- Events across unrelated chains can execute concurrently
- Executive agent reviews are serialized to prevent conflicting directives

---

## 10. Safety Controls

### Circuit Breakers
- If an agent fails 5 times in 1 hour, it is disabled until manual re-enable
- If event queue exceeds 1000 pending items, new events are throttled
- If daily model cost exceeds budget threshold, worker agents downgrade to cheapest tier

### Audit Trail
- Every agent execution is logged with: agent, event, duration, model used, tools called, events emitted
- Decision logs in `memory/decision-log/` record reasoning for all initiatives
- Human approvals are tracked with timestamp and user identity

### Human Override
- Any initiative can be paused or cancelled from the dashboard
- Executive agent directives can be overridden via the AI Command Bar
- Critical actions (franchise sale, large campaigns) require human approval before execution
