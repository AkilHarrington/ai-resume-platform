/**
 * =========================================================
 * RESUME SCORING - RULE HELPERS
 * =========================================================
 *
 * PURPOSE:
 *
 * This file contains reusable helper functions used by the
 * resume scoring engine.
 *
 * These helpers are intentionally deterministic.
 *
 * WHY THIS MATTERS:
 *
 * We want scoring to be:
 * - explainable
 * - consistent
 * - debuggable
 *
 * So the first version of scoring should rely on simple,
 * traceable checks rather than opaque logic.
 *
 * =========================================================
 */

import type { ResumeContentJson } from '../../core/schema';


/**
 * ---------------------------------------------------------
 * COMMON ACTION VERBS
 * ---------------------------------------------------------
 *
 * Used as a lightweight signal for stronger bullet writing.
 *
 * NOTE:
 * This is a practical v1 list, not an exhaustive one.
 */
const ACTION_VERBS = new Set([
  'achieved',
  'built',
  'coordinated',
  'created',
  'delivered',
  'designed',
  'developed',
  'drove',
  'executed',
  'generated',
  'implemented',
  'improved',
  'increased',
  'led',
  'managed',
  'optimized',
  'organized',
  'reduced',
  'resolved',
  'supported',
]);


/**
 * ---------------------------------------------------------
 * WEAK BULLET PHRASES
 * ---------------------------------------------------------
 *
 * Used to detect vague or low-impact bullet construction.
 */
const WEAK_BULLET_PHRASES = [
  'responsible for',
  'helped with',
  'worked on',
  'assisted with',
  'involved in',
  'tasked with',
];


/**
 * ---------------------------------------------------------
 * NORMALIZE TEXT
 * ---------------------------------------------------------
 *
 * Lowercases and trims text for easier comparisons.
 */
function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}


/**
 * ---------------------------------------------------------
 * GET ALL EXPERIENCE BULLETS
 * ---------------------------------------------------------
 *
 * Collects all bullets across all experience entries.
 */
export function getAllExperienceBullets(
  contentJson: ResumeContentJson,
): string[] {
  return contentJson.experience.flatMap((item) => item.bullets ?? []);
}


/**
 * ---------------------------------------------------------
 * HAS EMAIL
 * ---------------------------------------------------------
 */
export function hasEmail(contentJson: ResumeContentJson): boolean {
  return Boolean(contentJson.basics.email?.trim());
}


/**
 * ---------------------------------------------------------
 * HAS PHONE
 * ---------------------------------------------------------
 */
export function hasPhone(contentJson: ResumeContentJson): boolean {
  return Boolean(contentJson.basics.phone?.trim());
}


/**
 * ---------------------------------------------------------
 * HAS FULL NAME
 * ---------------------------------------------------------
 */
export function hasFullName(contentJson: ResumeContentJson): boolean {
  return Boolean(contentJson.basics.fullName?.trim());
}


/**
 * ---------------------------------------------------------
 * HAS SUMMARY
 * ---------------------------------------------------------
 */
export function hasSummary(contentJson: ResumeContentJson): boolean {
  return Boolean(contentJson.summary?.trim());
}


/**
 * ---------------------------------------------------------
 * HAS HEADLINE
 * ---------------------------------------------------------
 */
export function hasHeadline(contentJson: ResumeContentJson): boolean {
  return Boolean(contentJson.headline?.trim());
}


/**
 * ---------------------------------------------------------
 * HAS SKILLS
 * ---------------------------------------------------------
 *
 * For v1, we mainly rely on `skills.core`.
 */
export function hasSkills(contentJson: ResumeContentJson): boolean {
  return contentJson.skills.core.length > 0;
}


/**
 * ---------------------------------------------------------
 * HAS EXPERIENCE
 * ---------------------------------------------------------
 */
export function hasExperience(contentJson: ResumeContentJson): boolean {
  return contentJson.experience.length > 0;
}


/**
 * ---------------------------------------------------------
 * HAS EDUCATION
 * ---------------------------------------------------------
 */
export function hasEducation(contentJson: ResumeContentJson): boolean {
  return contentJson.education.length > 0;
}


/**
 * ---------------------------------------------------------
 * COUNT EXPERIENCE BULLETS
 * ---------------------------------------------------------
 */
export function countExperienceBullets(
  contentJson: ResumeContentJson,
): number {
  return getAllExperienceBullets(contentJson).length;
}


/**
 * ---------------------------------------------------------
 * DETECT METRIC IN TEXT
 * ---------------------------------------------------------
 *
 * Looks for lightweight measurable indicators such as:
 * - percentages
 * - dollar values
 * - counts
 * - time reductions
 *
 * This is intentionally simple for v1.
 */
export function containsMetric(text: string): boolean {
  return /(\d+%|\$\d+|\d+\+|\d+\s*(hours?|days?|weeks?|months?|years?))/i.test(
    text,
  );
}


/**
 * ---------------------------------------------------------
 * COUNT BULLETS WITH METRICS
 * ---------------------------------------------------------
 */
export function countBulletsWithMetrics(
  contentJson: ResumeContentJson,
): number {
  return getAllExperienceBullets(contentJson).filter(containsMetric).length;
}


/**
 * ---------------------------------------------------------
 * DETECT ACTION VERB START
 * ---------------------------------------------------------
 *
 * Checks whether a bullet appears to start with a strong
 * action verb.
 */
export function startsWithActionVerb(bullet: string): boolean {
  const firstWord = normalizeText(bullet).split(/\s+/)[0] ?? '';
  return ACTION_VERBS.has(firstWord);
}


/**
 * ---------------------------------------------------------
 * COUNT ACTION-VERB BULLETS
 * ---------------------------------------------------------
 */
export function countActionVerbBullets(
  contentJson: ResumeContentJson,
): number {
  return getAllExperienceBullets(contentJson).filter(startsWithActionVerb).length;
}


/**
 * ---------------------------------------------------------
 * DETECT WEAK BULLET PHRASE
 * ---------------------------------------------------------
 */
export function containsWeakBulletPhrase(bullet: string): boolean {
  const normalized = normalizeText(bullet);
  return WEAK_BULLET_PHRASES.some((phrase) =>
    normalized.includes(phrase),
  );
}


/**
 * ---------------------------------------------------------
 * COUNT WEAK BULLETS
 * ---------------------------------------------------------
 */
export function countWeakBullets(
  contentJson: ResumeContentJson,
): number {
  return getAllExperienceBullets(contentJson).filter(containsWeakBulletPhrase).length;
}


/**
 * ---------------------------------------------------------
 * GET RAW TEXT LINES
 * ---------------------------------------------------------
 *
 * Useful for lightweight formatting checks.
 */
export function getRawTextLines(rawText: string): string[] {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim());
}


/**
 * ---------------------------------------------------------
 * COUNT EMPTY RAW TEXT LINES
 * ---------------------------------------------------------
 */
export function countEmptyRawTextLines(rawText: string): number {
  return getRawTextLines(rawText).filter((line) => !line).length;
}


/**
 * ---------------------------------------------------------
 * COUNT VERY LONG RAW TEXT LINES
 * ---------------------------------------------------------
 *
 * Long lines can indicate poor text extraction or weak
 * formatting.
 */
export function countVeryLongLines(
  rawText: string,
  threshold = 140,
): number {
  return getRawTextLines(rawText).filter(
    (line) => line.length > threshold,
  ).length;
}


/**
 * ---------------------------------------------------------
 * DETECT ALL-CAPS HEAVY TEXT
 * ---------------------------------------------------------
 *
 * Very rough signal for formatting/readability issues.
 */
export function countAllCapsLines(rawText: string): number {
  return getRawTextLines(rawText).filter((line) => {
    if (!line || line.length < 4) {
      return false;
    }

    const lettersOnly = line.replace(/[^A-Za-z]/g, '');
    if (lettersOnly.length < 4) {
      return false;
    }

    return lettersOnly === lettersOnly.toUpperCase();
  }).length;
}


/**
 * ---------------------------------------------------------
 * DETECT NOISY SYMBOL TEXT
 * ---------------------------------------------------------
 *
 * Looks for extraction artifacts or symbol-heavy content.
 */
export function countNoisyLines(rawText: string): number {
  return getRawTextLines(rawText).filter((line) =>
    /[@#$%^&*_=<>~]{3,}/.test(line),
  ).length;
}


/**
 * ---------------------------------------------------------
 * GET TOTAL SECTION COUNT
 * ---------------------------------------------------------
 *
 * Counts the number of major populated sections in the
 * structured resume.
 */
export function countPopulatedSections(
  contentJson: ResumeContentJson,
): number {
  let count = 0;

  if (hasFullName(contentJson)) count += 1;
  if (hasSummary(contentJson)) count += 1;
  if (hasSkills(contentJson)) count += 1;
  if (hasExperience(contentJson)) count += 1;
  if (hasEducation(contentJson)) count += 1;
  if (contentJson.certifications.length > 0) count += 1;
  if (contentJson.projects.length > 0) count += 1;

  return count;
}