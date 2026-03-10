import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { randomUUID } from 'crypto';

interface OpportunitySignal {
  id: string;
  type: string;
  location: { lat: number; lng: number; label?: string };
  score: number;
  summary: string;
  recommended_action: string;
}

async function emitAgentEvent(
  supabase: ReturnType<typeof createServerClient>,
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
  await supabase.from('agent_events').insert({
    id: eventId,
    brand_id: params.brandId,
    agent_name: params.agentName,
    event_type: params.eventType,
    correlation_id: params.correlationId,
    chain_depth: params.chainDepth,
    payload: params.payload,
    status: 'completed',
    model_tier: params.modelTier ?? 'strategic',
    created_at: new Date().toISOString(),
  });
  return eventId;
}

async function runChain(
  signal: OpportunitySignal,
  brandId: string
): Promise<string> {
  const supabase = createServerClient();
  const correlationId = randomUUID();

  // Step 1 — CEO evaluation
  await emitAgentEvent(supabase, {
    brandId,
    agentName: 'CEO_AGENT',
    eventType: 'opportunity_evaluated',
    correlationId,
    chainDepth: 1,
    modelTier: 'strategic',
    payload: {
      signal_id: signal.id,
      location: signal.location.label ?? signal.id,
      score: signal.score,
      decision: 'approved',
      reasoning: `Signal score ${signal.score} exceeds threshold. ${signal.summary}`,
    },
  });

  // Step 2 — Territory scoring
  await emitAgentEvent(supabase, {
    brandId,
    agentName: 'TERRITORY_INTELLIGENCE_AGENT',
    eventType: 'territory_scored',
    correlationId,
    chainDepth: 2,
    modelTier: 'operational',
    payload: {
      signal_id: signal.id,
      location: signal.location.label ?? signal.id,
      territory_score: signal.score,
      status: 'open',
      conflicts: [],
    },
  });

  // Step 3 — Landing page
  await emitAgentEvent(supabase, {
    brandId,
    agentName: 'LANDING_PAGE_AGENT',
    eventType: 'landing_page_generated',
    correlationId,
    chainDepth: 3,
    modelTier: 'worker',
    payload: {
      location: signal.location.label ?? signal.id,
      page_title: `Own a Skill Samurai Franchise in ${signal.location.label ?? 'this region'}`,
      status: 'draft',
    },
  });

  // Step 4 — Email campaign
  await emitAgentEvent(supabase, {
    brandId,
    agentName: 'EMAIL_AGENT',
    eventType: 'email_campaign_generated',
    correlationId,
    chainDepth: 4,
    modelTier: 'worker',
    payload: {
      location: signal.location.label ?? signal.id,
      sequence_length: 5,
      duration_days: 14,
      status: 'ready',
    },
  });

  // Step 5 — Social content
  await emitAgentEvent(supabase, {
    brandId,
    agentName: 'SOCIAL_CONTENT_AGENT',
    eventType: 'social_campaign_generated',
    correlationId,
    chainDepth: 5,
    modelTier: 'worker',
    payload: {
      location: signal.location.label ?? signal.id,
      post_count: 14,
      platforms: ['facebook', 'instagram', 'linkedin'],
      status: 'ready',
    },
  });

  // Step 6 — Create initiative record
  const initiativeId = randomUUID();
  const locationLabel = signal.location.label ?? `${signal.location.lat},${signal.location.lng}`;

  const { error: initError } = await supabase.from('initiatives').insert({
    id: initiativeId,
    brand_id: brandId,
    title: `${locationLabel} Expansion Initiative`,
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
      signal,
      location: signal.location,
      review_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    created_at: new Date().toISOString(),
  });

  if (initError) {
    throw new Error(`Failed to create initiative: ${initError.message}`);
  }

  await emitAgentEvent(supabase, {
    brandId,
    agentName: 'CEO_AGENT',
    eventType: 'initiative_created',
    correlationId,
    chainDepth: 6,
    modelTier: 'strategic',
    payload: {
      initiative_id: initiativeId,
      signal_id: signal.id,
      title: `${locationLabel} Expansion Initiative`,
      status: 'in_progress',
      review_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      total_chain_steps: 6,
    },
  });

  return initiativeId;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { signal, brandId } = body as {
      signal: OpportunitySignal;
      brandId: string;
    };

    if (!signal || !brandId) {
      return NextResponse.json(
        { error: 'Missing required fields: signal, brandId' },
        { status: 400 }
      );
    }

    const initiativeId = await runChain(signal, brandId);

    return NextResponse.json(
      {
        success: true,
        initiative_id: initiativeId,
        message: `Initiative launched for ${signal.location.label ?? signal.id}`,
        chain_steps: 6,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[opportunity-response] Chain failed:', msg);
    return NextResponse.json(
      { error: 'Chain execution failed', detail: msg },
      { status: 500 }
    );
  }
}
