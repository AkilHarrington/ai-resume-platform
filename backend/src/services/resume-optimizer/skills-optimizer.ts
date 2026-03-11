/**
 * =========================================================
 * RESUME OPTIMIZER - SKILLS OPTIMIZER
 * =========================================================
 *
 * PURPOSE:
 *
 * This file improves the skills section in a conservative,
 * schema-safe way.
 *
 * V1 GOALS:
 *
 * - normalize skill formatting
 * - remove duplicates
 * - remove obvious noise
 * - preserve grounded skills only
 * - improve scanability without inventing new skills
 *
 * IMPORTANT:
 *
 * This optimizer must never add skills that are not already
 * present somewhere in the structured resume content.
 *
 * It should only:
 * - clean
 * - deduplicate
 * - reorganize lightly
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
 * TO TITLE CASE
 * ---------------------------------------------------------
 *
 * Used to clean skill presentation for display.
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
 * NORMALIZE SKILL ITEM
 * ---------------------------------------------------------
 *
 * Cleans punctuation noise and spacing while preserving
 * the original underlying skill meaning.
 */
function normalizeSkillItem(value: string): string {
  const cleaned = normalizeText(
    value.replace(/[•|]+/g, ' ').replace(/\s+/g, ' '),
  );

  if (!cleaned) {
    return '';
  }

  return toTitleCase(cleaned);
}


/**
 * ---------------------------------------------------------
 * DEDUPLICATE SKILLS
 * ---------------------------------------------------------
 *
 * Case-insensitive de-duplication while preserving the
 * cleaned display version.
 */
function deduplicateSkills(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = normalizeText(value);
    const key = normalized.toLowerCase();

    if (!normalized || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(normalized);
  }

  return result;
}


/**
 * ---------------------------------------------------------
 * CLEAN SKILL ARRAY
 * ---------------------------------------------------------
 *
 * Normalizes and deduplicates one skill bucket.
 */
function cleanSkillArray(values: string[]): string[] {
  const cleaned = values
    .map(normalizeSkillItem)
    .filter(Boolean);

  return deduplicateSkills(cleaned);
}


/**
 * ---------------------------------------------------------
 * HAS ANY SKILLS
 * ---------------------------------------------------------
 */
function hasAnySkills(contentJson: ResumeContentJson): boolean {
  return (
    contentJson.skills.core.length > 0 ||
    contentJson.skills.technical.length > 0 ||
    contentJson.skills.tools.length > 0 ||
    contentJson.skills.soft.length > 0
  );
}


/**
 * ---------------------------------------------------------
 * OPTIMIZE SKILLS
 * ---------------------------------------------------------
 *
 * RULES:
 * - preserve grounded skill content
 * - clean formatting
 * - remove duplicates
 * - do not invent new skills
 */
export function optimizeSkills(
  contentJson: ResumeContentJson,
): SectionOptimizationResult<ResumeContentJson['skills']> {
  const warnings: SectionOptimizationResult<
    ResumeContentJson['skills']
  >['warnings'] = [];

  if (!hasAnySkills(contentJson)) {
    warnings.push({
      code: 'skills_not_confidently_optimized',
      message:
        'Optimizer could not improve the skills section because no structured skills were present.',
      section: 'skills',
    });

    return {
      changed: false,
      value: contentJson.skills,
      warnings,
    };
  }

  const optimizedSkills: ResumeContentJson['skills'] = {
    core: cleanSkillArray(contentJson.skills.core),
    technical: cleanSkillArray(contentJson.skills.technical),
    tools: cleanSkillArray(contentJson.skills.tools),
    soft: cleanSkillArray(contentJson.skills.soft),
  };

  const changed =
    JSON.stringify(contentJson.skills) !== JSON.stringify(optimizedSkills);

  return {
    changed,
    value: optimizedSkills,
    warnings,
  };
}