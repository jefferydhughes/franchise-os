# Expansion Radar Specification

## Overview

The Expansion Radar is the opportunity detection engine of FranchiseOS. It continuously scans four signal sources to identify geographic areas where franchise expansion is likely to succeed. The radar converts raw data into scored `OpportunitySignal` records that feed the initiative engine, territory scorer, and War Room dashboard.

The radar answers one question: **Where should this brand expand next, and why?**

---

## 1. Core Responsibilities

The Expansion Radar must:

1. Scan four independent signal sources in parallel
2. Score each detected opportunity on a 0-100 confidence scale
3. Deduplicate signals that overlap geographically
4. Emit `opportunity.detected` events to the agent event bus
5. Persist scan metadata for audit and trend analysis
6. Support scheduled scans (cron) and on-demand scans (API trigger)
7. Respect brand-scoped configuration for thresholds and geography

---

## 2. Signal Types

### 2.1 Lead Cluster (`lead_cluster`)

**Source:** `leads` table
**Logic:** Geocode recent leads and run spatial clustering. When a cluster of leads forms outside an active franchise territory, it indicates organic demand in an unserved market.

**Scoring methodology:**
- Cluster size drives base score: `min(100, (cluster_size / 20) * 100)`
- Score >= 70: recommend territory scoring and franchisee recruitment
- Score < 70: monitor cluster growth, schedule feasibility assessment
- Lookback: 180 days
- Minimum cluster size: 5 leads within radius

**Clustering algorithm:**
- Greedy centroid-based grouping using Haversine distance
- Future: DBSCAN via PostGIS extension for production accuracy

### 2.2 Territory Threshold (`territory_threshold`)

**Source:** `territory_scores` table
**Logic:** Detect territories whose composite score has crossed above the viability threshold, indicating they have become strong expansion targets.

**Scoring methodology:**
- Score equals the territory's composite score from `territory-scorer.ts`
- Score >= 85: high-priority expansion target, begin outreach immediately
- Score >= 75: add to expansion pipeline, pair with lead generation
- Only unassigned territories are surfaced (filter out active franchisee assignments)

**Delta tracking (future):**
- Compare current score vs. previous scoring run
- Only surface territories that newly crossed the threshold, not all high-scoring territories

### 2.3 Competitor Closed (`competitor_closed`)

**Source:** `competitor_locations` table
**Logic:** When a competitor closes a location, their customers become available. This is a high-signal event because the market has already been validated by the competitor's prior investment.

**Scoring methodology:**
- Base score: 80 (competitor closures are inherently high-signal)
- Filter: exclude locations within 5km of an existing franchise unit
- Recommended action: run territory scoring, launch targeted advertising

**Data pipeline:**
- Requires `competitor_locations` table to be kept current
- Future: integrate Google Maps Places API or Data Axle for automatic closure detection
- Lookback: 90 days from `last_seen_at`

### 2.4 Search Volume Spike (`search_volume_spike`)

**Source:** `search_signals` table
**Logic:** Monitor brand-related search volume by region. A spike indicates rising consumer awareness or demand that can be captured with a franchise presence.

**Scoring methodology:**
- Percent increase: `((current - previous) / previous) * 100`
- Score: `min(100, 50 + percentIncrease / 4)`
- Spike threshold: >= 50% increase triggers a signal
- Spike >= 100%: urgent demand surge, prioritize immediately
- Spike >= 50%: launch awareness campaign and begin territory evaluation

**Data pipeline:**
- `search_signals` table populated by scheduled data pipeline
- Future: Google Trends API (via SerpApi), Semrush, or Ahrefs integration

---

## 3. Configuration

```typescript
const CONFIG = {
  /** Minimum leads in a geo cluster to trigger a signal */
  LEAD_CLUSTER_MIN_COUNT: 5,

  /** Radius in km to group leads into clusters */
  LEAD_CLUSTER_RADIUS_KM: 15,

  /** Territory score threshold that triggers an opportunity */
  TERRITORY_SCORE_THRESHOLD: 75,

  /** Percent increase in search volume that counts as a spike */
  SEARCH_SPIKE_PERCENT: 50,

  /** How many days back to look for new competitor closures */
  COMPETITOR_CHANGE_LOOKBACK_DAYS: 90,
};
```

### Brand-Level Overrides

Brands can override default thresholds via `brands/{brand}/territory_rules.json`:

```json
{
  "radar_config": {
    "lead_cluster_min_count": 3,
    "lead_cluster_radius_km": 10,
    "territory_score_threshold": 80,
    "search_spike_percent": 40,
    "competitor_lookback_days": 60,
    "scan_frequency_hours": 6,
    "max_signals_per_scan": 50
  }
}
```

---

## 4. Data Models

### OpportunitySignal

```typescript
interface OpportunitySignal {
  id: string;                    // UUID
  type: SignalType;              // 'lead_cluster' | 'territory_threshold' | 'competitor_closed' | 'search_volume_spike'
  location: GeoLocation;
  score: number;                 // 0-100 confidence/priority score
  summary: string;               // Human-readable description
  recommended_action: string;    // Suggested next step
  created_at: string;            // ISO 8601
}
```

### GeoLocation

```typescript
interface GeoLocation {
  lat: number;
  lng: number;
  label?: string;    // City/region name for display
}
```

### SignalConfig

```typescript
interface SignalConfig {
  lead_cluster_min_count: number;
  lead_cluster_radius_km: number;
  territory_score_threshold: number;
  search_spike_percent: number;
  competitor_lookback_days: number;
  scan_frequency_hours: number;
  max_signals_per_scan: number;
}
```

### ScanResult

```typescript
interface ScanResult {
  id: string;
  brand_id: string;
  scanned_at: string;
  total_signals: number;
  by_type: Record<SignalType, number>;
  top_score: number;
  signals: OpportunitySignal[];
}
```

### Supporting Data Types

```typescript
interface LeadRecord {
  id: string;
  lat: number;
  lng: number;
  brand_id: string;
  created_at: string;
  status: string;
  city?: string;
}

interface TerritoryScoreRecord {
  id: string;
  brand_id: string;
  lat: number;
  lng: number;
  radius_km: number;
  score: number;
  grade: string;
  scored_at: string;
  region_label?: string;
}

interface CompetitorLocation {
  id: string;
  brand_id: string;
  competitor_name: string;
  lat: number;
  lng: number;
  status: string;         // 'active' | 'closed' | 'unknown'
  last_seen_at: string;
  city?: string;
}

interface SearchVolumeRecord {
  region: string;
  lat: number;
  lng: number;
  current_volume: number;
  previous_volume: number;
  brand_id: string;
  period: string;          // e.g., '2026-02'
}
```

---

## 5. API Contracts

### POST /api/radar/scan

Triggers an on-demand scan for a brand. Returns all detected signals sorted by score.

**Request body:**
```json
{
  "brandId": "skill-samurai",
  "signalTypes": ["lead_cluster", "territory_threshold", "competitor_closed", "search_volume_spike"],
  "configOverrides": {
    "territory_score_threshold": 80
  }
}
```

- `signalTypes` is optional; defaults to all four types.
- `configOverrides` is optional; merges with default + brand config.

**Response:**
```json
{
  "scan_id": "uuid",
  "brand_id": "skill-samurai",
  "scanned_at": "2026-03-08T10:00:00Z",
  "total_signals": 4,
  "by_type": {
    "lead_cluster": 1,
    "territory_threshold": 2,
    "competitor_closed": 0,
    "search_volume_spike": 1
  },
  "top_score": 87,
  "signals": [
    {
      "id": "uuid",
      "type": "territory_threshold",
      "location": { "lat": 32.9483, "lng": -96.7299, "label": "Dallas North" },
      "score": 87,
      "summary": "Territory scored 87/100 (Grade A) and is unassigned.",
      "recommended_action": "High-priority expansion target.",
      "created_at": "2026-03-08T10:00:00Z"
    }
  ]
}
```

### GET /api/radar/signals

Returns recent signals for a brand, with optional filters.

**Query parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `brandId` | string (required) | Brand to filter by |
| `type` | SignalType (optional) | Filter by signal type |
| `minScore` | number (optional) | Minimum signal score |
| `since` | ISO 8601 (optional) | Only signals after this timestamp |
| `limit` | number (optional) | Max results (default 50) |

**Response:**
```json
{
  "signals": [ ... ],
  "total": 12,
  "filters_applied": { "brandId": "skill-samurai", "minScore": 70 }
}
```

### GET /api/radar/scans

Returns scan history for a brand.

**Query parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `brandId` | string (required) | Brand to filter by |
| `limit` | number (optional) | Max results (default 20) |

**Response:**
```json
{
  "scans": [
    {
      "id": "uuid",
      "scanned_at": "2026-03-08T10:00:00Z",
      "total_signals": 4,
      "by_type": { "lead_cluster": 1, "territory_threshold": 2, "competitor_closed": 0, "search_volume_spike": 1 },
      "top_score": 87
    }
  ]
}
```

---

## 6. Integration Points

### leads table
Lead cluster analysis queries the `leads` table for geocoded leads created within the lookback window. Leads must have `lat`/`lng` fields populated (via geocoding at ingestion or enrichment by Lead Intelligence Agent).

### territory_scores table
Territory threshold analysis queries `territory_scores` for scores above the configured threshold. Scores are written by `territory-scorer.ts`.

### competitor_locations table
Competitor closure detection queries `competitor_locations` for records with `status = 'closed'` within the lookback window. This table must be populated by a data pipeline or manual entry.

### search_signals table
Search volume spike detection queries `search_signals` for records with significant period-over-period increases. This table must be populated by a scheduled data pipeline (Google Trends, Semrush, etc.).

### agent_events table
Every detected signal is emitted as an `opportunity.detected` event to the `agent_events` table. This triggers downstream dispatch rules:
- `TERRITORY_INTELLIGENCE_AGENT` — scores the territory
- `INITIATIVE_AGENT` — evaluates whether to create an initiative
- `CRO_AGENT` / `CMO_AGENT` — strategic assessment

### radar_scans table
Scan metadata (timestamp, signal counts, top score) is persisted for trend analysis and audit.

### initiative-engine
High-scoring signals flow to the initiative engine via `market.opportunity.detected` events. The initiative engine evaluates gates (registration, territory availability, strategy alignment) before launching action.

### War Room Dashboard — OpportunityRadar widget
The dashboard's OpportunityRadar widget calls `GET /api/radar/signals` to display the latest expansion opportunities. Clicking a signal centers the Territory Heatmap on the signal's location.

---

## 7. Implementation Notes

### Parallel Scanning
All four signal sources are scanned concurrently using `Promise.all()`. This minimizes total scan time and ensures one slow data source does not block others.

### Event Emission
Each detected signal is written to `agent_events` as an individual event. Events include the full signal payload so downstream agents have all context without additional queries.

### Deduplication
Signals are deduplicated within a scan by geographic proximity:
- Two signals within 5km of each other and of the same type are merged
- The higher-scoring signal is kept; the lower is discarded
- Cross-type signals at the same location are kept (they represent different evidence)

Future: cross-scan deduplication using a sliding window to avoid re-emitting signals for the same location on consecutive scans.

### Scheduled Scans
Scans are triggered by:
1. **Cron schedule:** Default every 6 hours via Supabase Edge Function or external scheduler
2. **Event trigger:** `traffic.heatmap.updated` event triggers an immediate scan
3. **Manual trigger:** `POST /api/radar/scan` from the dashboard or AI Command Bar

### Error Handling
- Individual signal source failures do not block other sources
- Failed sources return empty arrays and log warnings
- Scan metadata records partial results with error annotations
- Retry logic: 3 attempts with exponential backoff per data source

### Performance
- Lead cluster analysis is the most expensive operation (O(n^2) naive clustering)
- For brands with 10,000+ leads, implement spatial indexing via PostGIS
- Territory threshold check is a simple filtered query (fast)
- Competitor and search volume checks are bounded by lookback window
- Target scan time: under 5 seconds for a brand with 1,000 leads
