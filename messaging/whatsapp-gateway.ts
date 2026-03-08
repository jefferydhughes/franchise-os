// ---------------------------------------------------------------------------
// WhatsApp Gateway — Twilio WhatsApp Sandbox (REST API, no SDK)
// ---------------------------------------------------------------------------

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID ?? "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN ?? "";
const TWILIO_WHATSAPP_FROM = "whatsapp:+14155238886"; // Twilio sandbox default

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TwilioWhatsAppResponse {
  sid: string;
  status: string;
  to: string;
  from: string;
  body: string;
  date_created: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function assertConfig(): void {
  if (!TWILIO_ACCOUNT_SID) {
    throw new Error("TWILIO_ACCOUNT_SID is not set.");
  }
  if (!TWILIO_AUTH_TOKEN) {
    throw new Error("TWILIO_AUTH_TOKEN is not set.");
  }
}

function twilioApiUrl(): string {
  return `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
}

function authHeader(): string {
  const credentials = Buffer.from(
    `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`
  ).toString("base64");
  return `Basic ${credentials}`;
}

/**
 * Ensure a phone number is prefixed with `whatsapp:`.
 * Accepts either "+15551234567" or "whatsapp:+15551234567".
 */
function whatsappNumber(phone: string): string {
  return phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone}`;
}

async function sendTwilioWhatsApp(
  to: string,
  body: string
): Promise<TwilioWhatsAppResponse> {
  assertConfig();

  const params = new URLSearchParams();
  params.set("To", whatsappNumber(to));
  params.set("From", TWILIO_WHATSAPP_FROM);
  params.set("Body", body);

  const response = await fetch(twilioApiUrl(), {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Twilio WhatsApp API error ${response.status}: ${data?.message ?? JSON.stringify(data)}`
    );
  }

  return data as TwilioWhatsAppResponse;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send a free-form WhatsApp message.
 *
 * @param to      - Recipient phone in E.164 format (e.g. +15551234567).
 *                  The `whatsapp:` prefix is added automatically if missing.
 * @param message - Message body text.
 */
export async function sendWhatsApp(
  to: string,
  message: string
): Promise<TwilioWhatsAppResponse> {
  return sendTwilioWhatsApp(to, message);
}

/**
 * Send a pre-approved WhatsApp template message.
 *
 * Twilio WhatsApp templates use positional variables like {{1}}, {{2}}, etc.
 * Pass a Record whose keys match the placeholder names and whose values are
 * the substitutions. For numbered placeholders use keys "1", "2", etc.
 *
 * @param to        - Recipient phone in E.164 format.
 * @param template  - Template body containing {{key}} placeholders.
 * @param variables - Key-value pairs to substitute into the template.
 */
export async function sendTemplateMessage(
  to: string,
  template: string,
  variables: Record<string, string>
): Promise<TwilioWhatsAppResponse> {
  let body = template;

  for (const [key, value] of Object.entries(variables)) {
    // Replace all occurrences of {{key}} in the template
    const placeholder = `{{${key}}}`;
    while (body.includes(placeholder)) {
      body = body.replace(placeholder, value);
    }
  }

  return sendTwilioWhatsApp(to, body);
}
