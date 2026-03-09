# FranchiseOS — Model Routing Specification (OpenClaw)

## Overview

The Model Routing layer (internally called OpenClaw) routes each agent invocation to the optimal LLM based on agent tier, task complexity, brand configuration, and cost budget. The goal is to minimize cost while maintaining quality where it matters most: strategic reasoning uses the best model available, while high-volume content generation uses the cheapest model that meets quality standards.

V1 uses Claude models exclusively with three tiers. The architecture is provider-agnostic so future versions can incorporate Gemini, GPT, Mistral, or self-hosted models.

---

## 1. Tier Architecture

### Tier Definitions

| Tier | Default Model | Model ID | Use Case | % of Calls | Est. Cost/Day |
|------|--------------|----------|----------|-----------|---------------|
| Strategic | Claude Opus | `claude-opus-4-5-20250918` | Executive reasoning, pattern analysis, strategic decisions | ~10% | $5-15 |
| Operational | Claude Sonnet | `claude-sonnet-4-5-20250514` | Department operations, territory scoring, lead routing, campaign orchestration | ~40% | $5-15 |
| Worker | Claude Haiku | `claude-haiku-4-5-20251001` | Content generation, reports, emails, social posts, landing pages | ~50% | $5-10 |

### Target Cost

- **Per brand:** $15-40/day for a 20-agent swarm running ~800 calls/day
- **Monthly budget:** $450-1,200/month per brand
- **Cost optimization target:** 60% of spend on strategic tier, 25% on operational, 15% on worker

---

## 2. Agent-to-Tier Mapping

### Executive Agents — Strategic Tier

| Agent | Tier | Rationale |
|-------|------|-----------|
| CEO_AGENT | Strategic | System-wide strategic oversight requires deep reasoning |
| CRO_AGENT | Strategic | Revenue strategy and pipeline prioritization |
| COO_AGENT | Strategic | Operations leadership and intervention decisions |
| CMO_AGENT | Strategic | Marketing strategy and brand alignment |

### Department Agents — Operational Tier (with exceptions)

| Agent | Tier | Rationale |
|-------|------|-----------|
| MARKET_OPPORTUNITY_AGENT | Strategic | Exception: market analysis requires deep reasoning quality |
| TERRITORY_INTELLIGENCE_AGENT | Operational | Territory scoring is formulaic with reasoning overlay |
| LEAD_INTELLIGENCE_AGENT | Operational | Lead scoring combines data analysis with judgment |
| SALES_PIPELINE_AGENT | Operational | Pipeline management requires moderate reasoning |
| CAMPAIGN_AGENT | Operational | Campaign orchestration is process-driven |
| CONTENT_STRATEGY_AGENT | Operational | Content planning needs brand context awareness |
| ONBOARDING_AGENT | Operational | Onboarding is checklist-driven with personalization |
| COACHING_AGENT | Operational | Coaching requires understanding performance data |

### Memory and Learning Agents — Mixed Tiers

| Agent | Tier | Rationale |
|-------|------|-----------|
| MEMORY_CURATOR_AGENT | Strategic | Shapes long-term intelligence; must reason about what to keep |
| PATTERN_DETECTION_AGENT | Strategic | Cross-system pattern analysis requires deep reasoning |
| LEARNING_AGENT | Operational | Compares metrics and records outcomes |

### Worker Agents — Worker Tier

| Agent | Tier | Rationale |
|-------|------|-----------|
| LANDING_PAGE_AGENT | Worker | Template-based content generation |
| EMAIL_AGENT | Worker | Formulaic email writing with brand voice |
| SOCIAL_CONTENT_AGENT | Worker | Short-form content generation |
| REPORT_AGENT | Worker | Data summarization and formatting |
| INITIATIVE_AGENT | Worker | Structured initiative record creation |

---

## 3. Routing Logic

### 3.1 Default Routing: Agent Tier Mapping

```typescript
function getDefaultTier(agentName: string): ModelTier {
  const AGENT_TIERS: Record<string, ModelTier> = {
    // Executive — Strategic
    CEO_AGENT: 'strategic',
    CRO_AGENT: 'strategic',
    COO_AGENT: 'strategic',
    CMO_AGENT: 'strategic',

    // Department — Operational (with exceptions)
    MARKET_OPPORTUNITY_AGENT: 'strategic',
    TERRITORY_INTELLIGENCE_AGENT: 'operational',
    LEAD_INTELLIGENCE_AGENT: 'operational',
    SALES_PIPELINE_AGENT: 'operational',
    CAMPAIGN_AGENT: 'operational',
    CONTENT_STRATEGY_AGENT: 'operational',
    ONBOARDING_AGENT: 'operational',
    COACHING_AGENT: 'operational',

    // Memory & Learning
    MEMORY_CURATOR_AGENT: 'strategic',
    PATTERN_DETECTION_AGENT: 'strategic',
    LEARNING_AGENT: 'operational',

    // Worker
    LANDING_PAGE_AGENT: 'worker',
    EMAIL_AGENT: 'worker',
    SOCIAL_CONTENT_AGENT: 'worker',
    REPORT_AGENT: 'worker',
    INITIATIVE_AGENT: 'worker',
  };

  return AGENT_TIERS[agentName] ?? 'operational';
}
```

### 3.2 Keyword Override (Ad-Hoc Requests)

For ad-hoc requests through the AI Command Bar, the model tier is inferred from task description keywords:

```typescript
const STRATEGIC_KEYWORDS = [
  'strategy', 'expansion', 'investment', 'acquisition', 'market analysis',
  'board report', 'growth plan', 'competitive landscape', 'exit strategy',
];

const WORKER_KEYWORDS = [
  'email', 'report', 'format', 'template', 'generate', 'draft',
  'summarize', 'list', 'social post', 'landing page',
];

function routeRequest(taskDescription: string): ModelTier {
  const lower = taskDescription.toLowerCase();
  if (STRATEGIC_KEYWORDS.some(kw => lower.includes(kw))) return 'strategic';
  if (WORKER_KEYWORDS.some(kw => lower.includes(kw))) return 'worker';
  return 'operational';
}
```

### 3.3 Dispatch Rule Override

Each dispatch rule in `dispatch-rules.json` specifies a `model_tier` that overrides the agent's default tier for that specific event trigger:

```json
{
  "rule_id": "dispatch_market_opportunity",
  "trigger_event": "traffic.heatmap.updated",
  "target_agent": "MARKET_OPPORTUNITY_AGENT",
  "model_tier": "strategic"
}
```

### 3.4 Brand-Level Override

Brands can override the default model for any tier via `brand.json` config:

```json
{
  "brand_settings": {
    "model_overrides": {
      "strategic": "claude-opus-4-5-20250918",
      "operational": "claude-sonnet-4-5-20250514",
      "worker": "claude-haiku-4-5-20251001"
    }
  }
}
```

### 3.5 Environment Variable Override

Environment variables take precedence over brand config for deployment-wide settings:

```
MODEL_STRATEGIC=claude-opus-4-5-20250918
MODEL_OPERATIONAL=claude-sonnet-4-5-20250514
MODEL_WORKER=claude-haiku-4-5-20251001
```

### Resolution Order

Model selection follows this precedence (highest to lowest):

1. Environment variable (`MODEL_STRATEGIC`, `MODEL_OPERATIONAL`, `MODEL_WORKER`)
2. Brand-level override (`brand.json` -> `brand_settings.model_overrides`)
3. Dispatch rule `model_tier`
4. Agent default tier mapping
5. Fallback: `operational` tier

```typescript
function resolveModel(
  agentName: string,
  dispatchRule?: DispatchRule,
  brandConfig?: BrandConfig,
): string {
  // 1. Determine tier
  const tier = dispatchRule?.model_tier ?? getDefaultTier(agentName);

  // 2. Resolve model for tier (env > brand > default)
  const envKey = `MODEL_${tier.toUpperCase()}`;
  const envModel = process.env[envKey];
  if (envModel) return envModel;

  const brandModel = brandConfig?.brand_settings?.model_overrides?.[tier];
  if (brandModel) return brandModel;

  return MODEL_DEFAULTS[tier];
}
```

---

## 4. API Contract

### Core Functions

```typescript
type ModelTier = 'strategic' | 'operational' | 'worker';

/** Resolve a model identifier for the given tier */
function getModel(tier: ModelTier): string;

/** Keyword-based routing for ad-hoc task descriptions */
function routeRequest(taskDescription: string): ModelTier;

/** Full routing with agent name and optional brand context */
function routeAgent(
  agentName: string,
  brandId?: string,
): { model: string; tier: ModelTier };

/** Resolve model with budget checking */
async function resolveModelWithBudget(
  agentName: string,
  brandId: string,
  dispatchRule?: DispatchRule,
  brandConfig?: BrandConfig,
): Promise<{
  model: string;
  tier: ModelTier;
  downgraded: boolean;
  original_tier?: ModelTier;
}>;
```

### Data Types

```typescript
interface DispatchRule {
  rule_id: string;
  trigger_event: string;
  target_agent: string;
  model_tier: ModelTier;
  priority: 'critical' | 'high' | 'normal' | 'low';
  cooldown_seconds: number;
  preconditions: string[];
}

interface BrandConfig {
  brand_settings?: {
    model_overrides?: Partial<Record<ModelTier, string>>;
    budget?: BudgetConfig;
  };
}
```

---

## 5. Cost Tracking

### Per-Invocation Logging

Every agent execution logs model usage to the `agent_events` table:

```typescript
interface AgentExecutionLog {
  agent_name: string;
  event_type: string;
  model_tier: ModelTier;
  model_used: string;
  duration_ms: number;
  input_tokens: number;
  output_tokens: number;
  estimated_cost_usd: number;
  brand_id: string;
  timestamp: string;
}
```

### Cost Estimation

```typescript
const MODEL_PRICING: Record<string, { input_per_1k: number; output_per_1k: number }> = {
  'claude-opus-4-5-20250918':   { input_per_1k: 0.015,   output_per_1k: 0.075   },
  'claude-sonnet-4-5-20250514': { input_per_1k: 0.003,   output_per_1k: 0.015   },
  'claude-haiku-4-5-20251001':  { input_per_1k: 0.00025, output_per_1k: 0.00125 },
};

function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;
  return (inputTokens / 1000) * pricing.input_per_1k
       + (outputTokens / 1000) * pricing.output_per_1k;
}
```

### Daily Cost Aggregation Query

```sql
select
  brand_id,
  model_tier,
  model_used,
  count(*) as invocations,
  sum(duration_ms) as total_duration_ms,
  sum((payload->>'estimated_cost_usd')::numeric) as total_cost_usd
from agent_events
where created_at >= current_date
  and status = 'completed'
group by brand_id, model_tier, model_used
order by total_cost_usd desc;
```

---

## 6. Budget Controls

### Budget Configuration

```typescript
interface BudgetConfig {
  /** Daily cost limit per brand in USD */
  daily_limit_usd: number;

  /** Warning threshold (percentage of daily limit) */
  warning_threshold_percent: number;

  /** Critical threshold — triggers automatic tier downgrade */
  critical_threshold_percent: number;

  /** Whether to automatically downgrade tiers when budget exceeded */
  auto_downgrade: boolean;
}

const DEFAULT_BUDGET: BudgetConfig = {
  daily_limit_usd: 50,
  warning_threshold_percent: 70,
  critical_threshold_percent: 90,
  auto_downgrade: true,
};
```

### Automatic Tier Downgrade

When daily cost reaches the critical threshold:

1. Worker agents: no change (already cheapest)
2. Operational agents: downgrade to worker tier
3. Strategic agents: downgrade to operational tier
4. Emit `budget.threshold.reached` event
5. Notify CEO_AGENT and human operator
6. Reset at midnight UTC

```typescript
async function checkBudgetAndRoute(
  brandId: string,
  agentName: string,
  tier: ModelTier,
  budgetConfig: BudgetConfig,
): Promise<ModelTier> {
  const dailyCost = await getDailyCost(brandId);
  const criticalLimit = budgetConfig.daily_limit_usd
    * (budgetConfig.critical_threshold_percent / 100);

  if (dailyCost >= criticalLimit && budgetConfig.auto_downgrade) {
    if (tier === 'strategic') return 'operational';
    if (tier === 'operational') return 'worker';
  }

  const warningLimit = budgetConfig.daily_limit_usd
    * (budgetConfig.warning_threshold_percent / 100);
  if (dailyCost >= warningLimit) {
    await emitEvent('budget.threshold.reached', brandId, {
      current_cost: dailyCost,
      limit: budgetConfig.daily_limit_usd,
      level: 'warning',
    });
  }

  return tier;
}
```

### Brand Budget Override

Brands can set custom budget limits in `brand.json`:

```json
{
  "brand_settings": {
    "budget": {
      "daily_limit_usd": 75,
      "warning_threshold_percent": 80,
      "critical_threshold_percent": 95,
      "auto_downgrade": true
    }
  }
}
```

---

## 7. Logging to agent_events Table

Every model invocation creates or updates a record in `agent_events`:

```sql
-- On dispatch:
insert into agent_events (
  id, brand_id, agent_name, event_type,
  correlation_id, chain_depth, status,
  payload, model_tier, model_used,
  duration_ms, created_at
) values (
  $1, $2, $3, $4,
  $5, $6, 'processing',
  $7, $8, $9,
  null, now()
);

-- After execution completes:
update agent_events
set status = 'completed',
    result = $result,
    duration_ms = $duration,
    processed_at = now()
where id = $event_id;
```

### Log Fields for Cost Analysis

| Field | Description |
|-------|-------------|
| `model_tier` | Tier used: strategic, operational, worker |
| `model_used` | Specific model ID (e.g., claude-opus-4-5-20250918) |
| `duration_ms` | Wall-clock execution time |
| `payload.input_tokens` | Tokens sent to the model |
| `payload.output_tokens` | Tokens received from the model |
| `payload.estimated_cost_usd` | Estimated cost of this invocation |
| `payload.budget_downgraded` | Boolean — was this invocation downgraded due to budget? |
| `payload.original_tier` | If downgraded, what tier was originally requested |

---

## 8. Integration Points

### model-router.ts (Dashboard App)

The existing `dashboard-app/src/lib/model-router.ts` implements the client-side routing logic. It exports:
- `getModel(tier: ModelTier): string` — resolve model ID from env vars or defaults
- `routeRequest(taskDescription: string): ModelTier` — keyword-based tier inference

### dispatch-rules.json

Each dispatch rule specifies `model_tier`, which the swarm controller passes to the model router when executing an agent.

### Brand Engine

`brand-loader.ts` loads `brand.json` which may contain `brand_settings.model_overrides` and `brand_settings.budget` for per-brand routing and cost control.

### Swarm Controller

The swarm controller calls `resolveModel()` during the agent execution pipeline:
1. Match event to dispatch rule
2. Extract `model_tier` from rule
3. Check brand overrides
4. Check budget thresholds
5. Resolve final model ID
6. Execute agent with resolved model
7. Log execution with model metadata

### War Room Dashboard

The Swarm Monitor page displays:
- Model usage breakdown by tier (pie chart)
- Daily cost trend (line chart)
- Per-agent cost ranking (bar chart)
- Budget utilization gauge
- Tier downgrade alerts

---

## 9. Implementation Notes

- V1 is Claude-only. Multi-provider support (Gemini, GPT, Mistral) is deferred to Phase 6.
- Environment variable overrides take precedence over brand_settings for development.
- Token counting in V1 uses the Anthropic API response `usage` field for accurate tracking.
- Cost estimation is logged per invocation and aggregated daily for budget checks.
- The routing layer is provider-agnostic by design — changing the model ID is all that's needed to switch providers.

---

## 10. Future Enhancements

### A/B Testing Framework

Test different models for the same agent to compare quality and cost:

```typescript
interface ModelExperiment {
  experiment_id: string;
  agent_name: string;
  control_model: string;
  variant_model: string;
  traffic_split: number;        // 0.0-1.0 percentage to variant
  success_metric: string;       // 'initiative_outcome', 'lead_conversion_rate'
  start_date: string;
  end_date: string;
}
```

### Dynamic Tier Adjustment

Use agent performance history to automatically adjust tiers:
- If a worker-tier agent consistently produces low-quality output (measured by downstream agent rejections), upgrade to operational
- If a strategic-tier agent handles simple events that operational could handle, suggest downgrade

### Provider Diversification

Future model options beyond Claude:
- Gemini Pro / Flash for operational and worker tiers
- GPT-4o-mini for high-volume worker tasks
- DeepSeek for cost-optimized content generation
- Self-hosted Llama for offline or air-gapped deployments
