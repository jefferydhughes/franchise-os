/**
 * initiative-engine/logic/initiative-classifier.ts
 *
 * Classifies an initiative by type using keyword matching on title,
 * description, and signals. Returns the initiative type, priority,
 * recommended agents, and auto-approve status.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ClassifierInput {
  title: string;
  description: string;
  brandId: string;
  signals: string[];
}

export type InitiativeType =
  | 'territory_expansion'
  | 'lead_campaign'
  | 'franchisee_support'
  | 'compliance_action'
  | 'marketing_push';

export interface ClassifierOutput {
  type: InitiativeType;
  priority: number;
  recommended_agents: string[];
  auto_approve: boolean;
}

// ---------------------------------------------------------------------------
// Keyword maps
// ---------------------------------------------------------------------------

const TYPE_KEYWORDS: Record<InitiativeType, string[]> = {
  territory_expansion: [
    'territory', 'expansion', 'expand', 'new market', 'new region',
    'geographic', 'location', 'site selection', 'white space', 'greenfield',
    'open new', 'new territory', 'market entry',
  ],
  lead_campaign: [
    'lead', 'campaign', 'leads', 'prospect', 'funnel', 'pipeline',
    'outreach', 'acquisition', 'nurture', 'drip', 'email blast',
    'lead gen', 'lead generation', 'conversion',
  ],
  franchisee_support: [
    'franchisee', 'support', 'training', 'coaching', 'onboarding',
    'mentoring', 'performance review', 'unit economics', 'retention',
    'satisfaction', 'help desk', 'assist',
  ],
  compliance_action: [
    'compliance', 'audit', 'regulatory', 'legal', 'violation',
    'inspection', 'fdd', 'franchise disclosure', 'policy enforcement',
    'non-compliant', 'corrective action', 'regulation',
  ],
  marketing_push: [
    'marketing', 'brand awareness', 'social media', 'content',
    'advertising', 'ad spend', 'promotion', 'branding', 'seo',
    'digital marketing', 'pr', 'press release', 'influencer',
  ],
};

const AGENT_MAP: Record<InitiativeType, string[]> = {
  territory_expansion: [
    'TERRITORY_INTELLIGENCE_AGENT',
    'MARKET_OPPORTUNITY_AGENT',
    'INITIATIVE_AGENT',
  ],
  lead_campaign: [
    'CAMPAIGN_AGENT',
    'EMAIL_AGENT',
    'SOCIAL_CONTENT_AGENT',
  ],
  franchisee_support: [
    'COACHING_AGENT',
    'ONBOARDING_AGENT',
  ],
  compliance_action: [
    'COO_AGENT',
  ],
  marketing_push: [
    'CMO_AGENT',
    'CAMPAIGN_AGENT',
    'CONTENT_STRATEGY_AGENT',
  ],
};

const PRIORITY_MAP: Record<InitiativeType, number> = {
  territory_expansion: 5,
  compliance_action: 4,
  lead_campaign: 3,
  franchisee_support: 3,
  marketing_push: 2,
};

const AUTO_APPROVE_TYPES: Set<InitiativeType> = new Set([
  'marketing_push',
  'lead_campaign',
]);

// ---------------------------------------------------------------------------
// Classification logic
// ---------------------------------------------------------------------------

/**
 * Score each initiative type by counting keyword matches in the combined
 * text corpus (title + description + signals). The type with the highest
 * match count wins.
 */
function scoreType(text: string): InitiativeType {
  const lower = text.toLowerCase();

  let bestType: InitiativeType = 'marketing_push';
  let bestScore = 0;

  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS) as [InitiativeType, string[]][]) {
    let score = 0;
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }

  return bestType;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Classify an initiative based on its title, description, and signals.
 *
 * Uses keyword matching to determine the initiative type, then maps
 * to the corresponding priority, recommended agents, and auto-approve
 * status.
 */
export function classifyInitiative(input: ClassifierInput): ClassifierOutput {
  const corpus = [
    input.title,
    input.description,
    ...input.signals,
  ].join(' ');

  const type = scoreType(corpus);

  return {
    type,
    priority: PRIORITY_MAP[type],
    recommended_agents: AGENT_MAP[type],
    auto_approve: AUTO_APPROVE_TYPES.has(type),
  };
}

export default classifyInitiative;
