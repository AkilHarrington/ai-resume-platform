/**
 * =========================================================
 * ENUM DEFINITIONS
 * =========================================================
 *
 * This file defines all shared enum types used across the
 * entire platform schema.
 *
 * These enums act as controlled vocabularies that ensure
 * consistency across:
 *
 * - database models
 * - API responses
 * - AI processing layers
 * - analytics
 * - future integrations
 *
 * IMPORTANT RULES:
 *
 * 1. Do not introduce new enum values casually.
 * 2. Enums must reflect real product states.
 * 3. Adding a new value should always be discussed because
 *    it affects validation logic, UI logic, and analytics.
 *
 * These are implemented as union string types rather than
 * runtime enums to keep them lightweight and flexible.
 *
 * =========================================================
 */


/**
 * ---------------------------------------------------------
 * USER PLAN TYPES
 * ---------------------------------------------------------
 *
 * Defines account subscription tiers.
 *
 * NOTE:
 * Even though the MVP started without authentication,
 * this is defined early to prevent future schema changes.
 */
export type UserPlan =
  | 'free'
  | 'pro'
  | 'premium'
  | 'admin';


/**
 * ---------------------------------------------------------
 * RESUME SOURCE TYPES
 * ---------------------------------------------------------
 *
 * Describes how the resume entered the system.
 *
 * This helps determine:
 * - parsing strategy
 * - file validation rules
 */
export type ResumeSourceType =
  | 'pdf'
  | 'docx'
  | 'txt'
  | 'pasted_text';


/**
 * ---------------------------------------------------------
 * RESUME PARSING STATUS
 * ---------------------------------------------------------
 *
 * Indicates the progress of extracting structured data
 * from the uploaded resume.
 */
export type ParsingStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';


/**
 * ---------------------------------------------------------
 * GENERIC PROCESSING STATUS
 * ---------------------------------------------------------
 *
 * Used for async operations such as:
 * - AI resume optimization
 * - PDF generation
 * - resume analysis
 */
export type ProcessingStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';


/**
 * ---------------------------------------------------------
 * RESUME TEMPLATE TYPES
 * ---------------------------------------------------------
 *
 * Determines which visual template is used when rendering
 * a resume version.
 */
export type TemplateType =
  | 'professional'
  | 'modern'
  | 'executive';


/**
 * ---------------------------------------------------------
 * RESUME VERSION TYPES
 * ---------------------------------------------------------
 *
 * Defines the nature of a particular resume version.
 *
 * Each transformation of a resume becomes a version
 * rather than overwriting the original content.
 */
export type ResumeVersionType =
  | 'original'
  | 'optimized'
  | 'job_tailored'
  | 'role_variant'
  | 'template_variant'
  | 'manual_edit';


/**
 * ---------------------------------------------------------
 * JOB DESCRIPTION INPUT TYPES
 * ---------------------------------------------------------
 *
 * Describes how the job description entered the system.
 */
export type JobDescriptionSourceType =
  | 'paste'
  | 'url'
  | 'manual';


/**
 * ---------------------------------------------------------
 * JOB SENIORITY LEVEL
 * ---------------------------------------------------------
 *
 * Used when classifying job descriptions.
 */
export type SeniorityLevel =
  | 'entry'
  | 'junior'
  | 'mid'
  | 'senior'
  | 'lead'
  | 'manager'
  | 'director'
  | 'executive'
  | 'unknown';


/**
 * ---------------------------------------------------------
 * EMPLOYMENT TYPE
 * ---------------------------------------------------------
 *
 * Represents the contract style for a job role.
 */
export type EmploymentType =
  | 'full_time'
  | 'part_time'
  | 'contract'
  | 'temporary'
  | 'internship'
  | 'freelance'
  | 'unknown';


/**
 * ---------------------------------------------------------
 * JOB DESCRIPTION PROCESSING STATUS
 * ---------------------------------------------------------
 */
export type JobDescriptionStatus =
  | 'pending'
  | 'processed'
  | 'failed';


/**
 * ---------------------------------------------------------
 * RESUME SCAN TYPE
 * ---------------------------------------------------------
 *
 * Defines the context in which a resume scan occurred.
 */
export type ResumeScanType =
  | 'general_scan'
  | 'job_match_scan'
  | 'pre_optimization_scan'
  | 'post_optimization_scan';


/**
 * ---------------------------------------------------------
 * APPLICATION STATUS
 * ---------------------------------------------------------
 *
 * Represents the current stage of a job application.
 */
export type ApplicationStatus =
  | 'saved'
  | 'applied'
  | 'screening'
  | 'interview'
  | 'final_round'
  | 'offer'
  | 'rejected'
  | 'withdrawn';


/**
 * ---------------------------------------------------------
 * APPLICATION OUTCOME
 * ---------------------------------------------------------
 *
 * Represents the final result of a job application.
 */
export type ApplicationOutcome =
  | 'none'
  | 'interviewed'
  | 'offer_received'
  | 'rejected'
  | 'accepted';


/**
 * ---------------------------------------------------------
 * ISSUE SEVERITY LEVEL
 * ---------------------------------------------------------
 *
 * Used in resume analysis results.
 */
export type SeverityLevel =
  | 'low'
  | 'medium'
  | 'high';


/**
 * ---------------------------------------------------------
 * RECOMMENDATION PRIORITY
 * ---------------------------------------------------------
 *
 * Used to rank improvement suggestions.
 */
export type PriorityLevel =
  | 'low'
  | 'medium'
  | 'high';


/**
 * ---------------------------------------------------------
 * CONTENT GENERATION MODE
 * ---------------------------------------------------------
 *
 * Indicates how content was created.
 */
export type GenerationMode =
  | 'ai'
  | 'manual'
  | 'system';