/**
 * =========================================================
 * SAMPLE PAYLOADS
 * =========================================================
 *
 * This file provides example objects for the core schema.
 *
 * These samples are useful for:
 * - onboarding
 * - testing
 * - mock APIs
 * - validating schema shape
 *
 * IMPORTANT:
 *
 * These are examples only.
 * They are not production fixtures.
 *
 * =========================================================
 */

import type { Resume } from './entities/resume';
import type { ResumeVersion } from './entities/resume-version';
import type { JobDescription } from './entities/job-description';
import type { ResumeScan } from './entities/resume-scan';
import type { MatchAnalysis } from './entities/match-analysis';
import type { CareerSuggestion } from './entities/career-suggestion';
import type { InterviewPrep } from './entities/interview-prep';
import type { Application } from './entities/application';


/**
 * ---------------------------------------------------------
 * SAMPLE RESUME
 * ---------------------------------------------------------
 */
export const sampleResume: Resume = {
  id: 'res_001',
  userId: 'usr_001',
  sourceType: 'pdf',
  originalFileName: 'akil_resume.pdf',
  originalFileUrl: 'https://storage.example.com/resumes/akil_resume.pdf',
  rawText: 'AKIL HARRINGTON\nOperations Specialist...\n',
  detectedLanguage: 'en',
  parsingStatus: 'completed',
  latestVersionId: 'rv_002',
  activeTemplate: 'professional',
  notes: null,
  createdAt: '2026-03-10T12:00:00Z',
  updatedAt: '2026-03-10T12:05:00Z',
};


/**
 * ---------------------------------------------------------
 * SAMPLE RESUME VERSION
 * ---------------------------------------------------------
 */
export const sampleResumeVersion: ResumeVersion = {
  id: 'rv_001',
  resumeId: 'res_001',
  versionType: 'original',
  contentJson: {
    basics: {
      fullName: 'Akil Harrington',
      email: 'akil@example.com',
      phone: '+1-868-000-0000',
      location: 'San Fernando, Trinidad and Tobago',
      linkedin: 'linkedin.com/in/akilharrington',
      portfolio: '',
    },
    headline: 'Operations Specialist',
    summary:
      'Operations professional with experience in reservations and workforce support.',
    skills: {
      core: ['Operations', 'Customer Service'],
      technical: ['Excel'],
      tools: ['Microsoft Office'],
      soft: ['Communication', 'Problem Solving'],
    },
    experience: [
      {
        company: 'American Airlines',
        title: 'Reservations Operations Specialist',
        location: 'Trinidad and Tobago',
        startDate: '2021-01',
        endDate: '',
        isCurrent: true,
        bullets: [
          'Managed workforce equipment and setup for new hires.',
          'Monitored calls and chat queues.',
        ],
      },
    ],
    education: [],
    certifications: [],
    projects: [],
  },
  htmlPreview: null,
  pdfUrl: null,
  templateId: 'professional',
  scoreSnapshot: {
    overall: 61,
    atsCompatibility: 68,
    keywordMatch: 54,
    bulletStrength: 49,
    formatting: 74,
    sectionCompleteness: 63,
    roleAlignment: 58,
    toneSeniorityFit: 70,
  },
  changeSummary: null,
  sourceVersionId: null,
  isActive: true,
  toneProfile: {
    voice: 'professional',
    seniority: 'mid',
  },
  generationMetadata: null,
  processingStatus: 'completed',
  processingError: null,
  createdAt: '2026-03-10T12:05:00Z',
  updatedAt: '2026-03-10T12:05:00Z',
};


/**
 * ---------------------------------------------------------
 * SAMPLE JOB DESCRIPTION
 * ---------------------------------------------------------
 */
export const sampleJobDescription: JobDescription = {
  id: 'jd_001',
  userId: 'usr_001',
  sourceType: 'paste',
  rawText:
    'We are seeking an Operations Coordinator with experience in scheduling, reporting, and stakeholder communication...',
  jobTitle: 'Operations Coordinator',
  companyName: 'Example Corp',
  parsedJson: {
    jobTitle: 'Operations Coordinator',
    companyName: 'Example Corp',
    industry: 'Airline Operations',
    seniorityLevel: 'mid',
    employmentType: 'full_time',
    location: 'Trinidad and Tobago',
    mustHaveSkills: ['Scheduling', 'Reporting', 'Stakeholder Communication'],
    niceToHaveSkills: ['Power BI', 'Data Analysis'],
    responsibilities: [
      'Coordinate operational workflows',
      'Monitor reporting accuracy',
    ],
    keywords: [
      'operations',
      'scheduling',
      'reporting',
      'stakeholder communication',
      'data analysis',
    ],
    qualifications: ['2+ years experience', 'Strong communication skills'],
  },
  industry: 'Airline Operations',
  seniorityLevel: 'mid',
  location: 'Trinidad and Tobago',
  employmentType: 'full_time',
  status: 'processed',
  createdAt: '2026-03-10T12:10:00Z',
  updatedAt: '2026-03-10T12:10:00Z',
};


/**
 * ---------------------------------------------------------
 * SAMPLE RESUME SCAN
 * ---------------------------------------------------------
 */
export const sampleResumeScan: ResumeScan = {
  id: 'scan_001',
  resumeId: 'res_001',
  resumeVersionId: 'rv_001',
  scanType: 'general_scan',
  overallScore: 61,
  jobDescriptionId: null,
  atsScore: 68,
  keywordScore: 54,
  bulletScore: 49,
  formatScore: 74,
  sectionCompletenessScore: 63,
  toneFitScore: 70,
  issues: [
    {
      code: 'missing_metrics_in_bullets',
      severity: 'high',
      message: 'Experience bullets lack measurable outcomes.',
      targetSection: 'experience',
      suggestedAction: 'Add numbers, percentages, or scope where possible.',
    },
    {
      code: 'missing_target_keywords',
      severity: 'medium',
      message: 'Resume contains limited role-specific keyword coverage.',
      targetSection: 'summary',
      suggestedAction: 'Add stronger role-aligned language and keywords.',
    },
  ],
  recommendations: [
    {
      code: 'strengthen_bullets',
      priority: 'high',
      title: 'Strengthen experience bullets',
      description: 'Rewrite bullets to include measurable outcomes and impact.',
      targetSection: 'experience',
    },
    {
      code: 'improve_summary_positioning',
      priority: 'medium',
      title: 'Improve summary positioning',
      description: 'Align summary more closely with the target role.',
      targetSection: 'summary',
    },
  ],
  rulesTriggered: {
    missing_metrics_in_bullets: true,
    missing_target_keywords: true,
  },
  aiInsights: {
    summary:
      'Resume is structurally usable but lacks stronger evidence of impact.',
  },
  createdAt: '2026-03-10T12:15:00Z',
};


/**
 * ---------------------------------------------------------
 * SAMPLE MATCH ANALYSIS
 * ---------------------------------------------------------
 */
export const sampleMatchAnalysis: MatchAnalysis = {
  id: 'match_001',
  resumeVersionId: 'rv_001',
  jobDescriptionId: 'jd_001',
  matchScore: 72,
  matchedKeywords: ['operations', 'reporting'],
  missingKeywords: [
    'stakeholder communication',
    'data analysis',
    'power bi',
  ],
  matchedSkills: ['Scheduling', 'Reporting'],
  missingSkills: ['Power BI', 'Data Analysis'],
  strengths: {
    roleFit: ['operations support', 'queue monitoring'],
  },
  gaps: {
    skills: ['Power BI', 'metrics-driven bullet points'],
  },
  recommendations: [
    {
      code: 'add_stakeholder_communication',
      priority: 'high',
      title: 'Add stakeholder communication language',
      description:
        'Include specific examples of stakeholder communication in experience bullets.',
      targetSection: 'experience',
    },
    {
      code: 'quantify_operational_impact',
      priority: 'high',
      title: 'Quantify operational impact',
      description:
        'Add numbers or measurable outcomes to highlight operational effectiveness.',
      targetSection: 'experience',
    },
  ],
  weightedCriteria: {
    mustHaveSkillsWeight: 0.5,
    experienceWeight: 0.3,
    keywordWeight: 0.2,
  },
  createdAt: '2026-03-10T12:20:00Z',
};


/**
 * ---------------------------------------------------------
 * SAMPLE CAREER SUGGESTION
 * ---------------------------------------------------------
 */
export const sampleCareerSuggestion: CareerSuggestion = {
  id: 'cs_001',
  resumeId: 'res_001',
  recommendedRoles: [
    'Operations Coordinator',
    'Workforce Analyst',
    'Customer Support Operations Specialist',
  ],
  transferableSkills: [
    'Scheduling',
    'Queue Monitoring',
    'Operational Support',
  ],
  skillGaps: [
    'Advanced analytics tooling',
    'More quantified achievements',
  ],
  confidenceScore: 79,
  reasoningSummary:
    'Strong operational background with transferable coordination and support experience.',
  createdAt: '2026-03-10T12:25:00Z',
};


/**
 * ---------------------------------------------------------
 * SAMPLE INTERVIEW PREP
 * ---------------------------------------------------------
 */
export const sampleInterviewPrep: InterviewPrep = {
  id: 'ip_001',
  resumeVersionId: 'rv_002',
  jobDescriptionId: 'jd_001',
  questions: [
    'Tell me about a time you coordinated multiple operational priorities.',
    'How do you communicate with stakeholders during high-volume periods?',
  ],
  storyPrompts: [
    'Describe a time you improved efficiency.',
    'Explain how you handled conflicting priorities.',
  ],
  focusAreas: [
    'Quantify achievements',
    'Prepare examples of communication under pressure',
  ],
  prepSummary:
    'Focus on operational coordination, reporting accuracy, and stakeholder communication examples.',
  createdAt: '2026-03-10T12:30:00Z',
};


/**
 * ---------------------------------------------------------
 * SAMPLE APPLICATION
 * ---------------------------------------------------------
 */
export const sampleApplication: Application = {
  id: 'app_001',
  userId: 'usr_001',
  companyName: 'Example Corp',
  roleTitle: 'Operations Coordinator',
  status: 'applied',
  jobDescriptionId: 'jd_001',
  resumeVersionId: 'rv_002',
  appliedAt: '2026-03-10T13:00:00Z',
  notes: 'Applied through company portal.',
  nextActionAt: '2026-03-17T13:00:00Z',
  interviewDate: null,
  outcome: 'none',
  createdAt: '2026-03-10T13:00:00Z',
  updatedAt: '2026-03-10T13:00:00Z',
};