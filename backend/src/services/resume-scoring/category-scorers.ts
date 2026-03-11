/**
 * =========================================================
 * RESUME SCORING - CATEGORY SCORERS
 * =========================================================
 *
 * PURPOSE:
 *
 * This file contains the category-level scoring functions
 * used by the resume scoring engine.
 *
 * Each function:
 * - evaluates one scoring category
 * - returns a bounded score
 * - produces issues
 * - produces recommendations
 * - tracks triggered rules
 *
 * IMPORTANT:
 *
 * This is a deterministic v1 scoring model.
 *
 * The goal is not perfect judgment.
 * The goal is:
 * - explainable scoring
 * - stable scoring
 * - useful feedback
 *
 * =========================================================
 */

import type {
  CategoryScoreResult,
  ResumeScoringInput,
} from './scoring-types';

import {
  hasEmail,
  hasPhone,
  hasFullName,
  hasSummary,
  hasHeadline,
  hasSkills,
  hasExperience,
  hasEducation,
  countExperienceBullets,
  countBulletsWithMetrics,
  countActionVerbBullets,
  countWeakBullets,
  countEmptyRawTextLines,
  countVeryLongLines,
  countAllCapsLines,
  countNoisyLines,
  countPopulatedSections,
} from './rule-helpers';


/**
 * ---------------------------------------------------------
 * CLAMP SCORE
 * ---------------------------------------------------------
 *
 * Keeps all scores inside the valid 0–100 range.
 */
function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}


/**
 * ---------------------------------------------------------
 * ATS COMPATIBILITY SCORER
 * ---------------------------------------------------------
 *
 * Signals:
 * - presence of full name
 * - email and phone
 * - summary or headline
 * - experience section
 * - skills section
 */
export function scoreATSCompatibility(
  input: ResumeScoringInput,
): CategoryScoreResult {
  let score = 50;

  const issues: CategoryScoreResult['issues'] = [];
  const recommendations: CategoryScoreResult['recommendations'] = [];
  const rulesTriggered: CategoryScoreResult['rulesTriggered'] = {};

  if (hasFullName(input.contentJson)) {
    score += 10;
  } else {
    rulesTriggered.missing_full_name = true;
    score -= 15;
    issues.push({
      code: 'missing_full_name',
      severity: 'high',
      message: 'Resume is missing a clearly detectable full name.',
      targetSection: 'basics',
      suggestedAction: 'Add your full name clearly at the top of the resume.',
    });
  }

  if (hasEmail(input.contentJson)) {
    score += 10;
  } else {
    rulesTriggered.missing_email = true;
    score -= 20;
    issues.push({
      code: 'missing_email',
      severity: 'high',
      message: 'Resume is missing a detectable email address.',
      targetSection: 'basics',
      suggestedAction: 'Add a professional email address in the contact section.',
    });
  }

  if (hasPhone(input.contentJson)) {
    score += 5;
  } else {
    rulesTriggered.missing_phone = true;
    score -= 8;
    issues.push({
      code: 'missing_phone',
      severity: 'medium',
      message: 'Resume is missing a detectable phone number.',
      targetSection: 'basics',
      suggestedAction: 'Add a reachable phone number in the contact section.',
    });
  }

  if (hasHeadline(input.contentJson) || hasSummary(input.contentJson)) {
    score += 8;
  } else {
    rulesTriggered.missing_headline_or_summary = true;
    score -= 10;
    issues.push({
      code: 'missing_headline_or_summary',
      severity: 'medium',
      message: 'Resume lacks a headline or summary to establish positioning.',
      targetSection: 'summary',
      suggestedAction: 'Add a short headline or professional summary.',
    });
  }

  if (hasSkills(input.contentJson)) {
    score += 7;
  } else {
    rulesTriggered.missing_skills_section = true;
    score -= 10;
    issues.push({
      code: 'missing_skills_section',
      severity: 'medium',
      message: 'Resume does not contain a detectable skills section.',
      targetSection: 'skills',
      suggestedAction: 'Add a skills section with relevant strengths and tools.',
    });
  }

  if (hasExperience(input.contentJson)) {
    score += 10;
  } else {
    rulesTriggered.missing_experience_section = true;
    score -= 20;
    issues.push({
      code: 'missing_experience_section',
      severity: 'high',
      message: 'Resume does not contain a detectable experience section.',
      targetSection: 'experience',
      suggestedAction: 'Add work experience entries with role details and bullets.',
    });
  }

  recommendations.push({
    code: 'improve_ats_structure',
    priority: 'medium',
    title: 'Improve ATS readability',
    description: 'Ensure contact info, summary, skills, and experience are clearly structured.',
    targetSection: 'basics',
  });

  return {
    category: 'atsCompatibility',
    score: clampScore(score),
    issues,
    recommendations,
    rulesTriggered,
  };
}


/**
 * ---------------------------------------------------------
 * KEYWORD COVERAGE SCORER
 * ---------------------------------------------------------
 *
 * V1 GENERAL MODE:
 * Since job-description matching is not part of general
 * scoring yet, this score uses practical keyword signals:
 * - skills presence
 * - summary presence
 * - headline presence
 * - breadth of role-related language
 */
export function scoreKeywordCoverage(
  input: ResumeScoringInput,
): CategoryScoreResult {
  let score = 45;

  const issues: CategoryScoreResult['issues'] = [];
  const recommendations: CategoryScoreResult['recommendations'] = [];
  const rulesTriggered: CategoryScoreResult['rulesTriggered'] = {};

  const skillCount =
    input.contentJson.skills.core.length +
    input.contentJson.skills.technical.length +
    input.contentJson.skills.tools.length +
    input.contentJson.skills.soft.length;

  if (skillCount >= 8) {
    score += 20;
  } else if (skillCount >= 4) {
    score += 10;
  } else if (skillCount > 0) {
    score += 4;
  } else {
    rulesTriggered.low_skill_keyword_density = true;
    score -= 15;
    issues.push({
      code: 'low_skill_keyword_density',
      severity: 'high',
      message: 'Resume contains very few identifiable skill keywords.',
      targetSection: 'skills',
      suggestedAction: 'Add a stronger mix of role-relevant skills and tools.',
    });
  }

  if (hasSummary(input.contentJson)) {
    score += 10;
  } else {
    rulesTriggered.missing_summary_for_keywords = true;
    score -= 8;
    issues.push({
      code: 'missing_summary_for_keywords',
      severity: 'medium',
      message: 'Summary section is missing, reducing keyword coverage opportunities.',
      targetSection: 'summary',
      suggestedAction: 'Add a summary with job-relevant language and strengths.',
    });
  }

  if (hasHeadline(input.contentJson)) {
    score += 8;
  } else {
    rulesTriggered.missing_headline_for_positioning = true;
    score -= 5;
    issues.push({
      code: 'missing_headline_for_positioning',
      severity: 'low',
      message: 'Headline is missing, reducing role-positioning clarity.',
      targetSection: 'basics',
      suggestedAction: 'Add a role-aligned headline under your name.',
    });
  }

  if (hasExperience(input.contentJson)) {
    score += 8;
  }

  recommendations.push({
    code: 'improve_keyword_coverage',
    priority: 'high',
    title: 'Improve keyword coverage',
    description: 'Expand job-relevant language across your summary, skills, and experience bullets.',
    targetSection: 'skills',
  });

  return {
    category: 'keywordMatch',
    score: clampScore(score),
    issues,
    recommendations,
    rulesTriggered,
  };
}


/**
 * ---------------------------------------------------------
 * BULLET STRENGTH SCORER
 * ---------------------------------------------------------
 *
 * Signals:
 * - bullet count
 * - measurable results
 * - action verbs
 * - weak phrasing penalties
 */
export function scoreBulletStrength(
  input: ResumeScoringInput,
): CategoryScoreResult {
  let score = 50;

  const issues: CategoryScoreResult['issues'] = [];
  const recommendations: CategoryScoreResult['recommendations'] = [];
  const rulesTriggered: CategoryScoreResult['rulesTriggered'] = {};

  const bulletCount = countExperienceBullets(input.contentJson);
  const bulletsWithMetrics = countBulletsWithMetrics(input.contentJson);
  const actionVerbBullets = countActionVerbBullets(input.contentJson);
  const weakBullets = countWeakBullets(input.contentJson);

  if (bulletCount >= 6) {
    score += 10;
  } else if (bulletCount >= 3) {
    score += 5;
  } else if (bulletCount === 0) {
    rulesTriggered.no_experience_bullets = true;
    score -= 20;
    issues.push({
      code: 'no_experience_bullets',
      severity: 'high',
      message: 'Experience section does not contain clear bullet points.',
      targetSection: 'experience',
      suggestedAction: 'Add concise bullet points describing achievements and responsibilities.',
    });
  }

  if (bulletsWithMetrics >= 3) {
    score += 20;
  } else if (bulletsWithMetrics >= 1) {
    score += 8;
  } else {
    rulesTriggered.missing_metrics_in_bullets = true;
    score -= 18;
    issues.push({
      code: 'missing_metrics_in_bullets',
      severity: 'high',
      message: 'Experience bullets lack measurable results or scope.',
      targetSection: 'experience',
      suggestedAction: 'Add numbers, percentages, time savings, or volume metrics where possible.',
    });
  }

  if (actionVerbBullets >= 3) {
    score += 12;
  } else if (actionVerbBullets >= 1) {
    score += 5;
  } else {
    rulesTriggered.weak_bullet_openings = true;
    score -= 10;
    issues.push({
      code: 'weak_bullet_openings',
      severity: 'medium',
      message: 'Few bullets begin with strong action verbs.',
      targetSection: 'experience',
      suggestedAction: 'Start bullets with stronger action verbs like Managed, Improved, Led, or Coordinated.',
    });
  }

  if (weakBullets >= 3) {
    rulesTriggered.excessive_weak_bullet_phrasing = true;
    score -= 15;
    issues.push({
      code: 'excessive_weak_bullet_phrasing',
      severity: 'high',
      message: 'Several bullets use weak or vague phrasing.',
      targetSection: 'experience',
      suggestedAction: 'Replace vague phrases like “responsible for” with direct impact-oriented statements.',
    });
  } else if (weakBullets >= 1) {
    score -= 6;
  }

  recommendations.push({
    code: 'strengthen_experience_bullets',
    priority: 'high',
    title: 'Strengthen bullet points',
    description: 'Use strong action verbs and measurable outcomes to improve impact.',
    targetSection: 'experience',
  });

  return {
    category: 'bulletStrength',
    score: clampScore(score),
    issues,
    recommendations,
    rulesTriggered,
  };
}


/**
 * ---------------------------------------------------------
 * FORMATTING SCORER
 * ---------------------------------------------------------
 *
 * Uses raw text as a proxy for readability / extraction
 * quality / formatting discipline.
 */
export function scoreFormatting(
  input: ResumeScoringInput,
): CategoryScoreResult {
  let score = 70;

  const issues: CategoryScoreResult['issues'] = [];
  const recommendations: CategoryScoreResult['recommendations'] = [];
  const rulesTriggered: CategoryScoreResult['rulesTriggered'] = {};

  const emptyLines = countEmptyRawTextLines(input.rawText);
  const longLines = countVeryLongLines(input.rawText);
  const allCapsLines = countAllCapsLines(input.rawText);
  const noisyLines = countNoisyLines(input.rawText);

  if (emptyLines > 12) {
    rulesTriggered.excessive_empty_lines = true;
    score -= 8;
    issues.push({
      code: 'excessive_empty_lines',
      severity: 'low',
      message: 'Resume contains many empty lines, which may weaken readability.',
      targetSection: 'basics',
      suggestedAction: 'Tighten spacing so sections feel clean and intentional.',
    });
  }

  if (longLines > 3) {
    rulesTriggered.excessive_long_lines = true;
    score -= 12;
    issues.push({
      code: 'excessive_long_lines',
      severity: 'medium',
      message: 'Resume contains several very long lines, which may reduce readability.',
      targetSection: 'experience',
      suggestedAction: 'Break long statements into shorter bullets or cleaner section content.',
    });
  }

  if (allCapsLines > 5) {
    rulesTriggered.excessive_all_caps_lines = true;
    score -= 8;
    issues.push({
      code: 'excessive_all_caps_lines',
      severity: 'low',
      message: 'Resume contains many all-caps lines, which may feel visually harsh.',
      targetSection: 'basics',
      suggestedAction: 'Use normal capitalization for better readability.',
    });
  }

  if (noisyLines > 0) {
    rulesTriggered.noisy_symbol_artifacts = true;
    score -= 15;
    issues.push({
      code: 'noisy_symbol_artifacts',
      severity: 'medium',
      message: 'Resume text contains symbol-heavy or extraction-noise artifacts.',
      targetSection: 'basics',
      suggestedAction: 'Clean unusual symbols or formatting artifacts from the document.',
    });
  }

  recommendations.push({
    code: 'improve_resume_formatting',
    priority: 'medium',
    title: 'Improve formatting clarity',
    description: 'Keep section spacing clean, reduce noisy formatting, and make bullets easier to scan.',
    targetSection: 'basics',
  });

  return {
    category: 'formatting',
    score: clampScore(score),
    issues,
    recommendations,
    rulesTriggered,
  };
}


/**
 * ---------------------------------------------------------
 * SECTION COMPLETENESS SCORER
 * ---------------------------------------------------------
 *
 * Rewards presence of important sections.
 */
export function scoreSectionCompleteness(
  input: ResumeScoringInput,
): CategoryScoreResult {
  let score = 35;

  const issues: CategoryScoreResult['issues'] = [];
  const recommendations: CategoryScoreResult['recommendations'] = [];
  const rulesTriggered: CategoryScoreResult['rulesTriggered'] = {};

  const populatedSections = countPopulatedSections(input.contentJson);

  score += populatedSections * 8;

  if (!hasSummary(input.contentJson)) {
    rulesTriggered.missing_summary_section = true;
    issues.push({
      code: 'missing_summary_section',
      severity: 'medium',
      message: 'Resume does not contain a summary section.',
      targetSection: 'summary',
      suggestedAction: 'Add a short summary that positions your experience clearly.',
    });
  }

  if (!hasSkills(input.contentJson)) {
    rulesTriggered.missing_skills_section = true;
    issues.push({
      code: 'missing_skills_section',
      severity: 'high',
      message: 'Resume does not contain a clear skills section.',
      targetSection: 'skills',
      suggestedAction: 'Add a dedicated skills section with role-relevant capabilities.',
    });
  }

  if (!hasExperience(input.contentJson)) {
    rulesTriggered.missing_experience_section = true;
    issues.push({
      code: 'missing_experience_section',
      severity: 'high',
      message: 'Resume does not contain a clear experience section.',
      targetSection: 'experience',
      suggestedAction: 'Add work experience entries with bullet points and role details.',
    });
  }

  if (!hasEducation(input.contentJson)) {
    rulesTriggered.missing_education_section = true;
    issues.push({
      code: 'missing_education_section',
      severity: 'medium',
      message: 'Resume does not contain a clear education section.',
      targetSection: 'education',
      suggestedAction: 'Add education details, even if brief.',
    });
  }

  recommendations.push({
    code: 'complete_core_sections',
    priority: 'high',
    title: 'Complete core resume sections',
    description: 'Make sure your resume includes summary, skills, experience, and education.',
    targetSection: 'basics',
  });

  return {
    category: 'sectionCompleteness',
    score: clampScore(score),
    issues,
    recommendations,
    rulesTriggered,
  };
}


/**
 * ---------------------------------------------------------
 * TONE / SENIORITY FIT SCORER
 * ---------------------------------------------------------
 *
 * V1 heuristic:
 * - rewards presence of headline + summary
 * - rewards stronger experience evidence
 * - penalizes weak substance paired with empty positioning
 *
 * This is intentionally lightweight until later AI-assisted
 * interpretation is added.
 */
export function scoreToneSeniorityFit(
  input: ResumeScoringInput,
): CategoryScoreResult {
  let score = 50;

  const issues: CategoryScoreResult['issues'] = [];
  const recommendations: CategoryScoreResult['recommendations'] = [];
  const rulesTriggered: CategoryScoreResult['rulesTriggered'] = {};

  const bulletCount = countExperienceBullets(input.contentJson);
  const bulletsWithMetrics = countBulletsWithMetrics(input.contentJson);

  if (hasHeadline(input.contentJson)) {
    score += 10;
  } else {
    rulesTriggered.missing_headline = true;
    score -= 8;
    issues.push({
      code: 'missing_headline',
      severity: 'low',
      message: 'Resume is missing a headline that clarifies professional positioning.',
      targetSection: 'basics',
      suggestedAction: 'Add a short headline that reflects your professional identity.',
    });
  }

  if (hasSummary(input.contentJson)) {
    score += 10;
  } else {
    rulesTriggered.missing_summary = true;
    score -= 10;
    issues.push({
      code: 'missing_summary',
      severity: 'medium',
      message: 'Resume is missing a summary that frames your experience level.',
      targetSection: 'summary',
      suggestedAction: 'Add a summary that matches your level and strengths.',
    });
  }

  if (bulletCount >= 4) {
    score += 8;
  }

  if (bulletsWithMetrics >= 2) {
    score += 10;
  } else if (bulletCount > 0 && bulletsWithMetrics === 0) {
    rulesTriggered.low_evidence_of_impact = true;
    score -= 12;
    issues.push({
      code: 'low_evidence_of_impact',
      severity: 'medium',
      message: 'Resume positioning is not strongly supported by measurable evidence.',
      targetSection: 'experience',
      suggestedAction: 'Support your professional claims with stronger impact-oriented bullets.',
    });
  }

  recommendations.push({
    code: 'improve_professional_positioning',
    priority: 'medium',
    title: 'Improve professional positioning',
    description: 'Align your headline, summary, and experience evidence so they tell a believable professional story.',
    targetSection: 'summary',
  });

  return {
    category: 'toneSeniorityFit',
    score: clampScore(score),
    issues,
    recommendations,
    rulesTriggered,
  };
}