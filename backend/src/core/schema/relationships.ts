/**
 * =========================================================
 * SCHEMA RELATIONSHIPS
 * =========================================================
 *
 * This file documents the canonical relationships between
 * the core entities in the platform.
 *
 * IMPORTANT:
 *
 * This file is primarily for clarity, onboarding, and
 * architectural consistency.
 *
 * It does not enforce database constraints by itself.
 * Database relationships will be implemented later in the
 * persistence layer.
 *
 * =========================================================
 */


/**
 * ---------------------------------------------------------
 * HUMAN-READABLE RELATIONSHIP MAP
 * ---------------------------------------------------------
 *
 * This is the official relationship map for Chunk 1.
 */
export const SCHEMA_RELATIONSHIPS = {
  userToResume: 'User 1:N Resume',
  resumeToResumeVersion: 'Resume 1:N ResumeVersion',
  userToJobDescription: 'User 1:N JobDescription',
  resumeVersionToResumeScan: 'ResumeVersion 1:N ResumeScan',
  resumeVersionToMatchAnalysis: 'ResumeVersion 1:N MatchAnalysis',
  jobDescriptionToMatchAnalysis: 'JobDescription 1:N MatchAnalysis',
  resumeToCareerSuggestion: 'Resume 1:N CareerSuggestion',
  resumeVersionToInterviewPrep: 'ResumeVersion 1:N InterviewPrep',
  userToApplication: 'User 1:N Application',
  applicationToJobDescription: 'Application N:1 JobDescription (optional)',
  applicationToResumeVersion: 'Application N:1 ResumeVersion (optional)',
} as const;


/**
 * ---------------------------------------------------------
 * RELATIONSHIP LIST
 * ---------------------------------------------------------
 *
 * This is useful if the UI or docs later need an iterable
 * structure instead of an object map.
 */
export const SCHEMA_RELATIONSHIP_LIST = [
  'User 1:N Resume',
  'Resume 1:N ResumeVersion',
  'User 1:N JobDescription',
  'ResumeVersion 1:N ResumeScan',
  'ResumeVersion 1:N MatchAnalysis',
  'JobDescription 1:N MatchAnalysis',
  'Resume 1:N CareerSuggestion',
  'ResumeVersion 1:N InterviewPrep',
  'User 1:N Application',
  'Application N:1 JobDescription (optional)',
  'Application N:1 ResumeVersion (optional)',
] as const;