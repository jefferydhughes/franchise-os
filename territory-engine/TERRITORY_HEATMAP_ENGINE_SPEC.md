# Territory Heatmap Engine Specification

## Overview

The Territory Heatmap Engine is the geospatial intelligence layer of FranchiseOS. It renders an interactive map that allows leadership and the AI swarm to visualize where demand is rising, where franchises exist, where territories are open, where opportunities cluster, and where campaigns should launch.

The heatmap is both:

- a visualization layer for human operators
- a swarm intelligence input surface for agents

---

## 1. Core Responsibilities

The Territory Heatmap must:

1. Display franchise territories with status-coded markers
2. Visualize opportunity scores as heat overlays
3. Show live demand signals from lead and search data
4. Show lead density clusters on the map
5. Show campaign activity zones
6. Allow market drill-down from region to territory to unit level
7. Emit events when markets are inspected by a human operator
8. Support swarm-triggered map updates via Supabase Realtime

---

## 2. Technology Choice

### Map Engine

**Primary:** Mapbox GL JS
- WebGL-accelerated rendering for smooth heatmap overlays
- Built-in support for GeoJSON layers, clustering, and custom markers
- Terrain and satellite imagery for territory context
- Flyto, zoom, and bearing animations for drill-down

**Fallback:** Leaflet + leaflet-heat
- Used when Mapbox token is unavailable or for cost-sensitive deployments
- Plugin-based heatmap via `leaflet.heat`
- Requires manual clustering implementation

### Data Transport

- **Supabase Realtime:** WebSocket subscriptions on `territories`, `leads`, and `agent_events` tables for live updates
- **REST API:** Initial data load via server-side fetch; client hydrates the map on mount
- **Edge Functions:** Territory score recalculations triggered by event bus

---

## 3. Map Layers

The heatmap supports five toggleable heat layers. Each layer draws data from a different source and uses a distinct color gradient.

### 3.1 Traffic Heat

**Source:** `search_signals` table, Google Analytics data pipeline
**Color gradient:** Blue (low) to Red (high)
**Description:** Visualizes web traffic and search volume by geographic region. High-traffic areas without a franchise unit indicate demand gaps.

### 3.2 Lead Heat

**Source:** `leads` table, geocoded by city/zip
**Color gradient:** Green (low) to Yellow (high)
**Description:** Shows density of inbound lead activity. Clusters of leads outside active territories signal expansion targets.

### 3.3 Revenue Heat

**Source:** `payments` table, aggregated by territory
**Color gradient:** Teal (low) to Gold (high)
**Description:** Visualizes revenue contribution per territory. Highlights top-performing and underperforming territories.

### 3.4 Opportunity Heat

**Source:** `initiatives` table where type = `market_expansion`, expansion-radar signals
**Color gradient:** Cyan (low) to Magenta (high)
**Description:** Overlays detected expansion opportunities from the radar engine. Bright spots indicate high-confidence opportunities the swarm has identified.

### 3.5 Underperformance Heat

**Source:** `franchisees` table where `performance_data.health_score < threshold`
**Color gradient:** Yellow (mild) to Red (critical)
**Description:** Highlights territories where active franchise units are underperforming. Triggers coaching and recovery initiatives.

---

## 4. Territory Markers

Each territory is rendered as a circular marker or polygon with color-coded status:

| Color | Status | Description |
|-------|--------|-------------|
| Green | `active` | Franchise unit operating in this territory |
| Yellow | `open` | Territory scored and available for sale |
| Red | `saturated` | Territory at capacity or conflict detected |
| Blue | `initiative` | Active swarm initiative targeting this territory |
| Gray | `reserved` | Territory reserved but not yet activated |

Marker click opens a territory detail panel with:
- Territory name and region
- Current score and grade (A/B/C/D)
- Breakdown of scoring dimensions
- Active franchisee (if any)
- Recent agent activity
- Link to full territory profile

---

## 5. Component API

### TerritoryHeatmap

```typescript
interface TerritoryHeatmapProps {
  /** Brand to display territories for */
  brandId: string;

  /** Currently selected territory ID (highlights on map) */
  selectedTerritory?: string;

  /** Callback when a territory marker is clicked */
  onTerritoryClick?: (territoryId: string) => void;

  /** Which heat layers to display (defaults to all enabled) */
  layers?: HeatmapLayerType[];

  /** Initial map center [lat, lng] */
  center?: [number, number];

  /** Initial zoom level (default: 4 for country view) */
  zoom?: number;

  /** Enable Supabase Realtime subscriptions (default: true) */
  realtime?: boolean;

  /** CSS class name for the map container */
  className?: string;
}

type HeatmapLayerType =
  | 'traffic'
  | 'leads'
  | 'revenue'
  | 'opportunity'
  | 'underperformance';
```

### HeatmapLayerToggle

```typescript
interface HeatmapLayerToggleProps {
  /** Currently active layers */
  activeLayers: HeatmapLayerType[];

  /** Callback when layers are toggled */
  onToggle: (layers: HeatmapLayerType[]) => void;
}
```

### TerritoryDetailPanel

```typescript
interface TerritoryDetailPanelProps {
  /** Territory ID to display details for */
  territoryId: string;

  /** Brand context */
  brandId: string;

  /** Close callback */
  onClose: () => void;
}
```

---

## 6. Data Models

### Territory

Matches the `territories` Supabase table:

```typescript
interface Territory {
  id: string;
  brand_id: string;
  name: string;
  region: string;
  geo_data: {
    center: { lat: number; lng: number };
    radius_km: number;
    city: string;
    state: string;
    country: string;
    polygon?: GeoJSON.Polygon; // optional boundary polygon
  };
  demographics: {
    population: number;
    households: number;
    median_income: number;
    school_count?: number;
    family_density_score?: number;
    school_density_score?: number;
  };
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  status: 'open' | 'reserved' | 'active' | 'saturated';
  created_at: string;
  updated_at: string;
}
```

### TerritoryScore

Output from `territory-scorer.ts`:

```typescript
interface TerritoryScore {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  breakdown: {
    populationDensity: DimensionScore;
    medianIncome: DimensionScore;
    competitorProximity: DimensionScore;
    franchiseSaturation: DimensionScore;
    trafficSearchSignal: DimensionScore;
  };
  recommendation: string;
}

interface DimensionScore {
  raw: number;
  normalized: number;
  weight: number;
  weighted: number;
  details: string;
}
```

### HeatmapLayer

```typescript
interface HeatmapLayer {
  type: HeatmapLayerType;
  label: string;
  description: string;
  colorGradient: string[];
  dataSource: string; // Supabase table name
  enabled: boolean;
  opacity: number; // 0.0 to 1.0
  intensity: number; // Mapbox heatmap-intensity value
  radius: number; // Mapbox heatmap-radius in pixels
}
```

### HeatmapDataPoint

```typescript
interface HeatmapDataPoint {
  lat: number;
  lng: number;
  weight: number; // 0.0 to 1.0 intensity
  metadata?: Record<string, unknown>;
}
```

---

## 7. API Contracts

### GET /api/territories

Returns all territories for a brand with their current scores and status.

**Query parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `brandId` | string (required) | Brand to filter by |
| `status` | string (optional) | Filter by territory status |
| `minScore` | number (optional) | Minimum territory score |
| `region` | string (optional) | Filter by region name |

**Response:**
```json
{
  "territories": [
    {
      "id": "uuid",
      "name": "Dallas North",
      "region": "Texas",
      "geo_data": { "center": { "lat": 32.9483, "lng": -96.7299 }, "radius_km": 12 },
      "score": 81.0,
      "grade": "A",
      "status": "open",
      "demographics": { "population": 92000, "median_income": 78000 }
    }
  ],
  "total": 3
}
```

### GET /api/territories/:id/score

Returns the detailed scoring breakdown for a single territory.

**Response:**
```json
{
  "territory_id": "uuid",
  "score": 81.0,
  "grade": "A",
  "breakdown": {
    "populationDensity": { "raw": 3200, "normalized": 64.0, "weight": 0.25, "weighted": 16.0, "details": "..." },
    "medianIncome": { "raw": 78000, "normalized": 85.0, "weight": 0.20, "weighted": 17.0, "details": "..." },
    "competitorProximity": { "raw": 2, "normalized": 95.0, "weight": 0.20, "weighted": 19.0, "details": "..." },
    "franchiseSaturation": { "raw": 0, "normalized": 100.0, "weight": 0.20, "weighted": 20.0, "details": "..." },
    "trafficSearchSignal": { "raw": 6000, "normalized": 60.0, "weight": 0.15, "weighted": 9.0, "details": "..." }
  },
  "recommendation": "Strong territory candidate...",
  "scored_at": "2026-03-08T10:00:00Z"
}
```

### GET /api/territories/:id/heatmap-data

Returns heatmap data points for a specific layer within a territory's geographic bounds.

**Query parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `layer` | HeatmapLayerType (required) | Which heat layer to fetch data for |
| `resolution` | string (optional) | `low`, `medium`, `high` — controls point density |

**Response:**
```json
{
  "layer": "leads",
  "points": [
    { "lat": 32.95, "lng": -96.73, "weight": 0.8 },
    { "lat": 32.94, "lng": -96.72, "weight": 0.5 }
  ],
  "bounds": {
    "north": 33.05,
    "south": 32.84,
    "east": -96.62,
    "west": -96.84
  }
}
```

### POST /api/territories/:id/inspect

Emits a `territory.inspected` event when a human operator clicks into a territory on the map. This allows the swarm to detect operator interest patterns.

**Request body:**
```json
{
  "brandId": "skill-samurai",
  "userId": "clerk_user_id",
  "context": "war-room-heatmap"
}
```

**Response:**
```json
{
  "event_id": "evt_abc123",
  "event_type": "territory.inspected",
  "acknowledged": true
}
```

---

## 8. Integration Points

### territory-scorer.ts
The heatmap displays scores computed by the territory scoring engine. When a territory is selected, the component fetches the full breakdown from `territory-scorer.ts` via the `/api/territories/:id/score` endpoint.

### expansion-radar
Opportunity heat layer data comes from the expansion radar's `scanForOpportunities()` output. Detected signals are plotted as intensity points on the opportunity heat layer.

### initiative-engine
Territories with active initiatives are marked with blue status. The heatmap subscribes to `initiative.created` and `initiative.review.completed` events to update markers in real-time.

### War Room Dashboard
The heatmap is Widget 2 in the War Room layout. It communicates with other widgets:
- **OpportunityRadar** — clicking a radar signal flies the map to that location
- **InitiativeBoard** — selecting an initiative highlights its target territory
- **AI Command Bar** — location-based queries center the map on the relevant area

### Supabase Realtime
The component subscribes to changes on:
- `territories` — status and score updates
- `leads` — new lead creation for lead heat layer
- `agent_events` — opportunity and initiative events

---

## 9. Implementation Notes

### Server-Side Data Fetch
- Territory list and scores are fetched server-side in the Next.js page component
- Data is passed as props to the client-side map component
- This ensures fast initial render and SEO-friendly territory pages

### Client-Side Map Rendering
- Mapbox GL JS runs entirely on the client (requires `use client` directive)
- Map is lazy-loaded with dynamic import to avoid SSR issues
- Initial viewport is calculated from the brand's territory bounding box

### Performance Optimization
- Heatmap data points are decimated at low zoom levels (show aggregates)
- Territory markers use Mapbox clustering for brands with 50+ territories
- Layer data is fetched on-demand when a layer is toggled on
- WebSocket subscriptions are scoped to the current brand to minimize traffic

### Responsive Design
- Desktop: Full map with side panel for territory details
- Tablet: Map with bottom sheet for details
- Mobile: Simplified map with tap-to-expand markers, single layer at a time

### Accessibility
- Map includes ARIA labels for territory markers
- Layer toggle buttons use proper `role="switch"` semantics
- Territory data is also available in a table view for screen reader users
- Keyboard navigation supports tab-through of territory markers

---

## 10. Event Emissions

The heatmap component emits the following events to the event bus:

| Event | Trigger | Payload |
|-------|---------|---------|
| `territory.inspected` | User clicks a territory marker | `{ territory_id, user_id, context }` |
| `heatmap.layer.toggled` | User enables/disables a layer | `{ layer, enabled, user_id }` |
| `heatmap.region.zoomed` | User zooms into a specific region | `{ bounds, zoom_level, user_id }` |

These events allow the swarm to track operator attention patterns and surface relevant intelligence proactively.
