import type { ModelTier } from '@/types/franchise-os';

const MODEL_DEFAULTS: Record<ModelTier, string> = {
  strategic: 'claude-opus-4-5-20250918',
  operational: 'claude-sonnet-4-5-20250514',
  worker: 'claude-haiku-4-5-20251001',
};

/**
 * Resolve a model identifier for the given tier.
 * Reads from env vars MODEL_STRATEGIC / MODEL_OPERATIONAL / MODEL_WORKER,
 * falling back to sensible defaults.
 */
export function getModel(tier: ModelTier): string {
  switch (tier) {
    case 'strategic':
      return process.env.MODEL_STRATEGIC ?? MODEL_DEFAULTS.strategic;
    case 'operational':
      return process.env.MODEL_OPERATIONAL ?? MODEL_DEFAULTS.operational;
    case 'worker':
      return process.env.MODEL_WORKER ?? MODEL_DEFAULTS.worker;
  }
}

const STRATEGIC_KEYWORDS = [
  'strategy',
  'expansion',
  'investment',
  'acquisition',
  'market analysis',
];

const WORKER_KEYWORDS = [
  'email',
  'report',
  'format',
  'template',
  'generate',
];

/**
 * Simple keyword-based routing to decide which model tier a task needs.
 */
export function routeRequest(taskDescription: string): ModelTier {
  const lower = taskDescription.toLowerCase();

  if (STRATEGIC_KEYWORDS.some((kw) => lower.includes(kw))) {
    return 'strategic';
  }

  if (WORKER_KEYWORDS.some((kw) => lower.includes(kw))) {
    return 'worker';
  }

  return 'operational';
}
