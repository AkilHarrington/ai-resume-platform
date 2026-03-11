/**
 * =========================================================
 * RESUME PARSER - PIPELINE
 * =========================================================
 *
 * PURPOSE:
 *
 * This file orchestrates the full v1 resume parser flow.
 *
 * PIPELINE:
 *
 * 1. Accept raw resume text
 * 2. Detect likely resume sections
 * 3. Build a section map
 * 4. Convert sections into canonical ResumeContentJson
 * 5. Generate lightweight parser warnings
 * 6. Return a normalized parser result
 *
 * IMPORTANT:
 *
 * This pipeline is intentionally conservative.
 *
 * The goal of v1 is not perfect resume understanding.
 * The goal is:
 *
 * - reliability
 * - valid schema output
 * - predictable behavior
 * - easy debugging
 *
 * =========================================================
 */

import type {
  ResumeParserInput,
  ResumeParserOutput,
  ResumeParserPipelineResult,
  ResumeParserWarning,
} from './parser-types';

import {
  detectResumeSections,
  buildResumeSectionMap,
} from './section-detector';

import { buildResumeContentFromSections } from './resume-structurer';


/**
 * ---------------------------------------------------------
 * GENERATE PARSER WARNINGS
 * ---------------------------------------------------------
 *
 * Produces lightweight warnings when important sections are
 * missing or appear incomplete.
 *
 * IMPORTANT:
 *
 * Warnings do not mean parsing failed.
 * They are there to help:
 * - debugging
 * - QA review
 * - future parser improvements
 */
function generateParserWarnings(
  output: ResumeParserOutput,
): ResumeParserWarning[] {
  const warnings: ResumeParserWarning[] = [];

  if (!output.contentJson.basics.fullName) {
    warnings.push({
      code: 'missing_full_name',
      message: 'Parser could not confidently detect a full name.',
      section: 'basics',
    });
  }

  if (!output.contentJson.basics.email) {
    warnings.push({
      code: 'missing_email',
      message: 'Parser could not detect an email address.',
      section: 'basics',
    });
  }

  if (!output.contentJson.summary) {
    warnings.push({
      code: 'missing_summary',
      message: 'No summary section was detected.',
      section: 'summary',
    });
  }

  if (output.contentJson.skills.core.length === 0) {
    warnings.push({
      code: 'missing_skills',
      message: 'No skills section was detected or parsed.',
      section: 'skills',
    });
  }

  if (output.contentJson.experience.length === 0) {
    warnings.push({
      code: 'missing_experience',
      message: 'No experience section was detected or parsed.',
      section: 'experience',
    });
  }

  if (output.contentJson.education.length === 0) {
    warnings.push({
      code: 'missing_education',
      message: 'No education section was detected or parsed.',
      section: 'education',
    });
  }

  return warnings;
}


/**
 * ---------------------------------------------------------
 * PARSE RESUME TEXT
 * ---------------------------------------------------------
 *
 * Main parser entrypoint for v1.
 *
 * This function:
 * - detects sections
 * - builds structured resume content
 * - attaches warnings
 * - returns a normalized pipeline result
 *
 * NOTE:
 * This function assumes raw text has already been extracted.
 * File extraction is intentionally kept separate.
 */
export function parseResumeText(
  input: ResumeParserInput,
): ResumeParserPipelineResult {
  const detectedSections = detectResumeSections(input.rawText);
  const sectionMap = buildResumeSectionMap(detectedSections);
  const contentJson = buildResumeContentFromSections(sectionMap);

  const output: ResumeParserOutput = {
    contentJson,
    detectedSections,
    warnings: [],
  };

  output.warnings = generateParserWarnings(output);

  return {
    success: true,
    output,
  };
}