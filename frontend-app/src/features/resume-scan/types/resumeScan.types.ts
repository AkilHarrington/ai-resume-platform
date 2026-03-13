export interface ResumeScanIssue {
  id: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high'
}

export interface ResumeScanCategoryScore {
  name: string
  score: number
  feedback: string[]
}

export interface ParsedResumeContact {
  email?: string
  phone?: string
  location?: string
  linkedin?: string
  portfolio?: string
}

export interface ParsedResumeExperienceItem {
  company: string
  title: string
  description: string[]
}

export interface ParsedResume {
  full_name: string
  email: string
  phone: string
  location: string
  professional_summary: string
  skills: string[]
  professional_experience: ParsedResumeExperienceItem[]
  education: string[]
  certifications: string[]
}

export interface ResumeScanRequest {
  resumeText: string
  jobDescription?: string
}

export interface ResumeScanResponse {
  overallScore: number
  summary: string
  previewText: string
  parsedResume?: ParsedResume
  matchedKeywords: string[]
  missingKeywords: string[]
  categoryScores: ResumeScanCategoryScore[]
  issues: ResumeScanIssue[]
  recommendations: string[]
}