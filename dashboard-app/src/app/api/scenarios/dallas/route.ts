import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { randomUUID } from 'crypto';

async function resolveBrandId(orgId: string | null | undefined): Promise<string | null> {
  const client = createServerClient();
  if (orgId) {
    const { data } = await client.from("brands").select("id").eq("clerk_org_id", orgId).maybeSingle();
    if (data?.id) return data.id;
  }
  const { data } = await client.from("brands").select("id").eq("slug", "skill-samurai").maybeSingle();
  return data?.id ?? null;
}

export async function POST() {
  const { userId, orgId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const BRAND_ID = await resolveBrandId(orgId);
  if (!BRAND_ID) {
    return NextResponse.json({ error: 'No brand found' }, { status: 404 });
  }

  const correlationId = randomUUID();
  const supabase = createServerClient();
  const now = new Date();
  const results: Record<string, unknown> = {};

  function ago(minutes: number): string {
    return new Date(now.getTime() - minutes * 60_000).toISOString();
  }

  try {
    // ═══════════════════════════════════════════════════════════════
    // TERRITORIES — 8 territories with full demographics
    // ═══════════════════════════════════════════════════════════════
    const territories = [
      {
        id: randomUUID(), brand_id: BRAND_ID, name: 'Dallas-Fort Worth North', region: 'Texas',
        score: 92, grade: 'A', status: 'available',
        demographics: { population: 485000, median_income: 95000, school_count: 127, households: 162000, family_density_score: 88, school_density_score: 91 },
        geo_data: { city: 'Plano', state: 'TX', lat: 33.0198, lng: -96.6989 },
      },
      {
        id: randomUUID(), brand_id: BRAND_ID, name: 'Dallas-Fort Worth South', region: 'Texas',
        score: 84, grade: 'A', status: 'available',
        demographics: { population: 390000, median_income: 78000, school_count: 98, households: 134000, family_density_score: 82, school_density_score: 79 },
        geo_data: { city: 'Arlington', state: 'TX', lat: 32.7357, lng: -97.1081 },
      },
      {
        id: randomUUID(), brand_id: BRAND_ID, name: 'Austin Central', region: 'Texas',
        score: 88, grade: 'A', status: 'in_progress',
        demographics: { population: 520000, median_income: 102000, school_count: 145, households: 195000, family_density_score: 85, school_density_score: 93 },
        geo_data: { city: 'Austin', state: 'TX', lat: 30.2672, lng: -97.7431 },
      },
      {
        id: randomUUID(), brand_id: BRAND_ID, name: 'Houston West', region: 'Texas',
        score: 76, grade: 'B', status: 'available',
        demographics: { population: 610000, median_income: 72000, school_count: 168, households: 210000, family_density_score: 74, school_density_score: 81 },
        geo_data: { city: 'Katy', state: 'TX', lat: 29.7858, lng: -95.8245 },
      },
      {
        id: randomUUID(), brand_id: BRAND_ID, name: 'San Antonio Northeast', region: 'Texas',
        score: 71, grade: 'B', status: 'available',
        demographics: { population: 340000, median_income: 68000, school_count: 89, households: 118000, family_density_score: 72, school_density_score: 68 },
        geo_data: { city: 'San Antonio', state: 'TX', lat: 29.4241, lng: -98.4936 },
      },
      {
        id: randomUUID(), brand_id: BRAND_ID, name: 'Denver Metro', region: 'Colorado',
        score: 79, grade: 'B', status: 'available',
        demographics: { population: 445000, median_income: 88000, school_count: 112, households: 172000, family_density_score: 78, school_density_score: 84 },
        geo_data: { city: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903 },
      },
      {
        id: randomUUID(), brand_id: BRAND_ID, name: 'Phoenix East Valley', region: 'Arizona',
        score: 65, grade: 'C', status: 'available',
        demographics: { population: 380000, median_income: 62000, school_count: 95, households: 130000, family_density_score: 65, school_density_score: 62 },
        geo_data: { city: 'Mesa', state: 'AZ', lat: 33.4152, lng: -111.8315 },
      },
      {
        id: randomUUID(), brand_id: BRAND_ID, name: 'Nashville Metro', region: 'Tennessee',
        score: 82, grade: 'A', status: 'assigned',
        demographics: { population: 410000, median_income: 76000, school_count: 108, households: 152000, family_density_score: 80, school_density_score: 77 },
        geo_data: { city: 'Nashville', state: 'TN', lat: 36.1627, lng: -86.7816 },
      },
    ];

    const { error: terrErr } = await supabase.from('territories').insert(territories);
    results.territories = terrErr ? { error: terrErr.message } : { count: territories.length };

    // ═══════════════════════════════════════════════════════════════
    // LEADS — 18 leads across all statuses
    // ═══════════════════════════════════════════════════════════════
    const leads = [
      { brand_id: BRAND_ID, name: 'Marcus Johnson', email: 'marcus.johnson@gmail.com', phone: '(214) 555-0142', source: 'landing_page', territory_id: territories[0].id, persona: 'Career Changer', score: 92, status: 'qualified', created_at: ago(45) },
      { brand_id: BRAND_ID, name: 'Sarah Chen', email: 'sarah.chen@outlook.com', phone: '(972) 555-0198', source: 'facebook_ad', territory_id: territories[0].id, persona: 'Education Professional', score: 88, status: 'qualified', created_at: ago(120) },
      { brand_id: BRAND_ID, name: 'David Rodriguez', email: 'david.r@yahoo.com', phone: '(817) 555-0231', source: 'google_search', territory_id: territories[1].id, persona: 'Multi-Unit Operator', score: 95, status: 'converted', created_at: ago(2880) },
      { brand_id: BRAND_ID, name: 'Jennifer Williams', email: 'jwilliams@proton.me', phone: '(469) 555-0177', source: 'referral', territory_id: territories[0].id, persona: 'First-Time Franchisee', score: 78, status: 'contacted', created_at: ago(360) },
      { brand_id: BRAND_ID, name: 'Robert Kim', email: 'rkim.business@gmail.com', phone: '(512) 555-0289', source: 'linkedin_ad', territory_id: territories[2].id, persona: 'Tech Professional', score: 85, status: 'qualified', created_at: ago(90) },
      { brand_id: BRAND_ID, name: 'Amanda Foster', email: 'amanda.foster@gmail.com', phone: '(713) 555-0156', source: 'landing_page', territory_id: territories[3].id, persona: 'Career Changer', score: 72, status: 'contacted', created_at: ago(480) },
      { brand_id: BRAND_ID, name: 'Michael Torres', email: 'mtorres@outlook.com', phone: '(210) 555-0344', source: 'franchise_expo', territory_id: territories[4].id, persona: 'Investor', score: 90, status: 'converted', created_at: ago(4320) },
      { brand_id: BRAND_ID, name: 'Lisa Park', email: 'lisa.park.edu@gmail.com', phone: '(303) 555-0411', source: 'google_search', territory_id: territories[5].id, persona: 'Education Professional', score: 68, status: 'new', created_at: ago(15) },
      { brand_id: BRAND_ID, name: 'James Anderson', email: 'janderson@gmail.com', phone: '(480) 555-0522', source: 'facebook_ad', territory_id: territories[6].id, persona: 'First-Time Franchisee', score: 55, status: 'new', created_at: ago(30) },
      { brand_id: BRAND_ID, name: 'Emily Davis', email: 'emily.davis@yahoo.com', phone: '(615) 555-0633', source: 'referral', territory_id: territories[7].id, persona: 'Multi-Unit Operator', score: 91, status: 'converted', created_at: ago(7200) },
      { brand_id: BRAND_ID, name: 'Chris Murphy', email: 'cmurphy@proton.me', phone: '(214) 555-0744', source: 'landing_page', territory_id: territories[0].id, persona: 'Tech Professional', score: 82, status: 'contacted', created_at: ago(200) },
      { brand_id: BRAND_ID, name: 'Patricia Nguyen', email: 'pnguyen@gmail.com', phone: '(972) 555-0855', source: 'linkedin_ad', territory_id: territories[1].id, persona: 'Investor', score: 47, status: 'lost', created_at: ago(10080) },
      { brand_id: BRAND_ID, name: 'Daniel Brown', email: 'dbrown@outlook.com', phone: '(512) 555-0966', source: 'google_search', territory_id: territories[2].id, persona: 'Career Changer', score: 76, status: 'new', created_at: ago(5) },
      { brand_id: BRAND_ID, name: 'Rachel Green', email: 'rgreen@gmail.com', phone: '(817) 555-1077', source: 'franchise_expo', territory_id: territories[1].id, persona: 'Education Professional', score: 83, status: 'qualified', created_at: ago(240) },
      { brand_id: BRAND_ID, name: 'Kevin Wright', email: 'kwright@yahoo.com', phone: '(469) 555-1188', source: 'facebook_ad', territory_id: territories[0].id, persona: 'First-Time Franchisee', score: 38, status: 'lost', created_at: ago(14400) },
      { brand_id: BRAND_ID, name: 'Michelle Lee', email: 'mlee.biz@gmail.com', phone: '(713) 555-1299', source: 'referral', territory_id: territories[3].id, persona: 'Multi-Unit Operator', score: 87, status: 'contacted', created_at: ago(150) },
      { brand_id: BRAND_ID, name: 'Andrew Taylor', email: 'ataylor@proton.me', phone: '(303) 555-1310', source: 'landing_page', territory_id: territories[5].id, persona: 'Investor', score: 74, status: 'new', created_at: ago(8) },
      { brand_id: BRAND_ID, name: 'Sophia Martinez', email: 'smartinez@gmail.com', phone: '(615) 555-1421', source: 'linkedin_ad', territory_id: territories[7].id, persona: 'Tech Professional', score: 81, status: 'contacted', created_at: ago(72) },
    ];

    const { error: leadErr } = await supabase.from('leads').insert(leads);
    results.leads = leadErr ? { error: leadErr.message } : { count: leads.length };

    // ═══════════════════════════════════════════════════════════════
    // EXPANSION SIGNALS (used for Opportunity Radar as agent_events)
    // ═══════════════════════════════════════════════════════════════
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

    // ═══════════════════════════════════════════════════════════════
    // OPPORTUNITY SIGNALS — agent_events with event_type for Opportunity Radar
    // The OpportunityRadar fetches: /api/agent-events?event_type=opportunity.detected
    // ═══════════════════════════════════════════════════════════════
    const opportunityEvents = [
      {
        id: randomUUID(), brand_id: BRAND_ID, agent_name: 'MARKET_OPPORTUNITY_AGENT',
        event_type: 'opportunity.detected', correlation_id: randomUUID(), chain_depth: 0,
        payload: {
          signal_type: 'lead_cluster', location_label: 'Dallas-Fort Worth, TX',
          score: 87, summary: '7 leads from DFW area in the last 21 days. No franchise within 80km.',
          recommended_action: 'Evaluate territory and launch targeted franchise recruitment campaign',
        },
        status: 'completed', model_tier: 'operational', created_at: ago(30),
      },
      {
        id: randomUUID(), brand_id: BRAND_ID, agent_name: 'MARKET_OPPORTUNITY_AGENT',
        event_type: 'opportunity.detected', correlation_id: randomUUID(), chain_depth: 0,
        payload: {
          signal_type: 'territory_threshold', location_label: 'Austin, TX',
          score: 91, summary: 'Austin Central territory score crossed 88. High family density + 145 schools within radius.',
          recommended_action: 'Fast-track Austin territory for Q2 franchise launch',
        },
        status: 'completed', model_tier: 'operational', created_at: ago(60),
      },
      {
        id: randomUUID(), brand_id: BRAND_ID, agent_name: 'MARKET_OPPORTUNITY_AGENT',
        event_type: 'opportunity.detected', correlation_id: randomUUID(), chain_depth: 0,
        payload: {
          signal_type: 'competitor_closed', location_label: 'Denver, CO',
          score: 74, summary: 'Code Ninjas location on Colorado Blvd permanently closed. 2,400 families in 5-mile radius without STEM education.',
          recommended_action: 'Deploy landing page and social campaign targeting displaced families',
        },
        status: 'completed', model_tier: 'operational', created_at: ago(180),
      },
      {
        id: randomUUID(), brand_id: BRAND_ID, agent_name: 'MARKET_OPPORTUNITY_AGENT',
        event_type: 'opportunity.detected', correlation_id: randomUUID(), chain_depth: 0,
        payload: {
          signal_type: 'search_volume_spike', location_label: 'Nashville, TN',
          score: 68, summary: '"STEM franchise Nashville" searches up 340% month-over-month. Interest correlates with new tech corridor announcement.',
          recommended_action: 'Monitor for 2 more weeks; prepare content for Nashville market',
        },
        status: 'completed', model_tier: 'operational', created_at: ago(360),
      },
      {
        id: randomUUID(), brand_id: BRAND_ID, agent_name: 'MARKET_OPPORTUNITY_AGENT',
        event_type: 'opportunity.detected', correlation_id: randomUUID(), chain_depth: 0,
        payload: {
          signal_type: 'lead_cluster', location_label: 'Houston West, TX',
          score: 79, summary: '5 inbound leads from Katy/Sugar Land area in 14 days. Growing suburb with strong family demographics.',
          recommended_action: 'Score territory and begin outreach sequence',
        },
        status: 'completed', model_tier: 'operational', created_at: ago(720),
      },
    ];

    const { error: oppErr } = await supabase.from('agent_events').insert(opportunityEvents);
    results.opportunities = oppErr ? { error: oppErr.message } : { count: opportunityEvents.length };

    // ═══════════════════════════════════════════════════════════════
    // AGENT EVENTS — Swarm activity across all 20 agents
    // Uses agent keys that match the SwarmMonitor page AGENTS registry
    // ═══════════════════════════════════════════════════════════════
    const agentEvents = [
      // Executive tier
      { agent_name: 'CEO_AGENT', event_type: 'opportunity_evaluation', status: 'completed', model_tier: 'strategic', model_used: 'claude-sonnet-4-5-20250514', created_at: ago(20),
        payload: { signal_id: signalId, decision: 'APPROVE — Score 87 exceeds threshold. DFW metro has strong demographics for STEM education franchise.' } },
      { agent_name: 'CEO_AGENT', event_type: 'strategic_review', status: 'completed', model_tier: 'strategic', created_at: ago(1440),
        payload: { review: 'Q1 2026 pipeline review: 3 territories approved, 2 in evaluation. Conversion rate 18% above target.' } },
      { agent_name: 'CRO_AGENT', event_type: 'revenue_forecast_update', status: 'completed', model_tier: 'strategic', created_at: ago(60),
        payload: { forecast_q1: 2400000, forecast_q2: 3100000, growth_rate: 0.29, confidence: 0.87 } },
      { agent_name: 'COO_AGENT', event_type: 'operations_health_check', status: 'completed', model_tier: 'strategic', created_at: ago(120),
        payload: { active_franchisees: 12, onboarding: 3, satisfaction_score: 4.6, avg_ramp_weeks: 8 } },
      { agent_name: 'CMO_AGENT', event_type: 'campaign_performance_review', status: 'completed', model_tier: 'strategic', created_at: ago(180),
        payload: { active_campaigns: 5, total_impressions: 847000, cpl: 42.50, conversion_rate: 0.034 } },

      // Department tier
      { agent_name: 'TERRITORY_INTELLIGENCE_AGENT', event_type: 'territory_scoring', status: 'completed', model_tier: 'operational', created_at: ago(25),
        payload: { territory: 'Dallas-Fort Worth North', score: 92, grade: 'A', recommendation: 'Strong territory candidate. Proceed to site selection.' } },
      { agent_name: 'TERRITORY_INTELLIGENCE_AGENT', event_type: 'territory_scoring', status: 'completed', model_tier: 'operational', created_at: ago(100),
        payload: { territory: 'Austin Central', score: 88, grade: 'A', recommendation: 'Excellent demographics. Tech corridor proximity is a differentiator.' } },
      { agent_name: 'LEAD_INTELLIGENCE_AGENT', event_type: 'lead_scoring_batch', status: 'completed', model_tier: 'operational', created_at: ago(15),
        payload: { leads_scored: 18, avg_score: 76.2, high_intent_count: 7, recommended_followups: 4 } },
      { agent_name: 'LEAD_INTELLIGENCE_AGENT', event_type: 'persona_classification', status: 'completed', model_tier: 'operational', created_at: ago(45),
        payload: { lead: 'Marcus Johnson', persona: 'Career Changer', confidence: 0.94, signals: ['searched franchise opportunities', 'visited FDD page 3x'] } },
      { agent_name: 'SALES_PIPELINE_AGENT', event_type: 'pipeline_analysis', status: 'completed', model_tier: 'operational', created_at: ago(90),
        payload: { total_pipeline_value: 1850000, qualified_leads: 8, avg_deal_cycle_days: 45, bottleneck: 'FDD review stage' } },
      { agent_name: 'CAMPAIGN_AGENT', event_type: 'campaign_launched', status: 'completed', model_tier: 'operational', created_at: ago(200),
        payload: { campaign: 'DFW Franchise Recruitment Q1', channels: ['facebook', 'google', 'linkedin'], budget: 15000, target_leads: 50 } },
      { agent_name: 'CAMPAIGN_AGENT', event_type: 'ab_test_result', status: 'completed', model_tier: 'operational', created_at: ago(500),
        payload: { test: 'Landing page headline', winner: 'Build Your Future with Skill Samurai', lift: 0.23, confidence: 0.96 } },
      { agent_name: 'CONTENT_STRATEGY_AGENT', event_type: 'content_calendar_generated', status: 'completed', model_tier: 'operational', created_at: ago(360),
        payload: { month: 'March 2026', posts_planned: 24, topics: ['franchise success stories', 'STEM education trends', 'territory spotlights', 'franchisee interviews'] } },
      { agent_name: 'ONBOARDING_AGENT', event_type: 'onboarding_milestone', status: 'completed', model_tier: 'operational', created_at: ago(1000),
        payload: { franchisee: 'David Rodriguez', milestone: 'Grand opening scheduled', territory: 'Dallas-Fort Worth South', week: 6 } },
      { agent_name: 'COACHING_AGENT', event_type: 'performance_coaching', status: 'completed', model_tier: 'operational', created_at: ago(2000),
        payload: { franchisee: 'Emily Davis', insight: 'Revenue trending 15% above peer average. Recommend expanding Saturday program.', action: 'Schedule strategy call' } },

      // Memory tier
      { agent_name: 'MEMORY_CURATOR_AGENT', event_type: 'memory_consolidation', status: 'completed', model_tier: 'operational', created_at: ago(50),
        payload: { entries_processed: 47, entries_archived: 12, new_patterns: 3, layers_updated: ['episodic', 'strategic', 'market'] } },
      { agent_name: 'PATTERN_DETECTION_AGENT', event_type: 'pattern_detected', status: 'completed', model_tier: 'operational', created_at: ago(300),
        payload: { pattern: 'Career changers from tech convert 2.3x faster than other personas', confidence: 0.89, sample_size: 34, recommendation: 'Weight tech background leads higher in scoring model' } },
      { agent_name: 'LEARNING_AGENT', event_type: 'model_feedback_loop', status: 'completed', model_tier: 'operational', created_at: ago(600),
        payload: { feedback_type: 'scoring_accuracy', prediction_accuracy: 0.82, drift_detected: false, next_retrain: '2026-03-15' } },

      // Worker tier
      { agent_name: 'LANDING_PAGE_AGENT', event_type: 'landing_page_generated', status: 'completed', model_tier: 'worker', model_used: 'claude-haiku-4-5-20251001', created_at: ago(22),
        payload: { territory: 'Dallas-Fort Worth', headline: 'Bring Skill Samurai to Dallas-Fort Worth', subheadline: 'Own a thriving STEM education franchise in one of America\'s fastest-growing metros' } },
      { agent_name: 'LANDING_PAGE_AGENT', event_type: 'landing_page_generated', status: 'completed', model_tier: 'worker', created_at: ago(400),
        payload: { territory: 'Austin', headline: 'Austin Deserves Skill Samurai', subheadline: 'The tech capital needs the best STEM education franchise' } },
      { agent_name: 'EMAIL_AGENT', event_type: 'email_sequence_generated', status: 'completed', model_tier: 'worker', model_used: 'claude-haiku-4-5-20251001', created_at: ago(21),
        payload: { territory: 'Dallas-Fort Worth', email_count: 5, subjects: ['Dallas-Fort Worth is ready for Skill Samurai — are you?', 'How Sarah turned her teaching passion into a $400K franchise', 'Your top 5 questions about owning a Skill Samurai franchise', 'Only 3 premium DFW territories remain', 'Final call: DFW franchise applications close Friday'] } },
      { agent_name: 'EMAIL_AGENT', event_type: 'email_delivered', status: 'completed', model_tier: 'worker', created_at: ago(100),
        payload: { recipient: 'Marcus Johnson', subject: 'Dallas-Fort Worth is ready for Skill Samurai', open_rate: null, sequence_position: 1 } },
      { agent_name: 'SOCIAL_CONTENT_AGENT', event_type: 'social_content_generated', status: 'completed', model_tier: 'worker', model_used: 'claude-haiku-4-5-20251001', created_at: ago(20),
        payload: { territory: 'Dallas-Fort Worth', platforms: ['facebook', 'linkedin', 'instagram'], post_count: 3 } },
      { agent_name: 'SOCIAL_CONTENT_AGENT', event_type: 'social_post_published', status: 'completed', model_tier: 'worker', created_at: ago(350),
        payload: { platform: 'linkedin', engagement: { likes: 47, comments: 12, shares: 8 }, reach: 3200, topic: 'Franchise success spotlight: Nashville' } },
      { agent_name: 'REPORT_AGENT', event_type: 'weekly_report_generated', status: 'completed', model_tier: 'worker', created_at: ago(1440),
        payload: { report_type: 'weekly_executive_summary', period: '2026-03-02 to 2026-03-08', highlights: ['3 new qualified leads', 'DFW territory approved', 'Austin onboarding on track'], kpis: { leads: 18, conversion_rate: 0.167, pipeline_value: 1850000 } } },
      { agent_name: 'INITIATIVE_AGENT', event_type: 'initiative_status_update', status: 'completed', model_tier: 'worker', created_at: ago(40),
        payload: { initiative: 'Dallas-Fort Worth Franchise Expansion', status: 'in_progress', completion: 0.85, next_milestone: 'Site selection finalization' } },

      // Some in-progress and pending events to show live activity
      { agent_name: 'LEAD_INTELLIGENCE_AGENT', event_type: 'lead_enrichment', status: 'processing', model_tier: 'operational', created_at: ago(2),
        payload: { lead: 'Daniel Brown', enrichment_sources: ['linkedin', 'clearbit', 'franchise_registry'] } },
      { agent_name: 'CONTENT_STRATEGY_AGENT', event_type: 'blog_post_draft', status: 'processing', model_tier: 'operational', created_at: ago(5),
        payload: { topic: '5 Signs Your City Needs a STEM Education Franchise', target_word_count: 1200 } },
      { agent_name: 'TERRITORY_INTELLIGENCE_AGENT', event_type: 'demographic_refresh', status: 'pending', model_tier: 'operational', created_at: ago(1),
        payload: { territories: ['Phoenix East Valley', 'San Antonio Northeast'], data_source: 'census_2025_update' } },
    ];

    const agentEventsWithIds = agentEvents.map(e => ({
      id: randomUUID(),
      brand_id: BRAND_ID,
      correlation_id: correlationId,
      chain_depth: 0,
      ...e,
    }));

    const { error: evtErr } = await supabase.from('agent_events').insert(agentEventsWithIds);
    results.agent_events = evtErr ? { error: evtErr.message } : { count: agentEventsWithIds.length };

    // ═══════════════════════════════════════════════════════════════
    // INITIATIVES — 12 initiatives across all Kanban statuses
    // ═══════════════════════════════════════════════════════════════
    const dallasInitId = randomUUID();
    const initiatives = [
      // detected (2)
      {
        id: randomUUID(), brand_id: BRAND_ID, title: 'Phoenix East Valley STEM Gap Analysis',
        type: 'territory_expansion', status: 'detected', agent_assigned: 'MARKET_OPPORTUNITY_AGENT',
        evidence: [{ type: 'search_volume', trend: '+120% YoY' }],
        action_plan: [{ step: 1, action: 'Demographic deep dive', status: 'pending' }],
        data: { source: 'market_scan' }, created_at: ago(720),
      },
      {
        id: randomUUID(), brand_id: BRAND_ID, title: 'San Antonio Competitor Exit Opportunity',
        type: 'market_expansion', status: 'detected', agent_assigned: 'MARKET_OPPORTUNITY_AGENT',
        evidence: [{ type: 'competitor_closed', location: 'SA North' }],
        action_plan: [{ step: 1, action: 'Territory scoring', status: 'pending' }],
        data: { source: 'competitor_monitor' }, created_at: ago(480),
      },

      // recommended (2)
      {
        id: randomUUID(), brand_id: BRAND_ID, title: 'Denver Metro Market Entry — Q2 2026',
        type: 'territory_outreach', status: 'recommended', agent_assigned: 'CEO_AGENT',
        evidence: [{ type: 'territory_score', score: 79, grade: 'B' }, { type: 'competitor_closed', details: 'Code Ninjas Colorado Blvd' }],
        action_plan: [
          { step: 1, action: 'Territory scoring', status: 'completed' },
          { step: 2, action: 'CEO review', status: 'pending' },
        ],
        data: { territory_score: 79 }, created_at: ago(360),
      },
      {
        id: randomUUID(), brand_id: BRAND_ID, title: 'Houston West Lead Nurture Campaign',
        type: 'campaign_optimization', status: 'recommended', agent_assigned: 'CAMPAIGN_AGENT',
        evidence: [{ type: 'lead_cluster', count: 5 }],
        action_plan: [
          { step: 1, action: 'Lead cluster analysis', status: 'completed' },
          { step: 2, action: 'Campaign brief', status: 'pending' },
        ],
        data: { target_territory: 'Houston West' }, created_at: ago(240),
      },

      // approved (2)
      {
        id: randomUUID(), brand_id: BRAND_ID, title: 'Austin Central Franchise Launch — Q1 2026',
        type: 'territory_outreach', status: 'approved', agent_assigned: 'CRO_AGENT',
        evidence: [{ type: 'territory_score', score: 88, grade: 'A' }, { type: 'lead_pipeline', count: 3 }],
        action_plan: [
          { step: 1, action: 'Territory scoring', status: 'completed' },
          { step: 2, action: 'CEO approval', status: 'completed' },
          { step: 3, action: 'Launch campaign', status: 'pending' },
        ],
        data: { territory_score: 88, approved_by: 'CEO_AGENT' }, created_at: ago(1440),
      },
      {
        id: randomUUID(), brand_id: BRAND_ID, title: 'Q1 Franchise Expo Strategy',
        type: 'campaign_optimization', status: 'approved', agent_assigned: 'CMO_AGENT',
        evidence: [{ type: 'historical', past_expo_roi: 3.2 }],
        action_plan: [
          { step: 1, action: 'Booth design', status: 'completed' },
          { step: 2, action: 'Collateral creation', status: 'pending' },
          { step: 3, action: 'Lead capture setup', status: 'pending' },
        ],
        data: { expo_name: 'IFA 2026', budget: 25000 }, created_at: ago(2160),
      },

      // in_progress (3)
      {
        id: dallasInitId, brand_id: BRAND_ID, title: 'Dallas-Fort Worth Franchise Expansion — Q1 2026',
        type: 'territory_outreach', status: 'in_progress', agent_assigned: 'CEO_AGENT',
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
        data: { correlation_id: correlationId, territory_score: 92, territory_grade: 'A' }, created_at: ago(30),
      },
      {
        id: randomUUID(), brand_id: BRAND_ID, title: 'Nashville Franchisee Performance Optimization',
        type: 'onboarding_support', status: 'in_progress', agent_assigned: 'COACHING_AGENT',
        evidence: [{ type: 'performance_data', revenue_trend: '+15%' }],
        action_plan: [
          { step: 1, action: 'Performance analysis', status: 'completed' },
          { step: 2, action: 'Coaching plan', status: 'completed' },
          { step: 3, action: 'Saturday program expansion', status: 'in_progress' },
          { step: 4, action: 'Results review', status: 'pending' },
        ],
        data: { franchisee: 'Emily Davis', territory: 'Nashville Metro' }, created_at: ago(4320),
      },
      {
        id: randomUUID(), brand_id: BRAND_ID, title: 'Lead Scoring Model v2 Rollout',
        type: 'unit_recovery', status: 'in_progress', agent_assigned: 'LEARNING_AGENT',
        evidence: [{ type: 'model_accuracy', current: 0.82, target: 0.90 }],
        action_plan: [
          { step: 1, action: 'Data collection', status: 'completed' },
          { step: 2, action: 'Feature engineering', status: 'completed' },
          { step: 3, action: 'Model training', status: 'in_progress' },
          { step: 4, action: 'A/B test deployment', status: 'pending' },
        ],
        data: { model_version: '2.0', training_samples: 340 }, created_at: ago(2880),
      },

      // learning_review (2)
      {
        id: randomUUID(), brand_id: BRAND_ID, title: 'Nashville Market Entry — Complete',
        type: 'territory_outreach', status: 'learning_review', agent_assigned: 'CEO_AGENT',
        outcome: 'Franchisee signed — Emily Davis',
        evidence: [{ type: 'territory_score', score: 82 }, { type: 'conversion', timeline_weeks: 12 }],
        action_plan: [
          { step: 1, action: 'Territory scoring', status: 'completed' },
          { step: 2, action: 'CEO approval', status: 'completed' },
          { step: 3, action: 'Campaign launch', status: 'completed' },
          { step: 4, action: 'Franchisee closing', status: 'completed' },
          { step: 5, action: 'Learning review', status: 'in_progress' },
        ],
        data: { total_cost: 18000, roi: 4.2, time_to_close_days: 84 }, created_at: ago(10080),
      },
      {
        id: randomUUID(), brand_id: BRAND_ID, title: 'Facebook Ad Creative Test — Jan 2026',
        type: 'campaign_optimization', status: 'learning_review', agent_assigned: 'CMO_AGENT',
        outcome: 'Video testimonials outperform static by 2.3x',
        evidence: [{ type: 'ab_test', winner: 'video_testimonial', lift: 0.23 }],
        action_plan: [
          { step: 1, action: 'Creative variants', status: 'completed' },
          { step: 2, action: 'A/B test', status: 'completed' },
          { step: 3, action: 'Statistical analysis', status: 'completed' },
          { step: 4, action: 'Playbook update', status: 'in_progress' },
        ],
        data: { budget_tested: 5000, impressions: 245000 }, created_at: ago(7200),
      },
    ];

    const { error: initErr } = await supabase.from('initiatives').insert(initiatives);
    results.initiatives = initErr ? { error: initErr.message } : { count: initiatives.length };

    // ═══════════════════════════════════════════════════════════════
    // MEMORY ENTRIES — across all 9 layers
    // ═══════════════════════════════════════════════════════════════
    const memoryEntries = [
      { brand_id: BRAND_ID, layer: 'episodic', title: 'Dallas-Fort Worth Expansion Auto-Response',
        content: 'Dallas-Fort Worth opportunity auto-response completed via dashboard. CEO approved score 87. Territory grade A (score 92). Landing page, email sequence (5 emails), and social content (3 posts) generated. Initiative created and tracking in progress.',
        embedding_text: 'Dallas-Fort Worth expansion opportunity auto-response', metadata: { correlation_id: correlationId, source: 'dashboard-api' }, status: 'active', created_at: ago(20) },
      { brand_id: BRAND_ID, layer: 'episodic', title: 'Austin Territory Fast-Tracked',
        content: 'Austin Central territory fast-tracked after scoring 88 (Grade A). Tech corridor proximity identified as key differentiator. 3 qualified leads already in pipeline from organic search.',
        embedding_text: 'Austin territory fast track approval', metadata: { source: 'territory-intelligence' }, status: 'active', created_at: ago(100) },
      { brand_id: BRAND_ID, layer: 'strategic', title: 'Q1 2026 Expansion Strategy',
        content: 'Board-approved strategy: Focus on Texas triangle (DFW, Austin, Houston, San Antonio) for Q1-Q2 2026. Target 5 new franchise signings. Budget allocation: 60% digital marketing, 25% franchise expos, 15% referral incentives.',
        embedding_text: 'Q1 2026 expansion strategy Texas triangle', metadata: { approved_by: 'CEO', quarter: 'Q1-2026' }, status: 'active', created_at: ago(4320) },
      { brand_id: BRAND_ID, layer: 'strategic', title: 'Pricing Model Update',
        content: 'Franchise fee adjusted to $45,000 (from $40,000) effective Q1 2026. Royalty remains 7%. Marketing fund contribution 2%. Change validated by 18-month cohort analysis showing strong unit economics.',
        embedding_text: 'franchise fee pricing model update', metadata: { effective_date: '2026-01-01' }, status: 'active', created_at: ago(8640) },
      { brand_id: BRAND_ID, layer: 'brand', title: 'Brand Voice Guidelines Refined',
        content: 'Brand voice updated: Lead with "empowerment" over "education." Emphasize parent outcomes (confidence, career readiness) rather than curriculum details. Tagline testing showed "Build Their Future" resonates 40% better than "Learn to Code."',
        embedding_text: 'brand voice guidelines empowerment', metadata: { source: 'content-strategy' }, status: 'active', created_at: ago(5760) },
      { brand_id: BRAND_ID, layer: 'market', title: 'STEM Education Market Trends 2026',
        content: 'STEM franchise market growing 12% YoY. Key trends: AI/robotics curriculum demand up 45%, after-school programs preferred over weekend-only, parents willing to pay premium ($150-200/mo) for hands-on coding. Competitive landscape: Code Ninjas contracting, Engineering for Kids stable.',
        embedding_text: 'STEM education franchise market trends 2026', metadata: { source: 'market-research', updated: '2026-03' }, status: 'active', created_at: ago(2880) },
      { brand_id: BRAND_ID, layer: 'market', title: 'Texas STEM Education Demand Analysis',
        content: 'Texas K-12 STEM enrollment up 23% since 2024. State funding for after-school STEM programs increased $48M. DFW, Austin, and Houston metro areas show strongest demand signals. Competition density lowest in DFW North and San Antonio.',
        embedding_text: 'Texas STEM education demand analysis', metadata: { source: 'territory-intelligence' }, status: 'active', created_at: ago(1440) },
      { brand_id: BRAND_ID, layer: 'campaign', title: 'DFW Recruitment Campaign Performance',
        content: 'DFW franchise recruitment campaign (launched 2026-02-15): 847K impressions, 2,340 clicks, 18 leads captured, 7 qualified. CPL $42.50 (target: $50). Facebook driving 55% of leads, Google 30%, LinkedIn 15%. Best performing creative: video testimonial from Nashville franchisee.',
        embedding_text: 'DFW recruitment campaign performance metrics', metadata: { campaign_id: 'dfw-q1-2026', source: 'campaign-agent' }, status: 'active', created_at: ago(120) },
      { brand_id: BRAND_ID, layer: 'franchisee', title: 'Emily Davis — Nashville Success Profile',
        content: 'Emily Davis (Nashville Metro): Former school principal. Signed franchise agreement month 1, grand opening month 3. Current enrollment: 127 students. Revenue trending 15% above peer average. Key success factors: strong community connections, school partnership strategy, Saturday robotics competition program.',
        embedding_text: 'Emily Davis Nashville franchisee success profile', metadata: { franchisee_id: 'emily-davis', territory: 'Nashville Metro' }, status: 'active', created_at: ago(7200) },
      { brand_id: BRAND_ID, layer: 'franchisee', title: 'David Rodriguez — DFW South Onboarding',
        content: 'David Rodriguez (DFW South): Multi-unit restaurant operator transitioning to education. Week 6 of onboarding. Grand opening scheduled for 2026-04-01. Location secured in Arlington. Initial marketing budget: $8,000. Pre-launch enrollment: 34 students (target: 50).',
        embedding_text: 'David Rodriguez DFW South onboarding progress', metadata: { franchisee_id: 'david-rodriguez', territory: 'DFW South' }, status: 'active', created_at: ago(1000) },
      { brand_id: BRAND_ID, layer: 'territory', title: 'DFW North Territory Deep Dive',
        content: 'DFW North (Plano/Frisco): Score 92, Grade A. Population 485K, median income $95K, 127 schools in radius. Family density score 88/100. Key advantage: high-income families with strong education spending. Nearest competitor: 12 miles. Recommended sites: Legacy West, Stonebriar area.',
        embedding_text: 'DFW North territory analysis Plano Frisco', metadata: { territory: 'DFW North', source: 'territory-intelligence' }, status: 'active', created_at: ago(25) },
      { brand_id: BRAND_ID, layer: 'territory', title: 'Austin Central Territory Assessment',
        content: 'Austin Central: Score 88, Grade A. Tech corridor creates unique advantage — parents in software/engineering highly value STEM education. 145 schools within 10-mile radius. Median income $102K. Risk factor: higher commercial rent ($28-35/sqft). Recommended: Mueller/Domain area for brand visibility.',
        embedding_text: 'Austin Central territory assessment tech corridor', metadata: { territory: 'Austin Central', source: 'territory-intelligence' }, status: 'active', created_at: ago(100) },
      { brand_id: BRAND_ID, layer: 'decision-log', title: 'CEO: DFW Expansion Approved',
        content: 'Decision: APPROVE Dallas-Fort Worth expansion. Rationale: Score 87 exceeds 70 threshold. DFW metro has 7.5M population, strong family demographics, low STEM franchise density. Risk assessment: LOW. Estimated time to first signing: 60-90 days. Budget allocated: $15,000 for digital campaign.',
        embedding_text: 'CEO decision DFW expansion approval', metadata: { decision_maker: 'CEO_AGENT', decision_type: 'territory_approval' }, status: 'active', created_at: ago(20) },
      { brand_id: BRAND_ID, layer: 'decision-log', title: 'CMO: Video-First Creative Strategy',
        content: 'Decision: Shift to video-first creative strategy across all campaigns. Evidence: A/B test showed video testimonials outperform static images by 2.3x on conversion rate. Implementation: All new campaigns default to video creative. Static used only as retargeting fallback.',
        embedding_text: 'CMO decision video first creative strategy', metadata: { decision_maker: 'CMO_AGENT', decision_type: 'marketing_strategy' }, status: 'active', created_at: ago(3600) },
      { brand_id: BRAND_ID, layer: 'semantic', title: 'Ideal Franchisee Profile',
        content: 'Highest-converting franchisee profile: Career changers from tech/education, ages 35-50, household income $120K+, community-oriented, previous management experience. This persona converts at 2.3x the average rate. Key motivations: legacy building, passion for education, desire for business ownership with proven model.',
        embedding_text: 'ideal franchisee profile conversion pattern', metadata: { source: 'pattern-detection', confidence: 0.89 }, status: 'active', created_at: ago(2160) },
    ];

    const { error: memErr } = await supabase.from('memory_entries').insert(memoryEntries);
    results.memory = memErr ? { error: memErr.message } : { count: memoryEntries.length };

    return NextResponse.json({
      success: true,
      message: 'Dallas scenario complete — full dashboard populated',
      correlationId,
      dallasInitiativeId: dallasInitId,
      signalId,
      results,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('Dallas scenario API error:', errMsg);
    return NextResponse.json(
      { error: 'Scenario failed', details: errMsg },
      { status: 500 },
    );
  }
}
