/**
 * =========================================================
 * JOB DESCRIPTION STRUCTURE
 * =========================================================
 *
 * This file defines the structured representation of a
 * parsed job description.
 *
 * When a user pastes or imports a job posting, the system
 * converts the raw text into this structure.
 *
 * This allows the platform to:
 *
 * - compute resume match scores
 * - detect missing keywords
 * - generate tailored resumes
 * - create interview preparation questions
 *
 * =========================================================
 */

import { SeniorityLevel, EmploymentType } from './enums';


/**
 * ---------------------------------------------------------
 * STRUCTURED JOB DESCRIPTION
 * ---------------------------------------------------------
 */
export interface JobDescriptionParsedJson {

  jobTitle: string;

  companyName: string;

  industry: string;

  seniorityLevel: SeniorityLevel | '';

  employmentType: EmploymentType | '';

  location: string;

  mustHaveSkills: string[];

  niceToHaveSkills: string[];

  responsibilities: string[];

  keywords: string[];

  qualifications: string[];

}