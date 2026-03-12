import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase";
import { getModel } from "@/lib/model-router";
import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";
import type { ModelTier } from "@/types/franchise-os";

// ---------------------------------------------------------------------------
// Agent persona loader (reads from swarm/agents/*.md at repo root)
// ---------------------------------------------------------------------------

const AGENTS_DIR = path.resolve(process.cwd(), "..", "swarm", "agents");

function loadAgentPersona(agentSlug: string): string | null {
  // Try multiple paths since cwd may vary in different deploy environments
  const candidates = [
    path.join(AGENTS_DIR, `${agentSlug}.md`),
    path.resolve(process.cwd(), "swarm", "agents", `${agentSlug}.md`),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, "utf-8");
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Brand resolver
// ---------------------------------------------------------------------------

async function resolveBrand(orgId: string | null | undefined) {
  const supabase = createServerClient();

  if (orgId) {
    const { data } = await supabase
      .from("brands")
      .select("*")
      .eq("clerk_org_id", orgId)
      .maybeSingle();
    if (data) return data;
  }

  const { data } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", "skill-samurai")
    .maybeSingle();

  return data;
}

// ---------------------------------------------------------------------------
// Memory context loader (inline — avoids importing swarm/ from Next.js)
// ---------------------------------------------------------------------------

async function loadMemoryContext(
  agentSlug: string,
  brandId: string,
): Promise<string> {
  try {
    const supabase = createServerClient();

    const [brandMem, strategicMem, episodicMem] = await Promise.all([
      supabase
        .from("memory_entries")
        .select("title, content")
        .eq("brand_id", brandId)
        .eq("layer", "brand")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("memory_entries")
        .select("title, content")
        .eq("brand_id", brandId)
        .eq("layer", "strategic")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("memory_entries")
        .select("title, content")
        .eq("brand_id", brandId)
        .eq("layer", "episodic")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const format = (label: string, entries: any[]) => {
      if (!entries?.length) return "";
      const lines = entries.map(
        (e: any) => `  - ${e.title ? `[${e.title}] ` : ""}${e.content}`,
      );
      return `=== ${label} ===\n${lines.join("\n")}`;
    };

    const blocks = [
      format("Brand Context", brandMem.data ?? []),
      format("Strategic Context", strategicMem.data ?? []),
      format("Recent Activity", episodicMem.data ?? []),
    ].filter(Boolean);

    return blocks.length > 0
      ? `--- Memory Context for ${agentSlug} ---\n${blocks.join("\n\n")}`
      : `[No prior context available for agent "${agentSlug}"]`;
  } catch {
    return `[Memory unavailable for agent "${agentSlug}"]`;
  }
}

// ---------------------------------------------------------------------------
// POST /api/agents/execute
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized — please sign in" },
        { status: 401 },
      );
    }

    const brand = await resolveBrand(orgId);
    if (!brand) {
      return NextResponse.json(
        { error: "No brand found" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const { agent_slug, event_type, payload, model_tier } = body;

    if (!agent_slug || !event_type) {
      return NextResponse.json(
        { error: "Missing required fields: agent_slug, event_type" },
        { status: 400 },
      );
    }

    // Load agent persona
    const persona = loadAgentPersona(agent_slug);
    if (!persona) {
      return NextResponse.json(
        { error: `Agent persona not found: ${agent_slug}` },
        { status: 404 },
      );
    }

    // Load memory context
    const memoryContext = await loadMemoryContext(agent_slug, brand.id);

    // Determine model
    const tier: ModelTier = model_tier ?? "operational";
    const model = getModel(tier);

    // Compose system prompt
    const systemPrompt = [
      persona,
      "",
      "--- MEMORY CONTEXT ---",
      memoryContext,
      "",
      "--- INSTRUCTIONS ---",
      "You are being invoked by the FranchiseOS swarm in response to a real event.",
      `Brand: ${brand.name} (ID: ${brand.id})`,
      "Analyze the event data below and provide your response.",
      "Be specific, actionable, and grounded in the data provided.",
    ].join("\n");

    // Compose user message
    const userMessage = [
      `EVENT TYPE: ${event_type}`,
      `BRAND: ${brand.name}`,
      "",
      "EVENT PAYLOAD:",
      JSON.stringify(payload ?? {}, null, 2),
    ].join("\n");

    // Call Claude
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
    const start = Date.now();

    const response = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const durationMs = Date.now() - start;
    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as any).text)
      .join("\n");

    // Record agent event
    const supabase = createServerClient();
    const { data: eventRecord, error: insertError } = await supabase
      .from("agent_events")
      .insert({
        brand_id: brand.id,
        agent_name: agent_slug,
        event_type,
        payload: payload ?? {},
        status: "completed",
        result: { response: text.slice(0, 10000) },
        model_tier: tier,
        model_used: model,
        duration_ms: durationMs,
        processed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to record agent event:", insertError.message);
    }

    // Store episodic memory
    await supabase.from("memory_entries").insert({
      brand_id: brand.id,
      layer: "episodic",
      title: `${agent_slug}: ${event_type}`,
      content: `Agent "${agent_slug}" processed "${event_type}" — ${text.slice(0, 500)}`,
      metadata: {
        agent_name: agent_slug,
        event_type,
        model_used: model,
        duration_ms: durationMs,
      },
      status: "active",
    });

    return NextResponse.json({
      agent: agent_slug,
      model,
      tier,
      durationMs,
      response: text,
      eventId: eventRecord?.id ?? null,
      brandId: brand.id,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Agent execute error:", errMsg);
    return NextResponse.json(
      { error: "Agent execution failed", detail: errMsg },
      { status: 500 },
    );
  }
}
