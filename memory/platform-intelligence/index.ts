/**
 * Platform Intelligence — cross-brand pattern detection and system-level insights.
 *
 * Unlike brand-memory (scoped to one brand), platform intelligence
 * captures learnings that apply across all brands in the FranchiseOS
 * platform:
 *
 * - Which onboarding steps correlate with franchisee success
 * - Common territory scoring patterns that predict conversions
 * - Marketing channel effectiveness across brand categories
 * - Seasonal demand patterns in franchise recruitment
 * - Agent performance patterns (which agents produce best outcomes)
 *
 * This data is anonymized and aggregated — no brand-specific data leaks.
 * Only the PATTERN_DETECTION_AGENT and CEO_AGENT read from this layer.
 */

import { getSupabaseClient } from "../index";

// ── Types ─────────────────────────────────────────────────────

export interface PlatformInsight {
  id: string;
  category: InsightCategory;
  title: string;
  description: string;
  evidence_count: number;
  confidence: number;
  applicable_to: string[];  // brand categories this applies to
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  status: "active" | "deprecated" | "unverified";
}

export type InsightCategory =
  | "onboarding_pattern"
  | "territory_pattern"
  | "marketing_pattern"
  | "seasonal_trend"
  | "agent_performance"
  | "conversion_pattern"
  | "pricing_insight"
  | "churn_predictor";

// ── Store ─────────────────────────────────────────────────────

export async function storeInsight(
  category: InsightCategory,
  insight: {
    title: string;
    description: string;
    evidenceCount: number;
    confidence: number;
    applicableTo?: string[];
    metadata?: Record<string, unknown>;
  },
): Promise<PlatformInsight> {
  const supabase = getSupabaseClient();

  // Platform intelligence uses a special system brand_id (all zeros)
  const PLATFORM_BRAND_ID = "00000000-0000-0000-0000-000000000000";

  const { data, error } = await supabase
    .from("memory_entries")
    .insert({
      brand_id: PLATFORM_BRAND_ID,
      layer: `platform_${category}`,
      content: `${insight.title}\n\n${insight.description}`,
      metadata: {
        category,
        title: insight.title,
        evidence_count: insight.evidenceCount,
        confidence: insight.confidence,
        applicable_to: insight.applicableTo ?? ["all"],
        ...(insight.metadata ?? {}),
      },
      status: "active",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to store platform insight: ${error.message}`);
  }

  return mapToInsight(data);
}

// ── Retrieve ──────────────────────────────────────────────────

export async function getInsights(
  category?: InsightCategory,
  opts: { minConfidence?: number; limit?: number } = {},
): Promise<PlatformInsight[]> {
  const supabase = getSupabaseClient();
  const PLATFORM_BRAND_ID = "00000000-0000-0000-0000-000000000000";

  let query = supabase
    .from("memory_entries")
    .select("*")
    .eq("brand_id", PLATFORM_BRAND_ID)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 50);

  if (category) {
    query = query.eq("layer", `platform_${category}`);
  } else {
    query = query.like("layer", "platform_%");
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to retrieve platform insights: ${error.message}`);
  }

  let results = (data ?? []).map(mapToInsight);

  if (opts.minConfidence) {
    results = results.filter((r) => r.confidence >= opts.minConfidence!);
  }

  return results;
}

/**
 * Get platform insights relevant to a specific brand category
 * (e.g., "education", "fitness", "food_service").
 */
export async function getInsightsForBrandCategory(
  brandCategory: string,
  limit: number = 20,
): Promise<PlatformInsight[]> {
  const all = await getInsights(undefined, { limit: 200 });

  return all
    .filter(
      (i) =>
        i.applicable_to.includes("all") ||
        i.applicable_to.includes(brandCategory),
    )
    .slice(0, limit);
}

/**
 * Increment evidence count when the same pattern is observed again.
 * Increases confidence proportionally.
 */
export async function reinforceInsight(
  insightId: string,
  additionalEvidence: number = 1,
): Promise<void> {
  const supabase = getSupabaseClient();

  const { data: existing, error: readError } = await supabase
    .from("memory_entries")
    .select("metadata")
    .eq("id", insightId)
    .single();

  if (readError) {
    throw new Error(`Failed to read insight: ${readError.message}`);
  }

  const meta = (existing?.metadata ?? {}) as Record<string, unknown>;
  const currentCount = (meta.evidence_count as number) ?? 1;
  const newCount = currentCount + additionalEvidence;

  // Confidence grows logarithmically with evidence, capped at 0.99
  const newConfidence = Math.min(0.99, 0.5 + 0.1 * Math.log2(newCount));

  meta.evidence_count = newCount;
  meta.confidence = newConfidence;

  const { error } = await supabase
    .from("memory_entries")
    .update({ metadata: meta })
    .eq("id", insightId);

  if (error) {
    throw new Error(`Failed to reinforce insight: ${error.message}`);
  }
}

// ── Deprecate ─────────────────────────────────────────────────

export async function deprecateInsight(insightId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from("memory_entries")
    .update({ status: "archived" })
    .eq("id", insightId);

  if (error) {
    throw new Error(`Failed to deprecate insight: ${error.message}`);
  }
}

// ── Helpers ───────────────────────────────────────────────────

function mapToInsight(row: Record<string, unknown>): PlatformInsight {
  const meta = (row.metadata ?? {}) as Record<string, unknown>;
  return {
    id: row.id as string,
    category: (meta.category as InsightCategory) ?? "conversion_pattern",
    title: (meta.title as string) ?? "",
    description: row.content as string,
    evidence_count: (meta.evidence_count as number) ?? 1,
    confidence: (meta.confidence as number) ?? 0.5,
    applicable_to: (meta.applicable_to as string[]) ?? ["all"],
    metadata: meta,
    created_at: row.created_at as string,
    updated_at: (row.updated_at ?? row.created_at) as string,
    status: (row.status as "active" | "deprecated" | "unverified") ?? "active",
  };
}
