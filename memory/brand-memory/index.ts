/**
 * Brand Memory — per-brand knowledge store
 *
 * Stores and retrieves brand-scoped institutional knowledge:
 * voice guidelines, campaign history, market learnings,
 * franchisee patterns, and competitive intelligence.
 *
 * Each brand has an isolated memory namespace so multi-tenant
 * retrieval never leaks data across brands.
 */

import { getSupabaseClient } from "../index";

// ── Types ─────────────────────────────────────────────────────

export interface BrandMemoryEntry {
  id: string;
  brand_id: string;
  category: BrandMemoryCategory;
  key: string;
  content: string;
  metadata: Record<string, unknown>;
  confidence: number;
  source_agent: string;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}

export type BrandMemoryCategory =
  | "voice"          // brand voice learnings
  | "campaign"       // campaign outcomes & patterns
  | "market"         // market-level intelligence
  | "competitor"     // competitive positioning data
  | "franchisee"     // franchisee behavior patterns
  | "territory"      // territory-specific knowledge
  | "product"        // product/service insights
  | "compliance";    // regulatory & compliance notes

// ── Store ─────────────────────────────────────────────────────

export async function storeBrandMemory(
  brandId: string,
  category: BrandMemoryCategory,
  key: string,
  content: string,
  opts: {
    metadata?: Record<string, unknown>;
    confidence?: number;
    sourceAgent?: string;
    ttlDays?: number;
  } = {},
): Promise<BrandMemoryEntry> {
  const supabase = getSupabaseClient();

  const expiresAt = opts.ttlDays
    ? new Date(Date.now() + opts.ttlDays * 86_400_000).toISOString()
    : null;

  // Upsert by brand_id + category + key so repeated writes update
  const { data, error } = await supabase
    .from("memory_entries")
    .upsert(
      {
        brand_id: brandId,
        layer: `brand_${category}`,
        content,
        metadata: {
          category,
          key,
          confidence: opts.confidence ?? 0.8,
          source_agent: opts.sourceAgent ?? "system",
          ...(opts.metadata ?? {}),
        },
        status: "active",
        expires_at: expiresAt,
      },
      { onConflict: "brand_id,layer" },
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to store brand memory: ${error.message}`);
  }

  return mapToBrandMemory(data);
}

// ── Retrieve ──────────────────────────────────────────────────

export async function getBrandMemory(
  brandId: string,
  category: BrandMemoryCategory,
  key?: string,
): Promise<BrandMemoryEntry[]> {
  const supabase = getSupabaseClient();

  let query = supabase
    .from("memory_entries")
    .select("*")
    .eq("brand_id", brandId)
    .eq("layer", `brand_${category}`)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (key) {
    query = query.eq("metadata->>key", key);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to retrieve brand memory: ${error.message}`);
  }

  return (data ?? []).map(mapToBrandMemory);
}

/**
 * Get all active brand memories across all categories, useful
 * for injecting full brand context into an agent prompt.
 */
export async function getFullBrandContext(
  brandId: string,
): Promise<Record<BrandMemoryCategory, BrandMemoryEntry[]>> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("memory_entries")
    .select("*")
    .eq("brand_id", brandId)
    .like("layer", "brand_%")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to retrieve full brand context: ${error.message}`);
  }

  const grouped: Record<string, BrandMemoryEntry[]> = {};
  for (const row of data ?? []) {
    const cat = (row.layer as string).replace("brand_", "");
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(mapToBrandMemory(row));
  }

  return grouped as Record<BrandMemoryCategory, BrandMemoryEntry[]>;
}

// ── Expire / Archive ──────────────────────────────────────────

export async function expireBrandMemory(
  brandId: string,
  category: BrandMemoryCategory,
  key: string,
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from("memory_entries")
    .update({ status: "archived" })
    .eq("brand_id", brandId)
    .eq("layer", `brand_${category}`)
    .eq("metadata->>key", key);

  if (error) {
    throw new Error(`Failed to expire brand memory: ${error.message}`);
  }
}

// ── Helpers ───────────────────────────────────────────────────

function mapToBrandMemory(row: Record<string, unknown>): BrandMemoryEntry {
  const meta = (row.metadata ?? {}) as Record<string, unknown>;
  return {
    id: row.id as string,
    brand_id: row.brand_id as string,
    category: (meta.category ?? "market") as BrandMemoryCategory,
    key: (meta.key ?? "") as string,
    content: row.content as string,
    metadata: meta,
    confidence: (meta.confidence as number) ?? 0.8,
    source_agent: (meta.source_agent as string) ?? "system",
    created_at: row.created_at as string,
    updated_at: (row.updated_at ?? row.created_at) as string,
    expires_at: (row.expires_at as string) ?? null,
  };
}
