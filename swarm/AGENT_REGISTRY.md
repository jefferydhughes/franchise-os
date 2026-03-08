# FranchiseOS Agent Registry

All active agents in the FranchiseOS v1 swarm. Each agent has a definition file in `swarm/agents/`.

## Agent Execution Rules

Agents must:
1. Subscribe to specific events
2. Retrieve context from memory before acting
3. Perform reasoning
4. Call tools (never write to DB directly)
5. Emit output events

Agents must NOT:
- Modify system data directly
- Trigger unlimited recursive loops (max chain depth: 10)
- Duplicate active initiatives
- Exceed model tier budget

---

## Executive Agents (Tier 1 — Claude)

| # | Agent | File | Role | Frequency |
|---|-------|------|------|-----------|
| 1 | CEO_AGENT | `ceo.md` | Strategic oversight, growth priorities, risk detection | Daily + weekly |
| 2 | CRO_AGENT | `cro.md` | Revenue leadership, franchise sales pipeline | On pipeline changes |
| 3 | COO_AGENT | `coo.md` | Operations — onboarding, training, compliance, support | On operational events |
| 4 | CMO_AGENT | `cmo.md` | Marketing direction, campaign approval, brand alignment | On campaign/traffic events |

## Department Agents (Tier 2 — Operational models)

| # | Agent | File | Role | Frequency |
|---|-------|------|------|-----------|
| 5 | MARKET_OPPORTUNITY_AGENT | `market-opportunity.md` | Detect geographic demand in unsold territories | On traffic updates |
| 6 | TERRITORY_INTELLIGENCE_AGENT | `territory-intelligence.md` | Territory scoring, conflict detection, proposals | On opportunity/candidate events |
| 7 | LEAD_INTELLIGENCE_AGENT | `lead-intelligence.md` | Lead scoring and routing | On every new lead |
| 8 | SALES_PIPELINE_AGENT | `sales-pipeline.md` | Deal progression, stall detection, follow-ups | On lead/sales events |
| 9 | CAMPAIGN_AGENT | `campaign.md` | Multi-channel campaign orchestration | On content ready events |
| 10 | CONTENT_STRATEGY_AGENT | `content-strategy.md` | Content briefs, messaging, creative direction | On campaign approval |
| 11 | ONBOARDING_AGENT | `onboarding.md` | New franchise activation sequences | On franchise.sold |
| 12 | COACHING_AGENT | `coaching.md` | Unit performance monitoring and coaching plans | On unit metrics |

## Memory & Learning Agents (Tier 2.5)

| # | Agent | File | Role | Frequency |
|---|-------|------|------|-----------|
| 13 | MEMORY_CURATOR_AGENT | `memory-curator.md` | Memory maintenance, compression, promotion | On learnings + weekly |
| 14 | PATTERN_DETECTION_AGENT | `pattern-detection.md` | Cross-system pattern and anomaly detection | On data updates |
| 15 | LEARNING_AGENT | `learning.md` | Outcome evaluation, playbook optimization | On initiative reviews |

## Worker Agents (Tier 3 — Cheap/fast models)

| # | Agent | File | Role | Frequency |
|---|-------|------|------|-----------|
| 16 | LANDING_PAGE_AGENT | `landing-page.md` | Generate localized recruitment pages | On request |
| 17 | EMAIL_AGENT | `email.md` | Write outreach and nurture sequences | On request |
| 18 | SOCIAL_CONTENT_AGENT | `social-content.md` | Create local social campaign content | On request |
| 19 | REPORT_AGENT | `report.md` | Executive summaries and operational reports | Daily + on request |
| 20 | INITIATIVE_AGENT | `initiative.md` | Convert opportunities into action plans | On opportunity detected |

---

## Model Tier Assignment

| Tier | Model | Agents | % of Calls |
|------|-------|--------|-----------|
| Strategic | Claude Sonnet/Opus | CEO, CRO, COO, CMO, Market Opportunity, Pattern Detection | ~10% |
| Operational | Gemini Pro / GPT-4o-mini / Mistral | Territory, Lead, Sales, Campaign, Content, Onboarding, Coaching, Learning | ~40% |
| Worker | Gemini Flash / DeepSeek / Local | Landing Page, Email, Social, Report, Initiative, Memory Curator | ~50% |

---

## Event Subscription Map

```
traffic.heatmap.updated     → MARKET_OPPORTUNITY, PATTERN_DETECTION
market.opportunity.detected → TERRITORY_INTELLIGENCE, INITIATIVE, CRO, CMO
territory.score.generated   → CRO, PATTERN_DETECTION
lead.created                → LEAD_INTELLIGENCE
lead.scored                 → SALES_PIPELINE
lead.replied                → LEAD_INTELLIGENCE
franchise.sold              → ONBOARDING, COO
unit.performance.updated    → COACHING, PATTERN_DETECTION
unit.performance_drop       → COO, CEO
campaign.approved           → CONTENT_STRATEGY, CAMPAIGN
landing_page.requested      → LANDING_PAGE
landing_page.generated      → CAMPAIGN
email_campaign.requested    → EMAIL
email_campaign.generated    → CAMPAIGN
social_campaign.requested   → SOCIAL_CONTENT
social_content.generated    → CAMPAIGN
initiative.created          → CAMPAIGN
initiative.recommended      → INITIATIVE
initiative.review.scheduled → LEARNING
initiative.review.completed → CEO, LEARNING
campaign.sequence.launched  → LEARNING, PATTERN_DETECTION
campaign.performance        → CMO, CEO
pattern.detected            → MEMORY_CURATOR, CEO
learning.captured           → MEMORY_CURATOR
daily.system.report         → CEO, REPORT
weekly.system.summary       → CEO, MEMORY_CURATOR, REPORT
followup.requested          → EMAIL
```
