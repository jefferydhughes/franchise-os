import crypto from "crypto";

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

export function getSlackBotToken(): string {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) throw new Error("SLACK_BOT_TOKEN is not set");
  return token;
}

export function getSlackSigningSecret(): string {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret) throw new Error("SLACK_SIGNING_SECRET is not set");
  return secret;
}

// ---------------------------------------------------------------------------
// Signature verification
// ---------------------------------------------------------------------------

export function verifySlackSignature(
  signingSecret: string,
  signature: string,
  timestamp: string,
  body: string
): boolean {
  // Reject requests older than 5 minutes (replay protection)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(timestamp)) > 60 * 5) {
    return false;
  }

  const sigBasestring = `v0:${timestamp}:${body}`;
  const mySignature =
    "v0=" +
    crypto
      .createHmac("sha256", signingSecret)
      .update(sigBasestring, "utf8")
      .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(mySignature, "utf8"),
    Buffer.from(signature, "utf8")
  );
}

// ---------------------------------------------------------------------------
// Slack Web API helpers
// ---------------------------------------------------------------------------

interface SlackApiResponse {
  ok: boolean;
  error?: string;
  [key: string]: unknown;
}

export async function slackApi(
  method: string,
  body: Record<string, unknown>
): Promise<SlackApiResponse> {
  const token = getSlackBotToken();
  const res = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as SlackApiResponse;
  if (!data.ok) {
    console.error(`Slack API ${method} failed:`, data.error);
  }
  return data;
}

/**
 * Post a message to a Slack channel.
 */
export async function postMessage(
  channel: string,
  text: string,
  blocks?: unknown[]
): Promise<SlackApiResponse> {
  return slackApi("chat.postMessage", { channel, text, blocks });
}

/**
 * Update an existing Slack message.
 */
export async function updateMessage(
  channel: string,
  ts: string,
  text: string,
  blocks?: unknown[]
): Promise<SlackApiResponse> {
  return slackApi("chat.update", { channel, ts, text, blocks });
}

/**
 * Add a reaction to a message.
 */
export async function addReaction(
  channel: string,
  timestamp: string,
  emoji: string
): Promise<SlackApiResponse> {
  return slackApi("reactions.add", {
    channel,
    timestamp,
    name: emoji,
  });
}
