import { NextRequest, NextResponse } from "next/server";
import {
  verifySlackSignature,
  getSlackSigningSecret,
  updateMessage,
} from "@/lib/slack";

// ---------------------------------------------------------------------------
// Slack Interactivity handler
//
// Handles button clicks and other interactive components from Slack messages.
// The action_id determines what happens when a user clicks a button.
// ---------------------------------------------------------------------------

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // Signature verification
    const timestamp = req.headers.get("x-slack-request-timestamp") ?? "";
    const signature = req.headers.get("x-slack-signature") ?? "";

    try {
      const signingSecret = getSlackSigningSecret();
      if (!verifySlackSignature(signingSecret, signature, timestamp, rawBody)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } catch {
      console.warn("SLACK_SIGNING_SECRET not set — skipping verification");
    }

    // Slack sends interactivity payloads as form-encoded with a "payload" field
    const params = new URLSearchParams(rawBody);
    const payloadStr = params.get("payload");
    if (!payloadStr) {
      return NextResponse.json({ error: "Missing payload" }, { status: 400 });
    }

    const payload = JSON.parse(payloadStr);

    if (payload.type === "block_actions") {
      for (const action of payload.actions ?? []) {
        const actionId = action.action_id;
        const channel = payload.channel?.id;
        const messageTs = payload.message?.ts;

        console.log(`Slack interaction: ${actionId}`, action.value);

        // Handle specific action types
        if (actionId === "approve_action") {
          await updateMessage(
            channel,
            messageTs,
            `Action approved by <@${payload.user.id}>`,
            [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*Approved* by <@${payload.user.id}> at ${new Date().toISOString()}`,
                },
              },
            ]
          );
        } else if (actionId === "dismiss_action") {
          await updateMessage(channel, messageTs, "Dismissed", [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `_Dismissed by <@${payload.user.id}>_`,
              },
            },
          ]);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Slack interact error:", errMsg);
    return NextResponse.json({ ok: true });
  }
}
