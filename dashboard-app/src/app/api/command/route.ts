import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

export async function POST(req: NextRequest) {
  try {
    const { message, brandId } = await req.json();

    if (!message || !brandId) {
      return NextResponse.json(
        { error: "Missing required fields: message, brandId" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const anthropic = getAnthropic();

    // Fetch brand info
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("*")
      .eq("id", brandId)
      .single();

    if (brandError) {
      console.error("Error fetching brand:", brandError);
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      );
    }

    // Fetch recent agent events for context
    const { data: recentEvents } = await supabase
      .from("agent_events")
      .select("id, agent_name, event_type, payload, created_at")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false })
      .limit(10);

    const eventsContext = recentEvents?.length
      ? recentEvents
          .map(
            (e) =>
              `[${e.created_at}] ${e.agent_name} — ${e.event_type}: ${JSON.stringify(e.payload)}`
          )
          .join("\n")
      : "No recent agent activity.";

    const systemPrompt = `You are the FranchiseOS Command Center AI — the central intelligence layer for the "${brand.name}" franchise network.

You help franchise operators manage territories, track leads, run campaigns, and coordinate AI agents across the system.

Current brand context:
- Brand: ${brand.name}
- Brand ID: ${brand.id}
- Config: ${JSON.stringify(brand.config ?? {})}

Recent agent activity:
${eventsContext}

Available tables: brands, territories, franchisees, leads, initiatives, agent_events, memory_entries, campaigns.

When responding:
1. Be concise and actionable.
2. If the user's request maps to a concrete action, include an "actions" array in your response with objects like { "type": "navigate" | "query" | "dispatch_agent" | "create", "label": "human-readable label", "payload": { ...relevant data } }.
3. Reference real data from the context when possible.
4. If you don't have enough information, say so and suggest what to look up.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: message }],
    });

    // Extract text content from the response
    const textBlock = response.content.find((block) => block.type === "text");
    const rawText = textBlock?.type === "text" ? textBlock.text : "";

    // Try to parse structured actions from the response
    let responseMessage = rawText;
    let actions: Array<{ type: string; label: string; payload: unknown }> | undefined;

    // Check if the response contains a JSON block with actions
    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.actions) {
          actions = parsed.actions;
        }
        if (parsed.message) {
          responseMessage = parsed.message;
        } else {
          // Remove the JSON block from the message text
          responseMessage = rawText.replace(/```json\s*[\s\S]*?```/, "").trim();
        }
      } catch {
        // JSON parsing failed — just use the raw text
      }
    }

    return NextResponse.json({ message: responseMessage, actions });
  } catch (error) {
    console.error("Command API error:", error);
    return NextResponse.json(
      { error: "Failed to process command" },
      { status: 500 }
    );
  }
}
