# FranchiseOS — War Room Dashboard Specification

## Overview

The War Room Dashboard is the CEO command center for FranchiseOS. It provides real-time visibility into swarm activity, emerging opportunities, franchise performance, and system intelligence. The dashboard should feel like mission control for a franchise empire — not a typical SaaS admin panel.

**Design Principles:**
- Intensity, clarity, movement, and constant opportunity detection
- Data-dense but scannable — every pixel earns its place
- Dark theme with accent colors for status (green=active, yellow=opportunity, red=risk)
- Real-time updates via WebSocket — no manual refresh
- Mobile-responsive with a dedicated mobile summary view

**Technology:**
- Next.js (App Router)
- Tailwind CSS
- Supabase Realtime for live data
- Mapbox GL JS for territory heatmap
- Recharts for data visualization

---

## Widget 1: AI Command Bar

**Position:** Fixed at top of dashboard, always visible.

**Purpose:** Natural language interface to the entire FranchiseOS system. The primary way the CEO interacts with the platform.

**Appearance:**
```
┌─────────────────────────────────────────────────────────┐
│  🔍  Ask FranchiseOS anything...                    ⌘K  │
└─────────────────────────────────────────────────────────┘
```

**Example Queries:**
- "Where should we sell the next franchise?"
- "Which cities are heating up?"
- "Show me underperforming units that need intervention."
- "Launch a teacher recruitment campaign in Texas."
- "What initiatives did the swarm launch this week?"
- "Prepare territory proposal for Dallas."
- "Which open territories look most promising right now?"

**Behavior:**
- Queries are routed to the CEO_AGENT for interpretation
- Agent determines which tools and sub-agents to invoke
- Results are displayed inline below the command bar
- Action confirmations appear as toast notifications
- Command history is accessible via up-arrow

**Data Sources:**
- All agent endpoints
- Memory retrieval system
- Analytics APIs

**Refresh:** Real-time (responds to each query)

---

## Widget 2: Opportunity Radar

**Position:** Top-left panel, prominent placement.

**Purpose:** Live panel of emerging territory opportunities detected by the MARKET_OPPORTUNITY_AGENT and PATTERN_DETECTION_AGENT.

**Appearance:**
```
┌─────────────────────────────────────────────┐
│  OPPORTUNITY RADAR                     Live │
├─────────────────────────────────────────────┤
│                                             │
│  🔴 DALLAS, TX                              │
│  Traffic: +212% (14 days)                   │
│  Franchise: None                            │
│  Similarity to Phoenix: 87%                 │
│  ▸ Launch localized acquisition sequence    │
│  Status: Ready to deploy            [GO →]  │
│                                             │
│  🟡 TAMPA, FL                               │
│  Lead engagement: Rising                    │
│  Search demand: High                        │
│  Competitor saturation: Low                 │
│  ▸ Priority outreach to teacher leads       │
│  Status: Recommended                [GO →]  │
│                                             │
│  🟢 RALEIGH, NC                             │
│  Traffic: +89% (30 days)                    │
│  School density: High                       │
│  ▸ Monitor — approaching threshold          │
│  Status: Watching                           │
│                                             │
└─────────────────────────────────────────────┘
```

**Card Fields:**
| Field | Source |
|-------|--------|
| City/Region | `memory/market/{city}.json` |
| Traffic change | `analytics.get_traffic_by_region()` |
| Franchise status | `territory.get_status()` |
| Similarity score | `PATTERN_DETECTION_AGENT` output |
| Recommended action | `MARKET_OPPORTUNITY_AGENT` output |
| Status | `initiative` state (Watching / Recommended / Ready / In Progress) |

**Interactions:**
- Click [GO] to approve and launch the initiative
- Click card to expand full opportunity analysis
- Filter by status: All / Ready / Recommended / Watching

**Data Sources:**
- `market.opportunity.detected` events
- `memory/market/` files
- `territory` status data

**Refresh Rate:** Every 5 minutes + real-time on new `market.opportunity.detected` events

---

## Widget 3: Territory Heatmap

**Position:** Center panel, largest widget.

**Purpose:** Interactive map showing geographic intelligence across all territories. The CEO can literally see where the business is hot and where to move next.

**Appearance:**
Full-width map with colored overlays and territory boundaries.

**Map Layers (toggleable):**

| Layer | Color Scale | Source |
|-------|-------------|--------|
| **Traffic Heat** | Blue → Red (volume) | `analytics.get_traffic_by_region()` |
| **Lead Heat** | Green → Orange (density) | `crm.get_leads_by_region()` |
| **Revenue Heat** | Gray → Green (revenue) | `payments.get_revenue_by_territory()` |
| **Opportunity Heat** | Yellow → Red (opportunity score) | `MARKET_OPPORTUNITY_AGENT` scores |
| **Underperformance Heat** | Green → Red (risk) | `COACHING_AGENT` risk scores |

**Territory Markers:**
- 🟢 Green pin = Active franchise unit
- 🟡 Yellow pin = Available territory
- 🔴 Red pin = Saturated / conflict
- 🔵 Blue pin = Initiative in progress

**Interactions:**
- Click territory for detail panel (demographics, score, campaign history)
- Toggle between heat layers
- Zoom and pan
- Draw custom regions for ad-hoc analysis
- Right-click territory → "Create initiative for this region"

**Data Sources:**
- `territory` table
- `units` table
- Analytics traffic data
- Market memory files
- Active initiative data

**Refresh Rate:** Every 10 minutes + real-time on territory events

---

## Widget 4: Initiative Board

**Position:** Right panel.

**Purpose:** Kanban board tracking swarm-driven growth initiatives from detection through execution to outcome review.

**Columns:**
```
┌──────────┬──────────────┬──────────┬─────────────┬──────────┬──────────┐
│ Detected │ Recommended  │ Approved │ In Progress │ Learning │ Archived │
│          │              │          │             │ Review   │          │
├──────────┼──────────────┼──────────┼─────────────┼──────────┼──────────┤
│ Raleigh  │ Tampa        │          │ Dallas      │          │ Phoenix  │
│ Growth   │ Teacher      │          │ Expansion   │          │ Launch   │
│ Signal   │ Funnel       │          │ Initiative  │          │ (Win)    │
│          │              │          │             │          │          │
│          │              │          │ Unit #114   │          │ Ontario  │
│          │              │          │ Recovery    │          │ Retest   │
│          │              │          │             │          │ (Mixed)  │
└──────────┴──────────────┴──────────┴─────────────┴──────────┴──────────┘
```

**Card Fields:**
- Initiative name
- Source agent
- Target region/entity
- Created date
- Current status
- Outcome (for archived: Win / Mixed / Loss)

**Interactions:**
- Drag cards between columns (Recommended → Approved triggers launch)
- Click card for full initiative detail (decision log, agents involved, KPIs)
- Filter by: region, type (expansion/recovery/campaign), status
- Archive completed initiatives with outcome tag

**Data Sources:**
- `initiatives` table
- `memory/decision-log/` entries
- `initiative.*` events

**Refresh Rate:** Real-time on all `initiative.*` events

---

## Widget 5: Swarm Activity Feed

**Position:** Bottom-left panel.

**Purpose:** Real-time stream of what agents are doing right now. Makes the platform feel alive.

**Appearance:**
```
┌─────────────────────────────────────────────────────────┐
│  SWARM ACTIVITY                                   Live │
├─────────────────────────────────────────────────────────┤
│  10:15 AM  LEARNING_AGENT                              │
│            Scheduled 14-day review for Dallas initiative│
│                                                        │
│  10:13 AM  EMAIL_AGENT                                 │
│            Queued Dallas email campaign (5-email seq)   │
│                                                        │
│  10:12 AM  SOCIAL_CONTENT_AGENT                        │
│            Generated 14-post Dallas social sequence     │
│                                                        │
│  10:10 AM  LANDING_PAGE_AGENT                          │
│            Drafted Dallas franchise recruitment page    │
│                                                        │
│  10:09 AM  INITIATIVE_AGENT                            │
│            Created "Dallas Expansion Initiative"        │
│                                                        │
│  10:08 AM  MARKET_OPPORTUNITY_AGENT                    │
│            Detected Dallas opportunity (score: 87)      │
│                                                        │
└─────────────────────────────────────────────────────────┘
```

**Entry Fields:**
| Field | Description |
|-------|-------------|
| Timestamp | When the action occurred |
| Agent name | Which agent performed the action |
| Action summary | One-line description of what happened |
| Tier badge | Color-coded: gold=executive, blue=department, gray=worker |

**Interactions:**
- Click entry to see full event payload and agent reasoning
- Filter by: agent tier, agent name, event type, time range
- Pause/resume live feed
- Search within feed

**Data Sources:**
- Agent execution log
- All emitted events

**Refresh Rate:** Real-time streaming via WebSocket

---

## Widget 6: Memory Intelligence Widget

**Position:** Bottom-right panel.

**Purpose:** Shows what the system has learned over time. Gives the CEO confidence that the swarm is getting smarter.

**Appearance:**
```
┌─────────────────────────────────────────────────────────┐
│  SYSTEM INTELLIGENCE                                    │
├─────────────────────────────────────────────────────────┤
│                                                        │
│  📊 What the system knows                              │
│                                                        │
│  Localized city pages have increased qualified lead     │
│  conversion in 4 of the last 5 open-market tests.      │
│                                                        │
│  Best-performing sequence:                              │
│  Landing page + local organic social + retargeting      │
│                                                        │
│  Weakest sequence:                                      │
│  Cold email only (2 of 3 tests showed no conversion)    │
│                                                        │
│  ─────────────────────────────────────────────          │
│                                                        │
│  📈 Pattern Insights (last 30 days)                     │
│                                                        │
│  • Teacher leads convert 31% better than generic        │
│    entrepreneur leads                                   │
│  • Units with school partnerships reach profitability   │
│    2.3 months faster                                    │
│  • Dallas traffic pattern resembles Phoenix             │
│    90 days before conversion                            │
│                                                        │
│  ─────────────────────────────────────────────          │
│                                                        │
│  🧠 Playbook Updates                                    │
│                                                        │
│  Updated: market-expansion-playbook.md                  │
│  "When an open city shows high traffic + high family    │
│  density, launch localized landing page first, then     │
│  organic social, then retargeting. Paid acquisition     │
│  only if engagement threshold met."                     │
│                                                        │
│  Confidence: HIGH (4/5 tests validated)                 │
│                                                        │
└─────────────────────────────────────────────────────────┘
```

**Sections:**
1. **System Knowledge** — Top learnings from semantic memory
2. **Pattern Insights** — Recent discoveries from PATTERN_DETECTION_AGENT
3. **Playbook Updates** — Recent changes to operational playbooks by LEARNING_AGENT

**Data Sources:**
- `memory/semantic/` files
- `pattern.detected` events
- `learning.captured` events
- `playbook.updated` events

**Refresh Rate:** Every 30 minutes + real-time on `learning.captured` and `pattern.detected` events

---

## Top Metrics Bar

**Position:** Below the AI Command Bar, above the main widget grid.

**Metrics:**
| Metric | Source |
|--------|--------|
| Total Franchise Units | `units` table (count where status=active) |
| Monthly Recurring Revenue | `payments` table (sum last 30 days) |
| Royalty Revenue | `payments` table (royalty split last 30 days) |
| Active Leads | `leads` table (count where status=active) |
| Franchises in Pipeline | `candidates` table (count in sales stages) |
| Average Unit Revenue | `units` + `payments` (avg per unit last 30 days) |

**Refresh Rate:** Every 5 minutes

---

## Layout

### Desktop (1440px+)
```
┌─────────────────────────────────────────────────────────────┐
│                    AI COMMAND BAR                            │
├─────────────────────────────────────────────────────────────┤
│  Units: 47  │  MRR: $284K  │  Leads: 312  │  Pipeline: 18  │
├───────────────────┬─────────────────────┬───────────────────┤
│                   │                     │                   │
│   OPPORTUNITY     │   TERRITORY         │   INITIATIVE      │
│   RADAR           │   HEATMAP           │   BOARD           │
│                   │                     │                   │
│                   │                     │                   │
├───────────────────┴──────────┬──────────┴───────────────────┤
│                              │                              │
│   SWARM ACTIVITY FEED        │   MEMORY INTELLIGENCE        │
│                              │                              │
│                              │                              │
└──────────────────────────────┴──────────────────────────────┘
```

### Mobile
Simplified vertical stack:
1. AI Command Bar (sticky top)
2. Top Metrics (horizontal scroll)
3. Today's Summary (AI-generated daily briefing)
4. Opportunity Radar (cards)
5. Initiative Board (list view)
6. Swarm Activity Feed (condensed)

---

## Interaction Patterns

### Approve Initiative Flow
1. CEO sees opportunity card in Radar with [GO] button
2. Clicks [GO] — confirmation modal shows initiative plan
3. CEO approves — INITIATIVE_AGENT launches coordinated workflow
4. Initiative card moves to "In Progress" on Initiative Board
5. Swarm Activity Feed shows agents executing
6. After review period, card moves to "Learning Review"

### Query Flow
1. CEO types question in AI Command Bar
2. Query routes to CEO_AGENT
3. CEO_AGENT invokes relevant sub-agents and tools
4. Results render inline below command bar
5. If actionable, CEO can approve directly from results

### Alert Flow
1. COACHING_AGENT detects unit performance drop
2. Alert appears as notification badge on dashboard
3. CEO clicks to see coaching recommendation
4. CEO can approve intervention or dismiss
5. If approved, INITIATIVE_AGENT creates recovery plan

---

## Color System

| Element | Color | Hex |
|---------|-------|-----|
| Background | Near-black | `#0A0A0F` |
| Card background | Dark gray | `#12121A` |
| Border | Subtle gray | `#1E1E2E` |
| Active/success | Green | `#00D68F` |
| Opportunity/warning | Amber | `#FFB800` |
| Risk/alert | Red | `#FF3D71` |
| Info/neutral | Blue | `#3366FF` |
| In progress | Purple | `#7B61FF` |
| Text primary | White | `#FFFFFF` |
| Text secondary | Gray | `#8F9BB3` |
| Executive agent badge | Gold | `#FFD700` |
| Department agent badge | Blue | `#3366FF` |
| Worker agent badge | Gray | `#8F9BB3` |
