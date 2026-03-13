// =====================================================
// JOB INTELLIGENCE PIPELINE
// =====================================================

import {
  JobIntelligenceInput,
  JobIntelligenceResult
} from "./job-intelligence-types"

import { extractJobKeywords } from "./keyword-extractor"
import { matchResumeKeywords } from "./resume-keyword-matcher"

// =====================================================
// RUN FULL JOB INTELLIGENCE ANALYSIS
// =====================================================

export function runJobIntelligence(
  input: JobIntelligenceInput
): JobIntelligenceResult {

  const { jobDescription, resumeText } = input

  // Step 1: Extract keywords from job description
  const extraction = extractJobKeywords(jobDescription)

  // Step 2: Match resume text against extracted keywords
  const match = matchResumeKeywords(resumeText, extraction.keywords)

  return {
    extractedKeywords: extraction.keywords,
    matchedKeywords: match.matchedKeywords,
    missingKeywords: match.missingKeywords,
    matchScore: match.matchScore
  }
}