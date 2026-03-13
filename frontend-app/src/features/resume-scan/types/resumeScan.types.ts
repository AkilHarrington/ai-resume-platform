export interface ResumeScanRequest {
  resumeText: string
  jobDescription?: string
}

export interface ResumeScanCategoryScore {
  name: string
  score: number
  feedback: string[]
}

export interface ResumeScanIssue {
  id: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high'
}

export interface ResumeScanResponse {
  overallScore: number
  summary: string
  previewText: string
  matchedKeywords: string[]
  missingKeywords: string[]
  categoryScores: ResumeScanCategoryScore[]
  issues: ResumeScanIssue[]
  recommendations: string[]
}