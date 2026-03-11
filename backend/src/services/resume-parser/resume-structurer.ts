/**
 * =========================================================
 * RESUME PARSER - RESUME STRUCTURER
 * =========================================================
 *
 * PURPOSE:
 *
 * This file converts detected resume sections into the
 * canonical ResumeContentJson structure used by the platform.
 *
 * IMPORTANT:
 *
 * This is a rule-based v1 structurer.
 *
 * It is intentionally simple, predictable, and easy to
 * debug. We are not trying to solve every possible resume
 * format yet.
 *
 * GOALS FOR V1:
 *
 * - extract basic contact info
 * - infer headline from early lines
 * - map major sections into schema fields
 * - return a valid ResumeContentJson object every time
 *
 * =========================================================
 */

import type { ResumeContentJson } from '../../core/schema';
import type { ResumeSectionMap } from './parser-types';


/**
 * ---------------------------------------------------------
 * EMPTY RESUME CONTENT FACTORY
 * ---------------------------------------------------------
 *
 * Creates a safe default ResumeContentJson object so the
 * parser always returns a valid schema shape.
 */
function createEmptyResumeContent(): ResumeContentJson {
  return {
    basics: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      portfolio: '',
    },
    headline: '',
    summary: '',
    skills: {
      core: [],
      technical: [],
      tools: [],
      soft: [],
    },
    experience: [],
    education: [],
    certifications: [],
    projects: [],
  };
}


/**
 * ---------------------------------------------------------
 * CLEAN SECTION LINES
 * ---------------------------------------------------------
 *
 * Splits section content into trimmed non-empty lines.
 */
function toLines(value?: string): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}


/**
 * ---------------------------------------------------------
 * BASIC EMAIL EXTRACTION
 * ---------------------------------------------------------
 */
function extractEmail(text: string): string {
  const match = text.match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  );

  return match?.[0] ?? '';
}


/**
 * ---------------------------------------------------------
 * BASIC PHONE EXTRACTION
 * ---------------------------------------------------------
 *
 * This is intentionally simple for v1.
 */
function extractPhone(text: string): string {
  const match = text.match(
    /(\+?\d[\d\s\-()]{7,}\d)/,
  );

  return match?.[0]?.trim() ?? '';
}


/**
 * ---------------------------------------------------------
 * BASIC LINK EXTRACTION
 * ---------------------------------------------------------
 *
 * Detects LinkedIn and general portfolio links.
 */
function extractLinks(text: string): {
  linkedin: string;
  portfolio: string;
} {
  const urlMatches = text.match(
    /(https?:\/\/[^\s]+|www\.[^\s]+)/gi,
  ) ?? [];

  let linkedin = '';
  let portfolio = '';

  for (const url of urlMatches) {
    const normalized = url.trim();

    if (!linkedin && /linkedin\.com/i.test(normalized)) {
      linkedin = normalized;
      continue;
    }

    if (!portfolio) {
      portfolio = normalized;
    }
  }

  return { linkedin, portfolio };
}


/**
 * ---------------------------------------------------------
 * EXTRACT BASICS
 * ---------------------------------------------------------
 *
 * The `basics` section usually contains:
 * - full name
 * - contact details
 * - early resume headline
 *
 * V1 HEURISTIC:
 * - first non-empty line → full name
 * - second line → possible headline
 * - search entire basics text for email / phone / links
 */
function extractBasicsAndHeadline(
  basicsText?: string,
): {
  basics: ResumeContentJson['basics'];
  headline: string;
} {
  const lines = toLines(basicsText);
  const fullText = lines.join(' ');

  const email = extractEmail(fullText);
  const phone = extractPhone(fullText);
  const { linkedin, portfolio } = extractLinks(fullText);

  const fullName = lines[0] ?? '';

  let headline = '';
  if (lines.length > 1) {
    const secondLine = lines[1];

    const looksLikeContactLine =
      secondLine.includes('@') ||
      /linkedin/i.test(secondLine) ||
      /\+?\d/.test(secondLine);

    if (!looksLikeContactLine) {
      headline = secondLine;
    }
  }

  /**
   * Very lightweight location guess:
   * choose the first line containing a comma that is not
   * obviously an email or a URL.
   */
  const location =
    lines.find((line) => {
      return (
        line.includes(',') &&
        !line.includes('@') &&
        !/https?:\/\//i.test(line) &&
        !/www\./i.test(line)
      );
    }) ?? '';

  return {
    basics: {
      fullName,
      email,
      phone,
      location,
      linkedin,
      portfolio,
    },
    headline,
  };
}


/**
 * ---------------------------------------------------------
 * EXTRACT SUMMARY
 * ---------------------------------------------------------
 *
 * For v1, the summary section is simply flattened into one
 * readable paragraph string.
 */
function extractSummary(summaryText?: string): string {
  return toLines(summaryText).join(' ').trim();
}


/**
 * ---------------------------------------------------------
 * EXTRACT SKILLS
 * ---------------------------------------------------------
 *
 * V1 STRATEGY:
 * - split by commas
 * - split by bullets
 * - normalize items
 *
 * For now, all parsed skills go into `core`.
 * More advanced categorization can come later.
 */
function extractSkills(skillsText?: string): ResumeContentJson['skills'] {
  const raw = toLines(skillsText).join('\n');

  if (!raw) {
    return {
      core: [],
      technical: [],
      tools: [],
      soft: [],
    };
  }

  const skillItems = raw
    .split(/[\n,•|]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    core: skillItems,
    technical: [],
    tools: [],
    soft: [],
  };
}


/**
 * ---------------------------------------------------------
 * EXTRACT EXPERIENCE
 * ---------------------------------------------------------
 *
 * V1 STRATEGY:
 * - split section into blocks by blank-line-like breaks is
 *   not reliable after normalization, so for now we create
 *   one experience item from the full section
 * - first line → possible title/company descriptor
 * - remaining lines → bullets
 *
 * This is intentionally conservative for the first parser
 * version and can be improved later.
 */
function extractExperience(
  experienceText?: string,
): ResumeContentJson['experience'] {
  const lines = toLines(experienceText);

  if (lines.length === 0) {
    return [];
  }

  const firstLine = lines[0] ?? '';
  const remaining = lines.slice(1);

  return [
    {
      company: '',
      title: firstLine,
      location: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      bullets: remaining.length > 0 ? remaining : [firstLine],
    },
  ];
}


/**
 * ---------------------------------------------------------
 * EXTRACT EDUCATION
 * ---------------------------------------------------------
 *
 * V1 STRATEGY:
 * - each line becomes a basic education entry
 */
function extractEducation(
  educationText?: string,
): ResumeContentJson['education'] {
  const lines = toLines(educationText);

  return lines.map((line) => ({
    institution: line,
    credential: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
  }));
}


/**
 * ---------------------------------------------------------
 * EXTRACT CERTIFICATIONS
 * ---------------------------------------------------------
 *
 * V1 STRATEGY:
 * - each line becomes a certification entry
 */
function extractCertifications(
  certificationsText?: string,
): ResumeContentJson['certifications'] {
  const lines = toLines(certificationsText);

  return lines.map((line) => ({
    name: line,
    issuer: '',
    date: '',
  }));
}


/**
 * ---------------------------------------------------------
 * EXTRACT PROJECTS
 * ---------------------------------------------------------
 *
 * V1 STRATEGY:
 * - each line becomes a lightweight project entry
 */
function extractProjects(
  projectsText?: string,
): ResumeContentJson['projects'] {
  const lines = toLines(projectsText);

  return lines.map((line) => ({
    name: line,
    description: '',
    technologies: [],
    link: '',
  }));
}


/**
 * ---------------------------------------------------------
 * BUILD STRUCTURED RESUME CONTENT
 * ---------------------------------------------------------
 *
 * Converts a ResumeSectionMap into the canonical
 * ResumeContentJson shape.
 *
 * This function must always return a valid object, even if
 * some sections are missing.
 */
export function buildResumeContentFromSections(
  sectionMap: ResumeSectionMap,
): ResumeContentJson {
  const base = createEmptyResumeContent();

  const basicsResult = extractBasicsAndHeadline(sectionMap.basics);
  const summary = extractSummary(sectionMap.summary);
  const skills = extractSkills(sectionMap.skills);
  const experience = extractExperience(sectionMap.experience);
  const education = extractEducation(sectionMap.education);
  const certifications = extractCertifications(
    sectionMap.certifications,
  );
  const projects = extractProjects(sectionMap.projects);

  return {
    ...base,
    basics: basicsResult.basics,
    headline: basicsResult.headline,
    summary,
    skills,
    experience,
    education,
    certifications,
    projects,
  };
}