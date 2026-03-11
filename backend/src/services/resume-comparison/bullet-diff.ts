/**
 * =========================================================
 * RESUME COMPARISON - BULLET DIFF
 * =========================================================
 *
 * PURPOSE:
 *
 * Detects before/after changes in experience bullets between
 * the original and optimized resumes.
 *
 * This powers one of the most valuable UX moments in the
 * product:
 *
 *   "Here is how your bullet points improved."
 *
 * IMPORTANT:
 *
 * This is a lightweight v1 comparison layer.
 *
 * It assumes:
 * - experience entries remain aligned by index
 * - bullets remain aligned by index within each entry
 *
 * That is acceptable for v1 because the optimizer currently
 * performs conservative bullet rewrites rather than major
 * structural transformations.
 *
 * =========================================================
 */

import type { ResumeContentJson } from '../../core/schema';
import type {
  BulletChange,
  ExperienceDiff,
} from './comparison-types';


/**
 * ---------------------------------------------------------
 * BUILD BULLET CHANGES
 * ---------------------------------------------------------
 *
 * Compares original vs optimized experience bullets and
 * returns a list of rewritten bullet pairs.
 */
function buildBulletChanges(
  originalExperience: ResumeContentJson['experience'],
  optimizedExperience: ResumeContentJson['experience'],
): BulletChange[] {
  const rewrittenBullets: BulletChange[] = [];

  const maxEntries = Math.max(
    originalExperience.length,
    optimizedExperience.length,
  );

  for (let i = 0; i < maxEntries; i += 1) {
    const originalBullets = originalExperience[i]?.bullets ?? [];
    const optimizedBullets = optimizedExperience[i]?.bullets ?? [];

    const maxBullets = Math.max(
      originalBullets.length,
      optimizedBullets.length,
    );

    for (let j = 0; j < maxBullets; j += 1) {
      const before = originalBullets[j] ?? '';
      const after = optimizedBullets[j] ?? '';

      if (!before && !after) {
        continue;
      }

      if (before !== after) {
        rewrittenBullets.push({
          before,
          after,
        });
      }
    }
  }

  return rewrittenBullets;
}


/**
 * ---------------------------------------------------------
 * BUILD EXPERIENCE DIFF
 * ---------------------------------------------------------
 *
 * Main entrypoint for experience bullet comparison.
 */
export function buildExperienceDiff(
  originalContent: ResumeContentJson,
  optimizedContent: ResumeContentJson,
): ExperienceDiff {
  const rewrittenBullets = buildBulletChanges(
    originalContent.experience,
    optimizedContent.experience,
  );

  return {
    bulletsChanged: rewrittenBullets.length,
    rewrittenBullets,
  };
}