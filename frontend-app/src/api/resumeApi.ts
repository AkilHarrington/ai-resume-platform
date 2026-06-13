import axios from 'axios'
import { API_BASE_URL } from './config'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60s — Claude calls can take 15-25s on complex resumes
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return Promise.reject(
        new Error('Request timed out. Claude is processing — please try again.')
      )
    }
    return Promise.reject(error)
  }
)

export interface CategoryScore {
  name: string
  score: number
  max?: number
  weight?: string
  reasoning?: string   // semantic scorer
  feedback?: string[]  // rule-based scorer fallback
}

export interface ScanResult {
  overallScore: number
  matchedKeywords: string[]
  missingKeywords: string[]
  categoryScores: CategoryScore[]
  strengths: string[]
  gaps: string[]
  recruiterVerdict: string
  semantic: boolean
  matchIntelligence: {
    roleFit?: { score: number; summary: string }
    strengthSignals?: { label: string; score: number; evidence: string[] }[]
    opportunitySignals?: { label: string; score: number }[]
    recruiterRiskSignals?: { label: string; severity: string; explanation: string }[]
  }
  parsedResume: Record<string, unknown>
  issues: { id: string; title: string; description: string; severity: string }[]
  recommendations: string[]
}

export interface OptimizeResult {
  originalScore: number
  optimizedScore: number
  scoreImprovement: number
  originalResumeText: string
  optimizedResumeText: string
  missingKeywordsBefore: string[]
  missingKeywordsAfter: string[]
  matchIntelligence: Record<string, unknown>
  optimizationGuidance: { title: string; reasons: string[]; suggestionsTitle: string; suggestions: string[] } | null
}

export interface UploadResult {
  resumeText: string
  parsedResume: Record<string, unknown>
}

export async function uploadResume(file: File): Promise<UploadResult> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<UploadResult>('/api/resume/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function scanResume(resumeText: string, jobDescription?: string): Promise<ScanResult> {
  const { data } = await api.post<ScanResult>('/api/resume/scan', { resumeText, jobDescription })
  return data
}

export async function optimizeResume(resumeText: string, jobDescription?: string): Promise<OptimizeResult> {
  const { data } = await api.post<OptimizeResult>('/api/resume/optimize', { resumeText, jobDescription })
  return data
}

export async function generateCoverLetter(params: {
  resumeText: string
  jobDescription?: string
  companyName?: string
  candidateName?: string
}): Promise<{ coverLetter: string }> {
  const { data } = await api.post<{ coverLetter: string }>('/api/cover-letter/generate', params)
  return data
}

export async function optimizeLinkedIn(params: {
  resumeText: string
  jobDescription?: string
  targetRole?: string
}): Promise<{ headline: string; summary: string }> {
  const { data } = await api.post<{ headline: string; summary: string }>('/api/linkedin/optimize', params)
  return data
}

export async function createCheckoutSession(plan: 'monthly' | 'onetime'): Promise<{ url: string }> {
  const { data } = await api.post<{ url: string }>(`/api/payments/create-checkout-session?plan=${plan}`)
  return data
}

export async function getProStatus(): Promise<{ isPro: boolean }> {
  const { data } = await api.get<{ isPro: boolean }>('/api/user/pro-status')
  return data
}
