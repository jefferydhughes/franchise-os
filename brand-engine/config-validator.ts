// ---------------------------------------------------------------------------
// config-validator.ts
// Validates brand config JSON against the required franchise-os schema.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface ColorMap {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  text?: string;
  [key: string]: string | undefined;
}

interface TerritoryRule {
  type?: string;
  value?: string;
  exclusive?: boolean;
  description?: string;
}

interface OnboardingChecklistItem {
  id?: string;
  label?: string;
  required?: boolean;
  order?: number;
  description?: string;
}

interface BrandConfigInput {
  name?: string;
  slug?: string;
  colors?: ColorMap;
  voice_tone?: string;
  territory_rules?: TerritoryRule[];
  royalty_rate?: number;
  onboarding_checklist?: OnboardingChecklistItem[];
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VALID_TERRITORY_TYPES = new Set(["zip", "radius", "county", "state", "custom"]);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

// ---------------------------------------------------------------------------
// Individual field validators
// ---------------------------------------------------------------------------

function validateName(cfg: BrandConfigInput, errors: string[], warnings: string[]): void {
  if (!isNonEmptyString(cfg.name)) {
    errors.push("name is required and must be a non-empty string.");
  } else if (cfg.name.length > 255) {
    warnings.push("name exceeds 255 characters — consider shortening.");
  }
}

function validateSlug(cfg: BrandConfigInput, errors: string[], warnings: string[]): void {
  if (!isNonEmptyString(cfg.slug)) {
    errors.push("slug is required and must be a non-empty string.");
    return;
  }
  if (!SLUG_RE.test(cfg.slug)) {
    errors.push(
      "slug must be lowercase alphanumeric with hyphens only (e.g. 'acme-burgers')."
    );
  }
  if (cfg.slug.length > 128) {
    warnings.push("slug exceeds 128 characters — consider shortening.");
  }
}

function validateColors(cfg: BrandConfigInput, errors: string[], warnings: string[]): void {
  if (!cfg.colors || typeof cfg.colors !== "object" || Array.isArray(cfg.colors)) {
    errors.push("colors is required and must be an object.");
    return;
  }

  const required: (keyof ColorMap)[] = ["primary", "secondary", "accent", "background", "text"];

  for (const key of required) {
    const val = cfg.colors[key];
    if (!isNonEmptyString(val)) {
      if (key === "primary") {
        errors.push(`colors.${key} is required.`);
      } else {
        warnings.push(`colors.${key} is missing — a default will be used.`);
      }
    } else if (!HEX_COLOR_RE.test(val) && !val.startsWith("rgb") && !val.startsWith("hsl")) {
      warnings.push(
        `colors.${key} ("${val}") does not look like a valid color value (hex/rgb/hsl).`
      );
    }
  }
}

function validateVoiceTone(cfg: BrandConfigInput, errors: string[], warnings: string[]): void {
  if (!isNonEmptyString(cfg.voice_tone)) {
    errors.push("voice_tone is required and must be a non-empty string.");
  } else if (cfg.voice_tone.length < 10) {
    warnings.push(
      "voice_tone is very short — provide a richer description for better AI-generated content."
    );
  }
}

function validateTerritoryRules(
  cfg: BrandConfigInput,
  errors: string[],
  warnings: string[]
): void {
  if (!Array.isArray(cfg.territory_rules)) {
    errors.push("territory_rules is required and must be an array.");
    return;
  }

  if (cfg.territory_rules.length === 0) {
    warnings.push("territory_rules is empty — no territory protection will be enforced.");
    return;
  }

  cfg.territory_rules.forEach((rule, idx) => {
    if (!rule || typeof rule !== "object") {
      errors.push(`territory_rules[${idx}] must be an object.`);
      return;
    }
    if (!isNonEmptyString(rule.type)) {
      errors.push(`territory_rules[${idx}].type is required.`);
    } else if (!VALID_TERRITORY_TYPES.has(rule.type)) {
      errors.push(
        `territory_rules[${idx}].type "${rule.type}" is invalid. Must be one of: ${[...VALID_TERRITORY_TYPES].join(", ")}.`
      );
    }
    if (!isNonEmptyString(rule.value)) {
      errors.push(`territory_rules[${idx}].value is required.`);
    }
    if (typeof rule.exclusive !== "boolean") {
      warnings.push(
        `territory_rules[${idx}].exclusive is missing or not a boolean — defaults to false.`
      );
    }
  });
}

function validateRoyaltyRate(cfg: BrandConfigInput, errors: string[], warnings: string[]): void {
  if (cfg.royalty_rate == null) {
    errors.push("royalty_rate is required.");
    return;
  }
  if (!isNumber(cfg.royalty_rate)) {
    errors.push("royalty_rate must be a number.");
    return;
  }
  if (cfg.royalty_rate < 0 || cfg.royalty_rate > 100) {
    errors.push("royalty_rate must be between 0 and 100 (inclusive).");
  }
  if (cfg.royalty_rate > 50) {
    warnings.push("royalty_rate exceeds 50% — verify this is intentional.");
  }
}

function validateOnboardingChecklist(
  cfg: BrandConfigInput,
  errors: string[],
  warnings: string[]
): void {
  if (!Array.isArray(cfg.onboarding_checklist)) {
    errors.push("onboarding_checklist is required and must be an array.");
    return;
  }

  if (cfg.onboarding_checklist.length === 0) {
    warnings.push("onboarding_checklist is empty — no onboarding steps will be presented.");
    return;
  }

  const ids = new Set<string>();

  cfg.onboarding_checklist.forEach((item, idx) => {
    if (!item || typeof item !== "object") {
      errors.push(`onboarding_checklist[${idx}] must be an object.`);
      return;
    }
    if (!isNonEmptyString(item.id)) {
      errors.push(`onboarding_checklist[${idx}].id is required.`);
    } else if (ids.has(item.id)) {
      errors.push(`onboarding_checklist[${idx}].id "${item.id}" is a duplicate.`);
    } else {
      ids.add(item.id);
    }
    if (!isNonEmptyString(item.label)) {
      errors.push(`onboarding_checklist[${idx}].label is required.`);
    }
    if (typeof item.required !== "boolean") {
      warnings.push(
        `onboarding_checklist[${idx}].required is missing or not boolean — defaults to false.`
      );
    }
    if (!isNumber(item.order)) {
      warnings.push(
        `onboarding_checklist[${idx}].order is missing or not a number — item may sort unpredictably.`
      );
    }
  });
}

// ---------------------------------------------------------------------------
// Main validator
// ---------------------------------------------------------------------------

/**
 * Validate a brand configuration object against the franchise-os schema.
 *
 * @param config - Raw JSON config to validate (typically parsed from Supabase).
 * @returns A `ValidationResult` with `valid`, `errors`, and `warnings`.
 */
export function validateBrandConfig(config: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return {
      valid: false,
      errors: ["Config must be a non-null object."],
      warnings,
    };
  }

  const cfg = config as BrandConfigInput;

  validateName(cfg, errors, warnings);
  validateSlug(cfg, errors, warnings);
  validateColors(cfg, errors, warnings);
  validateVoiceTone(cfg, errors, warnings);
  validateTerritoryRules(cfg, errors, warnings);
  validateRoyaltyRate(cfg, errors, warnings);
  validateOnboardingChecklist(cfg, errors, warnings);

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Convenience wrapper: throws if config is invalid, otherwise returns the
 * validated config cast to `BrandConfigInput`.
 */
export function assertValidBrandConfig(config: unknown): BrandConfigInput {
  const result = validateBrandConfig(config);
  if (!result.valid) {
    throw new Error(
      `Invalid brand config:\n  - ${result.errors.join("\n  - ")}`
    );
  }
  return config as BrandConfigInput;
}
