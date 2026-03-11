/**
 * =========================================================
 * RESUME PARSER - SECTION DETECTOR
 * =========================================================
 *
 * PURPOSE:
 *
 * This file is responsible for detecting major resume
 * sections from raw resume text.
 *
 * It performs a lightweight, rule-based first pass using
 * common heading patterns such as:
 *
 * - Summary
 * - Skills
 * - Experience
 * - Education
 * - Certifications
 * - Projects
 *
 * IMPORTANT:
 *
 * This file does NOT attempt to fully parse resume content.
 * Its only job is to identify and segment likely sections.
 *
 * WHY THIS MATTERS:
 *
 * Clean section detection makes the rest of the parser much
 * more reliable because the structurer can work from
 * section-level content instead of one giant text blob.
 *
 * =========================================================
 */

import type {
  DetectedResumeSection,
  ResumeSectionMap,
  ResumeSectionName,
} from './parser-types';


/**
 * ---------------------------------------------------------
 * SECTION HEADING PATTERNS
 * ---------------------------------------------------------
 *
 * These patterns map common resume heading variations to a
 * canonical section name used by the parser.
 *
 * NOTE:
 * We keep this intentionally small and practical for the
 * first version of the parser.
 *
 * This can be expanded later as we test more resume styles.
 */
const SECTION_PATTERNS: Array<{
  name: ResumeSectionName;
  patterns: RegExp[];
}> = [
  {
    name: 'summary',
    patterns: [
      /^summary$/i,
      /^professional summary$/i,
      /^profile$/i,
      /^professional profile$/i,
      /^career summary$/i,
      /^objective$/i,
    ],
  },
  {
    name: 'skills',
    patterns: [
      /^skills$/i,
      /^core skills$/i,
      /^technical skills$/i,
      /^key skills$/i,
      /^competencies$/i,
    ],
  },
  {
    name: 'experience',
    patterns: [
      /^experience$/i,
      /^work experience$/i,
      /^professional experience$/i,
      /^employment history$/i,
      /^career experience$/i,
    ],
  },
  {
    name: 'education',
    patterns: [
      /^education$/i,
      /^academic background$/i,
      /^educational background$/i,
      /^qualifications$/i,
    ],
  },
  {
    name: 'certifications',
    patterns: [
      /^certifications$/i,
      /^certificates$/i,
      /^licenses$/i,
      /^licenses and certifications$/i,
    ],
  },
  {
    name: 'projects',
    patterns: [
      /^projects$/i,
      /^personal projects$/i,
      /^technical projects$/i,
      /^selected projects$/i,
    ],
  },
];


/**
 * ---------------------------------------------------------
 * NORMALIZE LINE
 * ---------------------------------------------------------
 *
 * Trims whitespace and removes repeated spaces so heading
 * matching is more reliable.
 */
function normalizeLine(line: string): string {
  return line.replace(/\s+/g, ' ').trim();
}


/**
 * ---------------------------------------------------------
 * MATCH SECTION NAME
 * ---------------------------------------------------------
 *
 * Attempts to match a single line of text to one of the
 * known canonical resume section names.
 *
 * Returns:
 * - the matched section name if found
 * - null if the line does not look like a known heading
 */
function matchSectionName(line: string): ResumeSectionName | null {
  const normalized = normalizeLine(line);

  for (const section of SECTION_PATTERNS) {
    for (const pattern of section.patterns) {
      if (pattern.test(normalized)) {
        return section.name;
      }
    }
  }

  return null;
}


/**
 * ---------------------------------------------------------
 * SPLIT RAW TEXT INTO LINES
 * ---------------------------------------------------------
 *
 * Converts raw resume text into clean, non-empty lines.
 */
function getCleanLines(rawText: string): string[] {
  return rawText
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter(Boolean);
}


/**
 * ---------------------------------------------------------
 * DETECT RESUME SECTIONS
 * ---------------------------------------------------------
 *
 * Performs a rule-based scan across resume lines and groups
 * content under detected section headings.
 *
 * BEHAVIOR:
 *
 * 1. Start with an implicit `basics` bucket.
 * 2. Move into a new section whenever a known heading is
 *    detected.
 * 3. Collect all following lines until the next heading.
 * 4. Return a normalized list of detected sections.
 *
 * NOTE:
 * The text before the first recognized heading is treated as
 * the `basics` section. This usually contains:
 * - name
 * - contact info
 * - headline
 */
export function detectResumeSections(
  rawText: string,
): DetectedResumeSection[] {
  const lines = getCleanLines(rawText);

  if (lines.length === 0) {
    return [];
  }

  const sections: DetectedResumeSection[] = [];

  let currentSectionName: ResumeSectionName = 'basics';
  let currentHeading = 'BASICS';
  let currentContent: string[] = [];

  function pushCurrentSection(): void {
    const content = currentContent.join('\n').trim();

    if (!content) {
      return;
    }

    sections.push({
      name: currentSectionName,
      heading: currentHeading,
      content,
    });
  }

  for (const line of lines) {
    const matchedSection = matchSectionName(line);

    if (matchedSection) {
      pushCurrentSection();

      currentSectionName = matchedSection;
      currentHeading = line;
      currentContent = [];
      continue;
    }

    currentContent.push(line);
  }

  pushCurrentSection();

  return sections;
}


/**
 * ---------------------------------------------------------
 * CONVERT DETECTED SECTIONS TO MAP
 * ---------------------------------------------------------
 *
 * Useful for downstream parser logic that wants quick
 * access to section content by canonical section name.
 *
 * NOTE:
 * If multiple sections of the same type are detected, their
 * content will be joined together.
 */
export function buildResumeSectionMap(
  sections: DetectedResumeSection[],
): ResumeSectionMap {
  const map: ResumeSectionMap = {};

  for (const section of sections) {
    const existing = map[section.name];

    if (!existing) {
      map[section.name] = section.content;
      continue;
    }

    map[section.name] = `${existing}\n${section.content}`.trim();
  }

  return map;
}