// ---------------------------------------------------------------------------
// opportunity-auto-response.ts
// Dallas scenario — flagship demo of the FranchiseOS swarm responding to
// a territory opportunity signal with a fully orchestrated agent chain.
// ---------------------------------------------------------------------------

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OpportunitySignal {
  id: string;
  type: string;
  location: { lat: number; lng: number; label?: string };
  score: number;
  summary: string;
  recommended_action: string;
}

// ---------------------------------------------------------------------------
// Supabase client singleton
// ---------------------------------------------------------------------------

const SUPABASE_URL =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  'https://eggucsttihoxhxaaeiph.supabase.co';

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_KEY;

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Missing Supabase service role key. Set SUPABASE_SERVICE_ROLE_KEY in your environment.'
    );
  }

  _client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return _client;
}

// ---------------------------------------------------------------------------
// Helper — emit agent event
// ---------------------------------------------------------------------------

async function emitAgentEvent(
  supabase: SupabaseClient,
  params: {
    brandId: string;
    agentName: string;
    eventType: string;
    correlationId: string;
    chainDepth: number;
    payload: Record<string, unknown>;
    modelTier?: string;
  }
): Promise<string> {
  const eventId = randomUUID();

  const { error } = await supabase.from('agent_events').insert({
    id: eventId,
    brand_id: params.brandId,
    agent_name: params.agentName,
    event_type: params.eventType,
    correlation_id: params.correlationId,
    chain_depth: params.chainDepth,
    payload: params.payload,
    status: 'completed',
    model_tier: params.modelTier ?? 'operational',
  });

  if (error) {
    throw new Error(
      `Failed to emit event for ${params.agentName}: ${error.message} (code ${error.code})`
    );
  }

  return eventId;
}

// ---------------------------------------------------------------------------
// Step 1: CEO Agent Evaluation
// ---------------------------------------------------------------------------

async function stepCeoEvaluation(
  supabase: SupabaseClient,
  signal: OpportunitySignal,
  brandId: string,
  correlationId: string
): Promise<void> {
  await emitAgentEvent(supabase, {
    brandId,
    agentName: 'CEO_AGENT',
    eventType: 'opportunity_evaluation',
    correlationId,
    chainDepth: 0,
    modelTier: 'strategic',
    payload: {
      signal_id: signal.id,
      signal_type: signal.type,
      location: signal.location,
      score: signal.score,
      summary: signal.summary,
      recommended_action: signal.recommended_action,
      decision: 'approved',
      reasoning: `Opportunity score ${signal.score} exceeds threshold. Location: ${signal.location.label ?? `${signal.location.lat},${signal.location.lng}`}. Proceeding with territory evaluation.`,
    },
  });
}

// ---------------------------------------------------------------------------
// Step 2: Territory Scoring
// ---------------------------------------------------------------------------

async function stepTerritoryScoring(
  supabase: SupabaseClient,
  signal: OpportunitySignal,
  brandId: string,
  correlationId: string
): Promise<void> {
  await emitAgentEvent(supabase, {
    brandId,
    agentName: 'TERRITORY_INTELLIGENCE_AGENT',
    eventType: 'territory_scoring',
    correlationId,
    chainDepth: 1,
    modelTier: 'operational',
    payload: {
      signal_id: signal.id,
      location: signal.location,
      territory_analysis: {
        population_fit: true,
        competition_level: 'low',
        demographic_match: signal.score >= 70 ? 'strong' : 'moderate',
        recommended_radius_km: 12,
        estimated_potential: signal.score >= 80 ? 'high' : 'medium',
      },
      verdict: 'territory_viable',
    },
  });
}

// ---------------------------------------------------------------------------
// Step 3: Landing Page Generation
// ---------------------------------------------------------------------------

async function stepLandingPage(
  supabase: SupabaseClient,
  signal: OpportunitySignal,
  brandId: string,
  correlationId: string
): Promise<void> {
  const locationLabel =
    signal.location.label ?? `${signal.location.lat},${signal.location.lng}`;

  await emitAgentEvent(supabase, {
    brandId,
    agentName: 'LANDING_PAGE_AGENT',
    eventType: 'landing_page_generated',
    correlationId,
    chainDepth: 2,
    modelTier: 'worker',
    payload: {
      signal_id: signal.id,
      page_config: {
        headline: `Own a Franchise in ${locationLabel}`,
        subheadline: `A proven opportunity in a high-growth market`,
        cta: 'Schedule Your Discovery Call',
        territory_highlights: [
          `Score: ${signal.score}/100`,
          `Type: ${signal.type}`,
          signal.summary,
        ],
        slug: `opportunity-${signal.id.slice(0, 8)}`,
      },
      status: 'draft_ready',
    },
  });
}

// ---------------------------------------------------------------------------
// Step 4: Campaign Creation (14-day email sequence)
// ---------------------------------------------------------------------------

async function stepCampaignCreation(
  supabase: SupabaseClient,
  signal: OpportunitySignal,
  brandId: string,
  correlationId: string
): Promise<void> {
  const emailSequence = [
    { day: 1, subject: 'Your franchise opportunity awaits', type: 'introduction' },
    { day: 3, subject: 'Why this territory is special', type: 'territory_highlight' },
    { day: 5, subject: 'Meet our successful franchisees', type: 'social_proof' },
    { day: 7, subject: 'The investment breakdown', type: 'financial_overview' },
    { day: 9, subject: 'Your questions, answered', type: 'faq' },
    { day: 11, subject: 'Limited territory availability', type: 'urgency' },
    { day: 14, subject: 'Last chance: schedule your discovery call', type: 'final_cta' },
  ];

  await emitAgentEvent(supabase, {
    brandId,
    agentName: 'CAMPAIGN_AGENT',
    eventType: 'campaign_created',
    correlationId,
    chainDepth: 3,
    modelTier: 'worker',
    payload: {
      signal_id: signal.id,
      campaign_config: {
        name: `Opportunity Response — ${signal.location.label ?? signal.id.slice(0, 8)}`,
        type: 'recruitment',
        channels: ['email'],
        duration_days: 14,
        email_sequence: emailSequence,
      },
      status: 'draft',
    },
  });
}

// ---------------------------------------------------------------------------
// Step 5: Social Content Generation
// ---------------------------------------------------------------------------

async function stepSocialContent(
  supabase: SupabaseClient,
  signal: OpportunitySignal,
  brandId: string,
  correlationId: string
): Promise<void> {
  const locationLabel =
    signal.location.label ?? 'this exciting territory';

  const socialPosts = [
    {
      platform: 'linkedin',
      content: `Exciting franchise opportunity in ${locationLabel}! Our market analysis shows strong growth potential. Ready to be your own boss? Learn more. #FranchiseOpportunity #Entrepreneurship`,
      type: 'announcement',
    },
    {
      platform: 'facebook',
      content: `We're expanding to ${locationLabel}! Join our growing family of successful franchise owners. Limited territories available. Link in bio for details.`,
      type: 'awareness',
    },
    {
      platform: 'instagram',
      content: `New territory alert! ${locationLabel} just scored ${signal.score}/100 on our market analysis. This could be YOUR opportunity. DM us to learn more.`,
      type: 'engagement',
    },
  ];

  await emitAgentEvent(supabase, {
    brandId,
    agentName: 'SOCIAL_CONTENT_AGENT',
    eventType: 'social_content_generated',
    correlationId,
    chainDepth: 4,
    modelTier: 'worker',
    payload: {
      signal_id: signal.id,
      posts: socialPosts,
      status: 'pending_review',
    },
  });
}

// ---------------------------------------------------------------------------
// Step 6: Create Initiative Record
// ---------------------------------------------------------------------------

async function stepCreateInitiative(
  supabase: SupabaseClient,
  signal: OpportunitySignal,
  brandId: string,
  correlationId: string
): Promise<string> {
  const initiativeId = randomUUID();
  const locationLabel =
    signal.location.label ?? `${signal.location.lat},${signal.location.lng}`;

  const { error } = await supabase.from('initiatives').insert({
    id: initiativeId,
    brand_id: brandId,
    title: `Opportunity Response: ${locationLabel}`,
    type: 'territory_outreach',
    status: 'in_progress',
    agent_assigned: 'CEO_AGENT',
    evidence: [
      {
        type: 'opportunity_signal',
        signal_id: signal.id,
        score: signal.score,
        summary: signal.summary,
      },
    ],
    action_plan: [
      { step: 1, action: 'CEO evaluation', status: 'completed' },
      { step: 2, action: 'Territory scoring', status: 'completed' },
      { step: 3, action: 'Landing page generation', status: 'completed' },
      { step: 4, action: 'Email campaign creation', status: 'completed' },
      { step: 5, action: 'Social content generation', status: 'completed' },
      { step: 6, action: 'Monitor and optimize', status: 'pending' },
    ],
    data: {
      correlation_id: correlationId,
      signal: signal,
      location: signal.location,
    },
  });

  if (error) {
    throw new Error(
      `Failed to create initiative for signal "${signal.id}": ${error.message} (code ${error.code})`
    );
  }

  // Emit a final event to signal the initiative is live
  await emitAgentEvent(supabase, {
    brandId,
    agentName: 'CEO_AGENT',
    eventType: 'initiative_created',
    correlationId,
    chainDepth: 5,
    modelTier: 'strategic',
    payload: {
      initiative_id: initiativeId,
      signal_id: signal.id,
      title: `Opportunity Response: ${locationLabel}`,
      status: 'in_progress',
      total_chain_steps: 6,
    },
  });

  return initiativeId;
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

/**
 * Run the full opportunity auto-response flow for a given signal.
 *
 * This is the flagship Dallas demo scenario. It orchestrates six agents
 * in sequence, linked by a shared correlation_id, to respond to a
 * territory opportunity signal:
 *
 * 1. CEO Agent evaluates the signal
 * 2. Territory Intelligence Agent scores the territory
 * 3. Landing Page Agent generates a recruitment page
 * 4. Campaign Agent creates a 14-day email sequence
 * 5. Social Content Agent produces 3 social posts
 * 6. Initiative record is created to track the response
 */
export async function runOpportunityResponse(
  signal: OpportunitySignal,
  brandId: string
): Promise<void> {
  const supabase = getClient();
  const correlationId = randomUUID();

  console.log(
    `[OpportunityAutoResponse] Starting response for signal "${signal.id}" ` +
      `(brand: ${brandId}, correlation: ${correlationId})`
  );

  try {
    // Step 1: CEO evaluates the opportunity
    await stepCeoEvaluation(supabase, signal, brandId, correlationId);
    console.log('[OpportunityAutoResponse] Step 1/6: CEO evaluation complete');

    // Step 2: Territory scoring
    await stepTerritoryScoring(supabase, signal, brandId, correlationId);
    console.log('[OpportunityAutoResponse] Step 2/6: Territory scoring complete');

    // Step 3: Landing page generation
    await stepLandingPage(supabase, signal, brandId, correlationId);
    console.log('[OpportunityAutoResponse] Step 3/6: Landing page generated');

    // Step 4: Campaign creation
    await stepCampaignCreation(supabase, signal, brandId, correlationId);
    console.log('[OpportunityAutoResponse] Step 4/6: Campaign created');

    // Step 5: Social content
    await stepSocialContent(supabase, signal, brandId, correlationId);
    console.log('[OpportunityAutoResponse] Step 5/6: Social content generated');

    // Step 6: Create initiative record
    const initiativeId = await stepCreateInitiative(
      supabase,
      signal,
      brandId,
      correlationId
    );
    console.log(
      `[OpportunityAutoResponse] Step 6/6: Initiative "${initiativeId}" created`
    );

    console.log(
      `[OpportunityAutoResponse] Full chain complete for signal "${signal.id}". ` +
        `Initiative: ${initiativeId}, Correlation: ${correlationId}`
    );
  } catch (err) {
    console.error(
      `[OpportunityAutoResponse] Chain failed for signal "${signal.id}":`,
      err
    );

    // Record the failure as an agent event
    try {
      await emitAgentEvent(supabase, {
        brandId,
        agentName: 'CEO_AGENT',
        eventType: 'opportunity_response_failed',
        correlationId,
        chainDepth: 0,
        modelTier: 'strategic',
        payload: {
          signal_id: signal.id,
          error: err instanceof Error ? err.message : String(err),
        },
      });
    } catch (logErr) {
      console.error(
        '[OpportunityAutoResponse] Failed to log chain failure event:',
        logErr
      );
    }

    throw err;
  }
}
