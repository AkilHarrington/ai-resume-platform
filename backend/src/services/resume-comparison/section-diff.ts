/**
 * =========================================================
 * RESUME COMPARISON - SECTION DIFF
 * =========================================================
 *
 * PURPOSE:
 *
 * Detects whether the major resume sections changed between
 * the original and optimized versions.
 *
 * This powers UI indicators such as:
 * - Headline improved
 * - Summary rewritten
 * - Skills cleaned
 * - Experience strengthened
 *
 * IMPORTANT:
 *
 * This module does not explain *how much* a section changed.
 * It only answers:
 *
 *   "Did this section change?"
 *
 * More detailed section-level analysis can be added later.
 *
 * =========================================================
 */

import type { ResumeContentJson } from '../../core/schema';
import type { SectionDiff } from './comparison-types';


/**
 * ---------------------------------------------------------
 * BUILD SECTION DIFF
 * ---------------------------------------------------------
 *
 * Compares major sections between original and optimized
 * resume content.
 */
export function buildSectionDiff(
  originalContent: ResumeContentJson,
  optimizedContent: ResumeContentJson,
): SectionDiff {
  return {
    headlineChanged:
      originalContent.headline !== optimizedContent.headline,

    summaryChanged:
      originalContent.summary !== optimizedContent.summary,

    skillsChanged:
      JSON.stringify(originalContent.skills) !==
      JSON.stringify(optimizedContent.skills),

    experienceChanged:
      JSON.stringify(originalContent.experience) !==
      JSON.stringify(optimizedContent.experience),
  };
}