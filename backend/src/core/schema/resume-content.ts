/**
 * =========================================================
 * RESUME CONTENT STRUCTURE
 * =========================================================
 *
 * This file defines the canonical structure used for
 * storing resume content inside the system.
 *
 * IMPORTANT:
 *
 * AI-generated resumes must always produce this structure.
 *
 * We never store resume content as unstructured text once
 * it has been parsed or generated.
 *
 * This structure enables:
 *
 * - consistent rendering
 * - template switching
 * - scoring analysis
 * - keyword detection
 * - AI optimization
 *
 * =========================================================
 */


/**
 * ---------------------------------------------------------
 * BASIC CONTACT INFORMATION
 * ---------------------------------------------------------
 */
export interface ResumeBasics {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  portfolio: string;
}


/**
 * ---------------------------------------------------------
 * SKILL CATEGORIES
 * ---------------------------------------------------------
 *
 * Skills are categorized to allow better analysis and
 * better rendering across templates.
 */
export interface ResumeSkills {
  core: string[];
  technical: string[];
  tools: string[];
  soft: string[];
}


/**
 * ---------------------------------------------------------
 * EXPERIENCE ENTRY
 * ---------------------------------------------------------
 *
 * Represents a single role within a user's work history.
 */
export interface ResumeExperienceItem {
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  bullets: string[];
}


/**
 * ---------------------------------------------------------
 * EDUCATION ENTRY
 * ---------------------------------------------------------
 */
export interface ResumeEducationItem {
  institution: string;
  credential: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
}


/**
 * ---------------------------------------------------------
 * CERTIFICATION ENTRY
 * ---------------------------------------------------------
 */
export interface ResumeCertificationItem {
  name: string;
  issuer: string;
  date: string;
}


/**
 * ---------------------------------------------------------
 * PROJECT ENTRY
 * ---------------------------------------------------------
 *
 * Useful for:
 * - software engineers
 * - portfolio based careers
 */
export interface ResumeProjectItem {
  name: string;
  description: string;
  technologies: string[];
  link: string;
}


/**
 * ---------------------------------------------------------
 * CANONICAL RESUME STRUCTURE
 * ---------------------------------------------------------
 *
 * This is the master schema for resume content.
 *
 * All resume versions will contain this structure.
 */
export interface ResumeContentJson {
  basics: ResumeBasics;

  headline: string;

  summary: string;

  skills: ResumeSkills;

  experience: ResumeExperienceItem[];

  education: ResumeEducationItem[];

  certifications: ResumeCertificationItem[];

  projects: ResumeProjectItem[];
}