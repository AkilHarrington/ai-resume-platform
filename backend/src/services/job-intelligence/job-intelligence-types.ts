// =====================================================
// JOB INTELLIGENCE TYPES
// =====================================================

export interface JobKeywordExtractionResult {
  keywords: string[]
}

export interface ResumeKeywordMatchResult {
  matchedKeywords: string[]
  missingKeywords: string[]
  matchScore: number
}

export interface JobIntelligenceResult {
  extractedKeywords: string[]
  matchedKeywords: string[]
  missingKeywords: string[]
  matchScore: number
}

export interface JobIntelligenceInput {
  jobDescription: string
  resumeText: string
}