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
  missingKeywordsBefore: string[]
  missingKeywordsAfter: string[]
}