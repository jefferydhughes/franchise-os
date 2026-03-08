// ---------------------------------------------------------------------------
// SMS Gateway — Twilio REST API (no SDK)
// ---------------------------------------------------------------------------

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID ?? "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN ?? "";
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER ?? "";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Lead {
  name: string;
  source: string;
  territory: string;
}

export interface TwilioMessageResponse {
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
  if (!TWILIO_PHONE_NUMBER) {
    throw new Error("TWILIO_PHONE_NUMBER is not set.");
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

async function sendTwilioMessage(
  to: string,
  body: string
): Promise<TwilioMessageResponse> {
  assertConfig();

  const params = new URLSearchParams();
  params.set("To", to);
  params.set("From", TWILIO_PHONE_NUMBER);
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
      `Twilio API error ${response.status}: ${data?.message ?? JSON.stringify(data)}`
    );
  }

  return data as TwilioMessageResponse;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send a plain SMS message.
 *
 * @param to   - Recipient phone number in E.164 format (e.g. +15551234567)
 * @param message - Message body (max 1600 chars for Twilio)
 * @param brandId - Brand identifier (included in the message prefix for tracking)
 */
export async function sendSMS(
  to: string,
  message: string,
  brandId: string
): Promise<TwilioMessageResponse> {
  const body = `[${brandId}] ${message}`;
  return sendTwilioMessage(to, body);
}

/**
 * Notify a franchisee about a new lead via SMS.
 */
export async function sendLeadAlert(
  franchiseePhone: string,
  lead: Lead
): Promise<TwilioMessageResponse> {
  const body = [
    `NEW LEAD ALERT`,
    `Name: ${lead.name}`,
    `Source: ${lead.source}`,
    `Territory: ${lead.territory}`,
    ``,
    `Please follow up within 5 minutes for best conversion.`,
  ].join("\n");

  return sendTwilioMessage(franchiseePhone, body);
}

/**
 * Send an onboarding step notification to a franchisee.
 */
export async function sendOnboardingStep(
  franchiseePhone: string,
  step: string,
  instructions: string
): Promise<TwilioMessageResponse> {
  const body = [
    `ONBOARDING: ${step}`,
    ``,
    instructions,
    ``,
    `Reply HELP for assistance or STOP to opt out.`,
  ].join("\n");

  return sendTwilioMessage(franchiseePhone, body);
}
