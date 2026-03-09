import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { randomUUID } from 'crypto';

const BRAND_ID = '6b66fd67-aa7e-46ab-9262-60ccfd3339c8';

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const correlationId = randomUUID();
  const supabase = createServerClient();
  const results: Record<string, unknown> = {};

  try {
    // Step 1: Insert expansion signal
    const signalId = randomUUID();
    const { error: signalErr } = await supabase.from('expansion_signals').insert({
      id: signalId,
      brand_id: BRAND_ID,
      signal_type: 'lead_cluster',
      location_name: 'Dallas-Fort Worth, TX',
      location_lat: 32.7767,
      location_lng: -96.7970,
      score: 87,
      summary: '7 leads from DFW area in the last 21 days. No Skill Samurai franchise within 80km.',
      recommended_action: 'Evaluate territory and launch targeted franchise recruitment campaign',
      status: 'new',
      data: { lead_count: 7, days: 21, nearest_franchise_km: 80 },
    });
    results.signal = signalErr ? { error: signalErr.message } : { id: signalId };

    // Step 2: CEO evaluation event
    const ceoEventId = randomUUID();
    await supabase.from('agent_events').insert({
      id: ceoEventId,
      brand_id: BRAND_ID,
      agent_name: 'ceo',
      event_type: 'opportunity_evaluation',
      correlation_id: correlationId,
      chain_depth: 0,
      payload: {
        signal_id: signalId,
        decision: 'APPROVE — Score 87 exceeds threshold. DFW metro has strong demographics for STEM education franchise.',
      },
      status: 'completed',
      model_tier: 'strategic',
      model_used: 'claude-sonnet-4-5-20250514',
    });

    // Step 3: Territory scoring event
    await supabase.from('agent_events').insert({
      id: randomUUID(),
      brand_id: BRAND_ID,
      agent_name: 'territory-intelligence',
      event_type: 'territory_scoring',
      correlation_id: correlationId,
      chain_depth: 1,
      payload: {
        signal_id: signalId,
        score: 84,
        grade: 'A',
        recommendation: 'Strong territory candidate. Proceed to site selection.',
      },
      status: 'completed',
      model_tier: 'operational',
    });

    // Step 4: Landing page event
    await supabase.from('agent_events').insert({
      id: randomUUID(),
      brand_id: BRAND_ID,
      agent_name: 'landing-page',
      event_type: 'landing_page_generated',
      correlation_id: correlationId,
      chain_depth: 2,
      payload: {
        signal_id: signalId,
        headline: 'Bring Skill Samurai to Dallas-Fort Worth',
        subheadline: 'Own a thriving STEM education franchise in one of America\'s fastest-growing metros',
      },
      status: 'completed',
      model_tier: 'worker',
      model_used: 'claude-haiku-4-5-20251001',
    });

    // Step 5: Email sequence event
    await supabase.from('agent_events').insert({
      id: randomUUID(),
      brand_id: BRAND_ID,
      agent_name: 'email',
      event_type: 'email_sequence_generated',
      correlation_id: correlationId,
      chain_depth: 3,
      payload: {
        signal_id: signalId,
        email_count: 5,
        subjects: [
          'Dallas-Fort Worth is ready for Skill Samurai — are you?',
          'How Sarah turned her teaching passion into a $400K franchise',
          'Your top 5 questions about owning a Skill Samurai franchise',
          'Only 3 premium DFW territories remain',
          'Final call: DFW franchise applications close Friday',
        ],
      },
      status: 'completed',
      model_tier: 'worker',
      model_used: 'claude-haiku-4-5-20251001',
    });

    // Step 6: Social content event
    await supabase.from('agent_events').insert({
      id: randomUUID(),
      brand_id: BRAND_ID,
      agent_name: 'social-content',
      event_type: 'social_content_generated',
      correlation_id: correlationId,
      chain_depth: 4,
      payload: {
        signal_id: signalId,
        platforms: ['facebook', 'linkedin', 'instagram'],
        post_count: 3,
      },
      status: 'completed',
      model_tier: 'worker',
      model_used: 'claude-haiku-4-5-20251001',
    });

    // Step 7: Create initiative
    const initiativeId = randomUUID();
    const { error: initErr } = await supabase.from('initiatives').insert({
      id: initiativeId,
      brand_id: BRAND_ID,
      title: 'Dallas-Fort Worth Franchise Expansion — Q1 2026',
      type: 'territory_outreach',
      status: 'in_progress',
      agent_assigned: 'ceo',
      evidence: [{ type: 'opportunity_signal', signal_id: signalId, score: 87 }],
      action_plan: [
        { step: 1, action: 'Signal detection', status: 'completed' },
        { step: 2, action: 'CEO evaluation', status: 'completed' },
        { step: 3, action: 'Territory scoring', status: 'completed' },
        { step: 4, action: 'Landing page generation', status: 'completed' },
        { step: 5, action: 'Email sequence creation', status: 'completed' },
        { step: 6, action: 'Social content generation', status: 'completed' },
        { step: 7, action: 'Monitor and optimize', status: 'pending' },
      ],
      data: {
        correlation_id: correlationId,
        territory_score: 84,
        territory_grade: 'A',
        created_by: 'dallas-scenario-api',
      },
    });
    results.initiative = initErr ? { error: initErr.message } : { id: initiativeId };

    // Step 8: Memory
    await supabase.from('memory_entries').insert({
      brand_id: BRAND_ID,
      layer: 'episodic',
      title: 'Dallas-Fort Worth Expansion Auto-Response',
      content: 'Dallas-Fort Worth opportunity auto-response completed via dashboard. Territory grade A. Initiative created.',
      embedding_text: 'Dallas-Fort Worth expansion opportunity auto-response',
      metadata: { correlation_id: correlationId, source: 'dashboard-api' },
      status: 'active',
    });

    return NextResponse.json({
      success: true,
      message: 'Dallas scenario complete',
      correlationId,
      initiativeId,
      signalId,
    });
  } catch (err: any) {
    console.error('Dallas scenario API error:', err);
    return NextResponse.json(
      { error: 'Scenario failed', details: err.message },
      { status: 500 },
    );
  }
}
