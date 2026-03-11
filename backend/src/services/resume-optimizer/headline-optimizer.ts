/**
 * =========================================================
 * RESUME OPTIMIZER - HEADLINE OPTIMIZER
 * =========================================================
 *
 * PURPOSE:
 *
 * This file improves or generates the resume headline in a
 * conservative, schema-safe way.
 *
 * V1 GOALS:
 *
 * - preserve a good existing headline
 * - clean weak/empty headlines
 * - infer a headline from summary or experience when needed
 *
 * IMPORTANT:
 *
 * This optimizer must never invent unsupported seniority or
 * fake credentials.
 *
 * It should prefer:
 * - grounded role language
 * - simplicity
 * - believable positioning
 *
 * =========================================================
 */

import type { ResumeContentJson } from '../../core/schema';
import type {
  SectionOptimizationResult,
} from './optimizer-types';


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
 * TITLE CASE WORD
 * ---------------------------------------------------------
 */
function toTitleCase(value: string): string {
  return value
    .split(/\s+/)
    .map((word) => {
      if (!word) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ')
    .trim();
}


/**
 * ---------------------------------------------------------
 * IS USABLE HEADLINE
 * ---------------------------------------------------------
 *
 * A lightweight heuristic for whether an existing headline
 * is already usable enough to preserve.
 */
function isUsableHeadline(headline: string): boolean {
  const normalized = normalizeText(headline);

  if (!normalized) {
    return false;
  }

  if (normalized.length < 3) {
    return false;
  }

  if (normalized.length > 80) {
    return false;
  }

  return true;
}


/**
 * ---------------------------------------------------------
 * BUILD HEADLINE FROM SUMMARY
 * ---------------------------------------------------------
 *
 * Attempts to infer a grounded headline from the first part
 * of the summary.
 *
 * V1 strategy:
 * - if summary starts with role-like phrasing, reuse it
 * - otherwise return empty string
 */
function buildHeadlineFromSummary(summary: string): string {
  const normalized = normalizeText(summary);

  if (!normalized) {
    return '';
  }

  const candidate = normalized
    .split(/[,.|-]/)[0]
    ?.trim() ?? '';

  if (!candidate) {
    return '';
  }

  if (candidate.length < 3 || candidate.length > 60) {
    return '';
  }

  return toTitleCase(candidate);
}


/**
 * ---------------------------------------------------------
 * BUILD HEADLINE FROM EXPERIENCE
 * ---------------------------------------------------------
 *
 * Uses the first experience title as a fallback.
 */
function buildHeadlineFromExperience(
  contentJson: ResumeContentJson,
): string {
  const firstTitle = contentJson.experience[0]?.title ?? '';
  const normalized = normalizeText(firstTitle);

  if (!normalized) {
    return '';
  }

  if (normalized.length > 60) {
    return '';
  }

  return toTitleCase(normalized);
}


/**
 * ---------------------------------------------------------
 * OPTIMIZE HEADLINE
 * ---------------------------------------------------------
 *
 * Returns an improved headline result.
 *
 * RULES:
 * - preserve a good headline
 * - otherwise infer conservatively
 * - never invent unsupported executive language
 */
export function optimizeHeadline(
  contentJson: ResumeContentJson,
): SectionOptimizationResult<string> {
  const warnings: SectionOptimizationResult<string>['warnings'] = [];
  const currentHeadline = normalizeText(contentJson.headline);

  if (isUsableHeadline(currentHeadline)) {
    return {
      changed: false,
      value: currentHeadline,
      warnings,
    };
  }

  const summaryBasedHeadline = buildHeadlineFromSummary(
    contentJson.summary,
  );

  if (summaryBasedHeadline) {
    return {
      changed: normalizeText(currentHeadline) !== summaryBasedHeadline,
      value: summaryBasedHeadline,
      warnings,
    };
  }

  const experienceBasedHeadline = buildHeadlineFromExperience(
    contentJson,
  );

  if (experienceBasedHeadline) {
    return {
      changed: normalizeText(currentHeadline) !== experienceBasedHeadline,
      value: experienceBasedHeadline,
      warnings,
    };
  }

  warnings.push({
    code: 'headline_not_confidently_optimized',
    message:
      'Optimizer could not confidently infer a stronger headline, so the original headline was preserved.',
    section: 'headline',
  });

  return {
    changed: false,
    value: currentHeadline,
    warnings,
  };
}