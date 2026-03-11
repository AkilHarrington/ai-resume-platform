/**
 * =========================================================
 * RESUME PARSER - SHARED TYPES
 * =========================================================
 *
 * This file defines the internal types used by the resume
 * parser pipeline.
 *
 * PURPOSE:
 *
 * The parser should not jump directly from raw text to a
 * final ResumeContentJson object without clear intermediate
 * structures.
 *
 * These types help us separate:
 * - raw input text
 * - detected sections
 * - normalized parser output
 * - pipeline result metadata
 *
 * IMPORTANT:
 *
 * These are parser-engine types, not core schema entities.
 * The final output of this engine must still conform to the
 * canonical schema in:
 *
 *   core/schema/resume-content.ts
 *
 * =========================================================
 */

import type { ResumeContentJson } from '../../core/schema';


/**
 * ---------------------------------------------------------
 * KNOWN RESUME SECTION NAMES
 * ---------------------------------------------------------
 *
 * These represent the major sections the parser tries to
 * detect from raw resume text.
 *
 * NOTE:
 * Not every resume will contain every section.
 */
export type ResumeSectionName =
  | 'basics'
  | 'headline'
  | 'summary'
  | 'skills'
  | 'experience'
  | 'education'
  | 'certifications'
  | 'projects'
  | 'unknown';


/**
 * ---------------------------------------------------------
 * RAW DETECTED SECTION
 * ---------------------------------------------------------
 *
 * Represents a section detected from raw resume text before
 * it is normalized into the final structured schema.
 *
 * Example:
 * {
 *   name: 'experience',
 *   heading: 'WORK EXPERIENCE',
 *   content: 'American Airlines...'
 * }
 */
export interface DetectedResumeSection {
  name: ResumeSectionName;
  heading: string;
  content: string;
}


/**
 * ---------------------------------------------------------
 * RESUME SECTION MAP
 * ---------------------------------------------------------
 *
 * Useful for internal parser logic where we want to group
 * detected text by canonical section name.
 */
export type ResumeSectionMap = Partial<
  Record<ResumeSectionName, string>
>;


/**
 * ---------------------------------------------------------
 * PARSER INPUT
 * ---------------------------------------------------------
 *
 * Represents the minimum input needed for the parser
 * pipeline to run.
 *
 * This engine assumes that raw text already exists.
 * File extraction will be handled separately.
 */
export interface ResumeParserInput {
  rawText: string;
}


/**
 * ---------------------------------------------------------
 * PARSER NORMALIZATION WARNINGS
 * ---------------------------------------------------------
 *
 * Warnings allow the parser to communicate problems without
 * fully failing.
 *
 * Examples:
 * - missing summary
 * - no education section found
 * - skills section ambiguous
 */
export interface ResumeParserWarning {
  code: string;
  message: string;
  section?: ResumeSectionName;
}


/**
 * ---------------------------------------------------------
 * PARSER OUTPUT
 * ---------------------------------------------------------
 *
 * This is the normalized output produced by the parser
 * before any database save logic happens.
 *
 * The most important field is `contentJson`, which must
 * conform to the platform's canonical resume schema.
 */
export interface ResumeParserOutput {
  contentJson: ResumeContentJson;
  detectedSections: DetectedResumeSection[];
  warnings: ResumeParserWarning[];
}


/**
 * ---------------------------------------------------------
 * PIPELINE RESULT
 * ---------------------------------------------------------
 *
 * High-level result returned by the full parser pipeline.
 *
 * This gives us a single object containing:
 * - normalized resume content
 * - raw detected sections
 * - warnings for debugging / QA
 */
export interface ResumeParserPipelineResult {
  success: boolean;
  output: ResumeParserOutput;
}