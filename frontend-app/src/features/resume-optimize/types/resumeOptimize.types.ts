import type { ParsedResume } from '../../resume-scan/types/resumeScan.types'

export interface OptimizationGuidance {
  title: string
  reasons: string[]
  suggestionsTitle: string
  suggestions: string[]
}

export interface ResumeOptimizeRequest {
  resumeText: string
  jobDescription?: string
}

export interface ResumeOptimizeResponse {
  originalScore: number
  optimizedScore: number
  scoreImprovement: number
  originalResumeText: string
  optimizedResumeText: string
  originalParsedResume?: ParsedResume
  optimizedParsedResume?: ParsedResume
  missingKeywordsBefore: string[]
  missingKeywordsAfter: string[]
  optimizationGuidance?: OptimizationGuidance | null
}