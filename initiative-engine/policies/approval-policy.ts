/**
 * initiative-engine/policies/approval-policy.ts
 *
 * Evaluates whether an initiative can be auto-approved or requires
 * human review based on type, budget, and brand rules.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApprovalDecision {
  approved: boolean;
  reason: string;
  requires_human: boolean;
}

// ---------------------------------------------------------------------------
// Budget thresholds
// ---------------------------------------------------------------------------

const HUMAN_REVIEW_BUDGET_THRESHOLD = 1000;
const MARKETING_AUTO_APPROVE_BUDGET = 500;
const FRANCHISEE_SUPPORT_AUTO_APPROVE_BUDGET = 200;

// ---------------------------------------------------------------------------
// Policy evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluate whether an initiative should be auto-approved, rejected,
 * or routed to a human approver.
 *
 * Rules (evaluated in priority order):
 * 1. Any initiative with budget > $1000 requires human approval
 * 2. territory_expansion always requires human approval
 * 3. compliance_action always requires human approval
 * 4. marketing_push auto-approves if budget < $500
 * 5. lead_campaign auto-approves (no budget restriction beyond $1000)
 * 6. franchisee_support auto-approves if budget < $200
 * 7. Unknown types require human approval
 */
export function evaluateApproval(
  type: string,
  budget?: number,
  brandId?: string
): ApprovalDecision {
  // Rule 1: High-budget initiatives always require human review
  if (budget !== undefined && budget > HUMAN_REVIEW_BUDGET_THRESHOLD) {
    return {
      approved: false,
      reason: `Budget of $${budget} exceeds auto-approval threshold of $${HUMAN_REVIEW_BUDGET_THRESHOLD}. Human review required.`,
      requires_human: true,
    };
  }

  // Rule 2: Territory expansion always requires human approval
  if (type === 'territory_expansion') {
    return {
      approved: false,
      reason: 'Territory expansion initiatives always require human approval due to strategic impact.',
      requires_human: true,
    };
  }

  // Rule 3: Compliance actions always require human approval
  if (type === 'compliance_action') {
    return {
      approved: false,
      reason: 'Compliance actions require human approval due to legal and regulatory implications.',
      requires_human: true,
    };
  }

  // Rule 4: Marketing push auto-approves under budget threshold
  if (type === 'marketing_push') {
    if (budget !== undefined && budget >= MARKETING_AUTO_APPROVE_BUDGET) {
      return {
        approved: false,
        reason: `Marketing push budget of $${budget} exceeds auto-approval limit of $${MARKETING_AUTO_APPROVE_BUDGET}. Human review required.`,
        requires_human: true,
      };
    }
    return {
      approved: true,
      reason: budget !== undefined
        ? `Marketing push auto-approved (budget $${budget} is within $${MARKETING_AUTO_APPROVE_BUDGET} limit).`
        : 'Marketing push auto-approved (no budget specified).',
      requires_human: false,
    };
  }

  // Rule 5: Lead campaigns auto-approve
  if (type === 'lead_campaign') {
    return {
      approved: true,
      reason: 'Lead campaign auto-approved per policy.',
      requires_human: false,
    };
  }

  // Rule 6: Franchisee support auto-approves under budget threshold
  if (type === 'franchisee_support') {
    if (budget !== undefined && budget >= FRANCHISEE_SUPPORT_AUTO_APPROVE_BUDGET) {
      return {
        approved: false,
        reason: `Franchisee support budget of $${budget} exceeds auto-approval limit of $${FRANCHISEE_SUPPORT_AUTO_APPROVE_BUDGET}. Human review required.`,
        requires_human: true,
      };
    }
    return {
      approved: true,
      reason: budget !== undefined
        ? `Franchisee support auto-approved (budget $${budget} is within $${FRANCHISEE_SUPPORT_AUTO_APPROVE_BUDGET} limit).`
        : 'Franchisee support auto-approved (no budget specified).',
      requires_human: false,
    };
  }

  // Rule 7: Unknown types require human approval
  return {
    approved: false,
    reason: `Unknown initiative type "${type}" requires human review.`,
    requires_human: true,
  };
}

export default evaluateApproval;
