/**
 * Decision Logs — structured record of every significant decision
 * made by agents in the FranchiseOS swarm.
 *
 * Captures:
 * - What decision was made and by which agent
 * - The reasoning / evidence that led to the decision
 * - The outcome (updated after the fact)
 * - Links to the initiative or event that triggered it
 *
 * Decision logs feed back into agent context so the swarm
 * learns from its own history and avoids repeating mistakes.
 */

import { getSupabaseClient } from "../index";

// ── Types ─────────────────────────────────────────────────────

export interface DecisionLogEntry {
  id: string;
  brand_id: string;
  agent_name: string;
  decision_type: DecisionType;
  title: string;
  reasoning: string;
  evidence: string[];
  confidence: number;
  outcome: DecisionOutcome | null;
  outcome_notes: string | null;
  correlation_id: string | null;
  initiative_id: string | null;
  created_at: string;
  resolved_at: string | null;
}

export type DecisionType =
  | "territory_expansion"
  | "campaign_launch"
  | "campaign_pause"
  | "lead_prioritization"
  | "budget_allocation"
  | "agent_escalation"
  | "compliance_action"
  | "franchisee_intervention"
  | "strategy_adjustment"
  | "model_routing";

export type DecisionOutcome =
  | "success"
  | "partial_success"
  | "failure"
  | "cancelled"
  | "pending";

// ── Log a Decision ────────────────────────────────────────────

export async function logDecision(
  brandId: string,
  agentName: string,
  decision: {
    type: DecisionType;
    title: string;
    reasoning: string;
    evidence: string[];
    confidence: number;
    correlationId?: string;
    initiativeId?: string;
  },
): Promise<DecisionLogEntry> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("memory_entries")
    .insert({
      brand_id: brandId,
      layer: "decision_log",
      content: `[${decision.type}] ${decision.title}\n\n${decision.reasoning}`,
      metadata: {
        agent_name: agentName,
        decision_type: decision.type,
        title: decision.title,
        reasoning: decision.reasoning,
        evidence: decision.evidence,
        confidence: decision.confidence,
        correlation_id: decision.correlationId ?? null,
        initiative_id: decision.initiativeId ?? null,
        outcome: null,
        outcome_notes: null,
        resolved_at: null,
      },
      status: "active",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to log decision: ${error.message}`);
  }

  return mapToDecisionLog(data);
}

// ── Record Outcome ────────────────────────────────────────────

export async function recordDecisionOutcome(
  decisionId: string,
  outcome: DecisionOutcome,
  notes: string,
): Promise<void> {
  const supabase = getSupabaseClient();

  // We need to read then update the metadata JSONB
  const { data: existing, error: readError } = await supabase
    .from("memory_entries")
    .select("metadata")
    .eq("id", decisionId)
    .single();

  if (readError) {
    throw new Error(`Failed to read decision: ${readError.message}`);
  }

  const meta = (existing?.metadata ?? {}) as Record<string, unknown>;
  meta.outcome = outcome;
  meta.outcome_notes = notes;
  meta.resolved_at = new Date().toISOString();

  const { error } = await supabase
    .from("memory_entries")
    .update({ metadata: meta })
    .eq("id", decisionId);

  if (error) {
    throw new Error(`Failed to record decision outcome: ${error.message}`);
  }
}

// ── Query ─────────────────────────────────────────────────────

export async function getDecisionLog(
  brandId: string,
  opts: {
    agentName?: string;
    decisionType?: DecisionType;
    outcome?: DecisionOutcome;
    limit?: number;
  } = {},
): Promise<DecisionLogEntry[]> {
  const supabase = getSupabaseClient();

  let query = supabase
    .from("memory_entries")
    .select("*")
    .eq("brand_id", brandId)
    .eq("layer", "decision_log")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 50);

  if (opts.agentName) {
    query = query.eq("metadata->>agent_name", opts.agentName);
  }
  if (opts.decisionType) {
    query = query.eq("metadata->>decision_type", opts.decisionType);
  }
  if (opts.outcome) {
    query = query.eq("metadata->>outcome", opts.outcome);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to query decision log: ${error.message}`);
  }

  return (data ?? []).map(mapToDecisionLog);
}

/**
 * Get decisions related to a specific initiative for outcome review.
 */
export async function getDecisionsForInitiative(
  initiativeId: string,
): Promise<DecisionLogEntry[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("memory_entries")
    .select("*")
    .eq("layer", "decision_log")
    .eq("metadata->>initiative_id", initiativeId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to get initiative decisions: ${error.message}`);
  }

  return (data ?? []).map(mapToDecisionLog);
}

/**
 * Summarize recent decision outcomes for an agent to learn from.
 * Returns the last N decisions grouped by outcome.
 */
export async function getAgentDecisionSummary(
  brandId: string,
  agentName: string,
  limit: number = 20,
): Promise<{
  total: number;
  success_rate: number;
  recent: DecisionLogEntry[];
}> {
  const decisions = await getDecisionLog(brandId, { agentName, limit });

  const resolved = decisions.filter((d) => d.outcome !== null);
  const successes = resolved.filter(
    (d) => d.outcome === "success" || d.outcome === "partial_success",
  );

  return {
    total: decisions.length,
    success_rate: resolved.length > 0 ? successes.length / resolved.length : 0,
    recent: decisions,
  };
}

// ── Helpers ───────────────────────────────────────────────────

function mapToDecisionLog(row: Record<string, unknown>): DecisionLogEntry {
  const meta = (row.metadata ?? {}) as Record<string, unknown>;
  return {
    id: row.id as string,
    brand_id: row.brand_id as string,
    agent_name: (meta.agent_name as string) ?? "unknown",
    decision_type: (meta.decision_type as DecisionType) ?? "strategy_adjustment",
    title: (meta.title as string) ?? "",
    reasoning: (meta.reasoning as string) ?? "",
    evidence: (meta.evidence as string[]) ?? [],
    confidence: (meta.confidence as number) ?? 0,
    outcome: (meta.outcome as DecisionOutcome) ?? null,
    outcome_notes: (meta.outcome_notes as string) ?? null,
    correlation_id: (meta.correlation_id as string) ?? null,
    initiative_id: (meta.initiative_id as string) ?? null,
    created_at: row.created_at as string,
    resolved_at: (meta.resolved_at as string) ?? null,
  };
}
