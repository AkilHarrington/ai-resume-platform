/**
 * =========================================================
 * RESUME OPTIMIZER - EXPERIENCE OPTIMIZER
 * =========================================================
 *
 * PURPOSE:
 *
 * This file improves experience bullets in a conservative,
 * schema-safe way.
 *
 * V1 GOALS:
 *
 * - strengthen weak bullet phrasing
 * - prefer action-oriented bullet openings
 * - preserve grounded facts
 * - avoid inventing metrics or achievements
 *
 * IMPORTANT:
 *
 * This optimizer must never fabricate:
 * - numbers
 * - percentages
 * - leadership claims
 * - new responsibilities
 *
 * It should improve wording only when the source bullet
 * already contains enough grounded meaning to support that.
 *
 * =========================================================
 */

import type { ResumeContentJson } from '../../core/schema';
import type { SectionOptimizationResult } from './optimizer-types';


/**
 * ---------------------------------------------------------
 * ACTION VERB REPLACEMENTS
 * ---------------------------------------------------------
 *
 * Used to strengthen common weak bullet openings.
 *
 * NOTE:
 * These replacements are intentionally conservative.
 */
const WEAK_OPENING_REPLACEMENTS: Array<{
  pattern: RegExp;
  replacement: string;
}> = [
  {
    pattern: /^responsible for\s+/i,
    replacement: '',
  },
  {
    pattern: /^helped with\s+/i,
    replacement: 'Supported ',
  },
  {
    pattern: /^assisted with\s+/i,
    replacement: 'Supported ',
  },
  {
    pattern: /^worked on\s+/i,
    replacement: 'Contributed to ',
  },
  {
    pattern: /^involved in\s+/i,
    replacement: 'Supported ',
  },
  {
    pattern: /^tasked with\s+/i,
    replacement: 'Handled ',
  },
];


/**
 * ---------------------------------------------------------
 * NORMALIZE TEXT
 * ---------------------------------------------------------
 */
function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}


/**
 * ---------------------------------------------------------
 * CAPITALIZE FIRST LETTER
 * ---------------------------------------------------------
 */
function capitalizeFirst(value: string): string {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}


/**
 * ---------------------------------------------------------
 * CLEAN BULLET ENDING
 * ---------------------------------------------------------
 *
 * Normalizes punctuation at the end of a bullet.
 */
function cleanBulletEnding(value: string): string {
  const cleaned = value.replace(/[.;:,]+$/g, '').trim();

  if (!cleaned) {
    return '';
  }

  return `${cleaned}.`;
}


/**
 * ---------------------------------------------------------
 * OPTIMIZE SINGLE BULLET
 * ---------------------------------------------------------
 *
 * V1 STRATEGY:
 * - clean spacing
 * - replace weak openings where safe
 * - preserve original meaning
 * - avoid aggressive rewriting
 */
function optimizeBulletText(bullet: string): string {
  let next = normalizeText(bullet);

  if (!next) {
    return '';
  }

  for (const rule of WEAK_OPENING_REPLACEMENTS) {
    if (rule.pattern.test(next)) {
      next = next.replace(rule.pattern, rule.replacement);
      break;
    }
  }

  next = capitalizeFirst(normalizeText(next));
  next = cleanBulletEnding(next);

  return next;
}


/**
 * ---------------------------------------------------------
 * OPTIMIZE EXPERIENCE ENTRY
 * ---------------------------------------------------------
 *
 * Improves the bullets for one experience item while
 * preserving all other fields.
 */
function optimizeExperienceItem(
  item: ResumeContentJson['experience'][number],
): ResumeContentJson['experience'][number] {
  const optimizedBullets = item.bullets
    .map(optimizeBulletText)
    .filter(Boolean);

  return {
    ...item,
    bullets: optimizedBullets,
  };
}


/**
 * ---------------------------------------------------------
 * HAS EXPERIENCE BULLETS
 * ---------------------------------------------------------
 */
function hasExperienceBullets(
  contentJson: ResumeContentJson,
): boolean {
  return contentJson.experience.some(
    (item) => item.bullets && item.bullets.length > 0,
  );
}


/**
 * ---------------------------------------------------------
 * OPTIMIZE EXPERIENCE
 * ---------------------------------------------------------
 *
 * RULES:
 * - preserve company/title/date fields
 * - optimize bullets conservatively
 * - do not invent facts
 */
export function optimizeExperience(
  contentJson: ResumeContentJson,
): SectionOptimizationResult<ResumeContentJson['experience']> {
  const warnings: SectionOptimizationResult<
    ResumeContentJson['experience']
  >['warnings'] = [];

  if (!contentJson.experience.length) {
    warnings.push({
      code: 'experience_not_confidently_optimized',
      message:
        'Optimizer could not improve experience because no structured experience entries were present.',
      section: 'experience',
    });

    return {
      changed: false,
      value: contentJson.experience,
      warnings,
    };
  }

  if (!hasExperienceBullets(contentJson)) {
    warnings.push({
      code: 'experience_bullets_missing',
      message:
        'Optimizer preserved experience entries because there were no bullets to improve.',
      section: 'experience',
    });

    return {
      changed: false,
      value: contentJson.experience,
      warnings,
    };
  }

  const optimizedExperience = contentJson.experience.map(
    optimizeExperienceItem,
  );

  const changed =
    JSON.stringify(contentJson.experience) !==
    JSON.stringify(optimizedExperience);

  return {
    changed,
    value: optimizedExperience,
    warnings,
  };
}