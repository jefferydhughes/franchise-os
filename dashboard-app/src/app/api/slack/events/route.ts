import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase";
import {
  verifySlackSignature,
  getSlackSigningSecret,
  postMessage,
  addReaction,
} from "@/lib/slack";

// ---------------------------------------------------------------------------
// Slack Events API handler
//
// This route handles:
//  1. url_verification challenge (Slack app setup)
//  2. event_callback for message events (app_mention + message.im)
//
// Messages are dispatched through the same AI command pipeline used by the
// dashboard, so Slack users get the full FranchiseOS agent experience.
// ---------------------------------------------------------------------------

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

/**
 * Resolve brand from a Slack team_id, or fall back to default.
 */
async function resolveBrandFromSlack(teamId: string) {
  const supabase = createServerClient();

  // Try to find a brand linked to this Slack workspace
  const { data } = await supabase
    .from("brands")
    .select("*")
    .eq("config->>slack_team_id", teamId)
    .maybeSingle();

  if (data) return data;

  // Fallback: default brand
  const { data: fallback } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", "skill-samurai")
    .maybeSingle();

  return fallback;
}

/**
 * Process a user message through the FranchiseOS command AI.
 */
async function processCommand(brandId: string, brandName: string, brandConfig: Record<string, unknown>, message: string) {
  const supabase = createServerClient();
  const anthropic = getAnthropic();

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

  const systemPrompt = `You are the FranchiseOS Command Center AI — the central intelligence layer for the "${brandName}" franchise network.

You are responding via Slack. Keep messages concise and use Slack mrkdwn formatting (*bold*, _italic_, \`code\`, > blockquote).

Current brand context:
- Brand: ${brandName}
- Brand ID: ${brandId}
- Config: ${JSON.stringify(brandConfig ?? {})}

Recent agent activity:
${eventsContext}

Available tables: brands, territories, franchisees, leads, initiatives, agent_events, memory_entries, campaigns.

When responding:
1. Be concise and actionable — this is Slack, not an essay.
2. If the user's request maps to a concrete action, mention what you would do.
3. Reference real data from the context when possible.
4. If you don't have enough information, say so and suggest what to look up.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: message }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.type === "text" ? textBlock.text : "I couldn't generate a response.";
}

// We need the raw body for signature verification, so disable body parsing
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // ------ Signature verification ------
    const timestamp = req.headers.get("x-slack-request-timestamp") ?? "";
    const signature = req.headers.get("x-slack-signature") ?? "";

    let signingSecret: string;
    try {
      signingSecret = getSlackSigningSecret();
    } catch {
      // During initial setup (url_verification), allow without signing secret
      // so the user can verify the URL first, then add the secret.
      console.warn("SLACK_SIGNING_SECRET not set — skipping verification");
      signingSecret = "";
    }

    if (signingSecret && !verifySlackSignature(signingSecret, signature, timestamp, rawBody)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    // ------ URL verification challenge ------
    if (payload.type === "url_verification") {
      return NextResponse.json({ challenge: payload.challenge });
    }

    // ------ Event callbacks ------
    if (payload.type === "event_callback") {
      const event = payload.event;

      // Ignore bot messages to prevent loops
      if (event.bot_id || event.subtype === "bot_message") {
        return NextResponse.json({ ok: true });
      }

      // Handle app_mention and direct messages
      if (event.type === "app_mention" || event.type === "message") {
        // Only handle DMs (im) and app mentions, not all channel messages
        if (event.type === "message" && event.channel_type !== "im") {
          return NextResponse.json({ ok: true });
        }

        const userMessage = (event.text ?? "")
          // Strip the bot mention from app_mention events
          .replace(/<@[A-Z0-9]+>/g, "")
          .trim();

        if (!userMessage) {
          return NextResponse.json({ ok: true });
        }

        // Acknowledge the eyes emoji so user knows we're processing
        addReaction(event.channel, event.ts, "eyes").catch(() => {});

        // Resolve brand and process the command
        const brand = await resolveBrandFromSlack(payload.team_id);

        if (!brand) {
          await postMessage(
            event.channel,
            "I couldn't find a brand linked to this Slack workspace. Please configure your brand's `slack_team_id` in Supabase."
          );
          return NextResponse.json({ ok: true });
        }

        // Log the event
        const supabase = createServerClient();
        await supabase.from("agent_events").insert({
          brand_id: brand.id,
          agent_name: "slack-gateway",
          event_type: "slack_message_received",
          payload: {
            channel: event.channel,
            user: event.user,
            text: userMessage,
            team_id: payload.team_id,
          },
        });

        const reply = await processCommand(
          brand.id,
          brand.name,
          brand.config ?? {},
          userMessage
        );

        await postMessage(event.channel, reply);

        // Remove eyes, add checkmark
        addReaction(event.channel, event.ts, "white_check_mark").catch(() => {});

        return NextResponse.json({ ok: true });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Slack events error:", errMsg);
    // Always return 200 to Slack to prevent retries
    return NextResponse.json({ ok: true, error: errMsg });
  }
}
