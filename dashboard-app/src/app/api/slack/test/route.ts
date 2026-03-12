import { NextRequest, NextResponse } from "next/server";
import { postMessage, getSlackBotToken } from "@/lib/slack";

/**
 * GET  /api/slack/test — check if Slack env vars are configured
 * POST /api/slack/test — send a test message to a channel
 *
 * Usage: POST { "channel": "#general" }
 */

export async function GET() {
  try {
    getSlackBotToken();
    return NextResponse.json({
      ok: true,
      message: "SLACK_BOT_TOKEN is configured",
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "SLACK_BOT_TOKEN is not set. Add it to .env.local",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { channel } = await req.json();
    const targetChannel = channel || "#general";

    const result = await postMessage(
      targetChannel,
      "FranchiseOS is connected! Your AI swarm agents can now communicate through Slack.",
      [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "FranchiseOS Connected",
            emoji: true,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "Your AI swarm agents can now communicate through Slack.\n\n*Try it out:* Send me a direct message or mention me in a channel!",
          },
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: "*Status:* Online" },
            {
              type: "mrkdwn",
              text: `*Connected at:* ${new Date().toISOString()}`,
            },
          ],
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "Test Approve", emoji: true },
              style: "primary",
              action_id: "approve_action",
              value: "test",
            },
            {
              type: "button",
              text: { type: "plain_text", text: "Dismiss", emoji: true },
              action_id: "dismiss_action",
              value: "test",
            },
          ],
        },
      ]
    );

    return NextResponse.json({ ok: result.ok, channel: targetChannel });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: errMsg }, { status: 500 });
  }
}
