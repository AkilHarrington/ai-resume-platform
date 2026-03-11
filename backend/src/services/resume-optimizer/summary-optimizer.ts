/**
 * =========================================================
 * RESUME OPTIMIZER - SUMMARY OPTIMIZER
 * =========================================================
 *
 * PURPOSE:
 *
 * This file improves the resume summary in a conservative,
 * schema-safe way.
 *
 * V1 GOALS:
 *
 * - preserve a usable existing summary
 * - improve weak or missing summaries
 * - generate a grounded summary from existing resume data
 *
 * IMPORTANT:
 *
 * This optimizer must never invent fake achievements,
 * years of experience, or unsupported seniority.
 *
 * It should produce summaries that are:
 * - clean
 * - believable
 * - professionally positioned
 * - supported by existing content
 *
 * =========================================================
 */

import type { ResumeContentJson } from '../../core/schema';
import type { SectionOptimizationResult } from './optimizer-types';


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
 * IS USABLE SUMMARY
 * ---------------------------------------------------------
 *
 * A lightweight heuristic for whether an existing summary
 * is already usable enough to preserve.
 */
function isUsableSummary(summary: string): boolean {
  const normalized = normalizeText(summary);

  if (!normalized) {
    return false;
  }

  if (normalized.length < 40) {
    return false;
  }

  if (normalized.length > 400) {
    return false;
  }

  return true;
}


/**
 * ---------------------------------------------------------
 * GET PRIMARY SKILLS
 * ---------------------------------------------------------
 *
 * Returns up to a few skills for summary construction.
 */
function getPrimarySkills(contentJson: ResumeContentJson): string[] {
  const allSkills = [
    ...contentJson.skills.core,
    ...contentJson.skills.technical,
    ...contentJson.skills.tools,
  ]
    .map(normalizeText)
    .filter(Boolean);

  return Array.from(new Set(allSkills)).slice(0, 3);
}


/**
 * ---------------------------------------------------------
 * GET EXPERIENCE TITLE SIGNAL
 * ---------------------------------------------------------
 *
 * Uses the first experience title as a grounded role clue.
 */
function getExperienceTitleSignal(
  contentJson: ResumeContentJson,
): string {
  return normalizeText(contentJson.experience[0]?.title ?? '');
}


/**
 * ---------------------------------------------------------
 * BUILD SUMMARY
 * ---------------------------------------------------------
 *
 * Generates a simple, grounded professional summary using
 * only information already present in the structured resume.
 *
 * V1 STRATEGY:
 * - prefer headline if available
 * - otherwise use first experience title
 * - add a concise professional-value statement
 * - optionally include a small skill phrase
 */
function buildSummary(
  contentJson: ResumeContentJson,
): string {
  const headline = normalizeText(contentJson.headline);
  const roleSignal = headline || getExperienceTitleSignal(contentJson);
  const skills = getPrimarySkills(contentJson);

  const intro = roleSignal
    ? `${roleSignal} with experience supporting professional operations and day-to-day execution.`
    : 'Professional candidate with experience supporting operations and delivering consistent results.';

  const skillSentence =
    skills.length > 0
      ? ` Brings strengths in ${skills.join(', ')}.`
      : '';

  const closing =
    ' Focused on clear communication, reliability, and practical contribution in fast-moving environments.';

  return normalizeText(`${intro}${skillSentence}${closing}`);
}


/**
 * ---------------------------------------------------------
 * OPTIMIZE SUMMARY
 * ---------------------------------------------------------
 *
 * RULES:
 * - preserve a good summary
 * - otherwise generate a grounded replacement
 * - if confidence is low, preserve original and warn
 */
export function optimizeSummary(
  contentJson: ResumeContentJson,
): SectionOptimizationResult<string> {
  const warnings: SectionOptimizationResult<string>['warnings'] = [];
  const currentSummary = normalizeText(contentJson.summary);

  if (isUsableSummary(currentSummary)) {
    return {
      changed: false,
      value: currentSummary,
      warnings,
    };
  }

  const generatedSummary = buildSummary(contentJson);

  if (generatedSummary && generatedSummary.length >= 40) {
    return {
      changed: currentSummary !== generatedSummary,
      value: generatedSummary,
      warnings,
    };
  }

  warnings.push({
    code: 'summary_not_confidently_optimized',
    message:
      'Optimizer could not confidently generate a stronger summary, so the original summary was preserved.',
    section: 'summary',
  });

  return {
    changed: false,
    value: currentSummary,
    warnings,
  };
}