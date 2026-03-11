/**
 * =========================================================
 * RESUME OPTIMIZER - CHANGE SUMMARY
 * =========================================================
 *
 * PURPOSE:
 *
 * This file builds the canonical ChangeSummary object used
 * to describe what changed during optimization.
 *
 * WHY THIS MATTERS:
 *
 * Change tracking is important for:
 * - before/after comparison
 * - resume version history
 * - QA/debugging
 * - future UI explanation layers
 *
 * IMPORTANT:
 *
 * This is a structured summary, not a full diff engine.
 * It should stay lightweight, predictable, and useful.
 *
 * =========================================================
 */

import type { ChangeSummary, ResumeContentJson } from '../../core/schema';


/**
 * ---------------------------------------------------------
 * GET ADDED SKILLS
 * ---------------------------------------------------------
 *
 * Compares original vs optimized skill buckets and returns
 * any new skill strings introduced in the optimized version.
 *
 * NOTE:
 * In v1, this will often be empty because the skills
 * optimizer mostly cleans and deduplicates rather than adds.
 */
function getAddedSkills(
  original: ResumeContentJson['skills'],
  optimized: ResumeContentJson['skills'],
): string[] {
  const originalSkills = new Set(
    [
      ...original.core,
      ...original.technical,
      ...original.tools,
      ...original.soft,
    ].map((skill) => skill.trim().toLowerCase()),
  );

  const optimizedSkills = [
    ...optimized.core,
    ...optimized.technical,
    ...optimized.tools,
    ...optimized.soft,
  ];

  return optimizedSkills.filter((skill) => {
    const key = skill.trim().toLowerCase();
    return key && !originalSkills.has(key);
  });
}


/**
 * ---------------------------------------------------------
 * COUNT REWRITTEN BULLETS
 * ---------------------------------------------------------
 *
 * Counts how many bullets differ between original and
 * optimized experience entries.
 *
 * V1 NOTE:
 * This is a practical lightweight comparison and assumes
 * experience arrays remain aligned by index.
 */
function countRewrittenBullets(
  original: ResumeContentJson['experience'],
  optimized: ResumeContentJson['experience'],
): number {
  let changedCount = 0;

  const maxEntries = Math.max(original.length, optimized.length);

  for (let i = 0; i < maxEntries; i += 1) {
    const originalBullets = original[i]?.bullets ?? [];
    const optimizedBullets = optimized[i]?.bullets ?? [];

    const maxBullets = Math.max(
      originalBullets.length,
      optimizedBullets.length,
    );

    for (let j = 0; j < maxBullets; j += 1) {
      const before = originalBullets[j] ?? '';
      const after = optimizedBullets[j] ?? '';

      if (before !== after) {
        changedCount += 1;
      }
    }
  }

  return changedCount;
}


/**
 * ---------------------------------------------------------
 * GET MODIFIED SECTIONS
 * ---------------------------------------------------------
 *
 * Determines which major sections changed during
 * optimization.
 */
function getModifiedSections(
  original: ResumeContentJson,
  optimized: ResumeContentJson,
): string[] {
  const sections: string[] = [];

  if (original.headline !== optimized.headline) {
    sections.push('headline');
  }

  if (original.summary !== optimized.summary) {
    sections.push('summary');
  }

  if (JSON.stringify(original.skills) !== JSON.stringify(optimized.skills)) {
    sections.push('skills');
  }

  if (
    JSON.stringify(original.experience) !==
    JSON.stringify(optimized.experience)
  ) {
    sections.push('experience');
  }

  return sections;
}


/**
 * ---------------------------------------------------------
 * BUILD REASON CODES
 * ---------------------------------------------------------
 *
 * Converts changed sections into high-level reason codes.
 *
 * These are intentionally broad so they remain stable even
 * as the optimizer evolves.
 */
function buildReasonCodes(modifiedSections: string[]): string[] {
  const reasonCodes = new Set<string>();

  if (modifiedSections.includes('headline')) {
    reasonCodes.add('headline_strengthening');
  }

  if (modifiedSections.includes('summary')) {
    reasonCodes.add('summary_positioning');
  }

  if (modifiedSections.includes('skills')) {
    reasonCodes.add('skills_cleanup');
  }

  if (modifiedSections.includes('experience')) {
    reasonCodes.add('bullet_strengthening');
  }

  return Array.from(reasonCodes);
}


/**
 * ---------------------------------------------------------
 * BUILD CHANGE SUMMARY
 * ---------------------------------------------------------
 *
 * Main entrypoint for constructing a canonical ChangeSummary
 * from original vs optimized resume content.
 */
export function buildChangeSummary(
  original: ResumeContentJson,
  optimized: ResumeContentJson,
): ChangeSummary {
  const sectionsModified = getModifiedSections(original, optimized);
  const skillsAdded = getAddedSkills(original.skills, optimized.skills);
  const bulletsRewritten = countRewrittenBullets(
    original.experience,
    optimized.experience,
  );

  return {
    summaryChanged: original.summary !== optimized.summary,
    skillsAdded,
    bulletsRewritten,
    sectionsModified,
    reasonCodes: buildReasonCodes(sectionsModified),
  };
}