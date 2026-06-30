import axios from 'axios'
import { supabase } from '../services/supabase'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60s — Claude calls can take 15-25s on complex resumes
})

// Attach the Supabase JWT to every request automatically
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return Promise.reject(
        new Error('Request timed out. Claude is processing — please try again.')
      )
    }
    if (error.response?.status === 401) {
      return Promise.reject(new Error('Session expired. Please sign in again.'))
    }
    if (error.response?.status === 403) {
      return Promise.reject(new Error('This feature requires a Pro plan.'))
    }
    if (error.response?.status === 429) {
      return Promise.reject(new Error('Too many requests. Please wait a moment and try again.'))
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
  overallScore: number | null
  noJd?: boolean
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
  const { data } = await api.post<UploadResult>('/api/v1/resume/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

// user_id params removed — backend now extracts user from the verified JWT
export async function scanResume(resumeText: string, jobDescription?: string): Promise<ScanResult> {
  const { data } = await api.post<ScanResult>('/api/v1/resume/scan', { resumeText, jobDescription })
  return data
}

export function streamOptimize(
  params: {
    resumeText: string
    jobDescription?: string
    existingScore?: number
    existingKeywords?: string[]
  },
  onStatus: (msg: string) => void,
  onToken: (chunk: string) => void,
  onResult: (result: OptimizeResult) => void,
  onDone: () => void,
  onError: (msg: string) => void,
): Promise<void> {
  return (async () => {
    const { data: { session } } = await supabase.auth.getSession()
    let response: Response
    try {
      response = await fetch(`${API_BASE_URL}/api/v1/resume/optimize/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify(params),
      })
    } catch {
      onError('Could not reach the server. Check your connection and try again.')
      return
    }

    if (!response.ok) {
      const detail = await response.json().catch(() => ({ detail: 'Request failed' }))
      if (response.status === 401) { onError('Session expired. Please sign in again.'); return }
      if (response.status === 403) { onError('This feature requires a Pro plan.'); return }
      if (response.status === 429) { onError('Too many requests. Please wait a moment and try again.'); return }
      onError((detail as { detail?: string }).detail || 'Optimization failed')
      return
    }

    if (!response.body) {
      onError('Server returned a response with no body. Please try again.')
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const payload = line.slice(6)
        try {
          const parsed = JSON.parse(payload) as Record<string, unknown>
          if (parsed['type'] === 'error') { onError((parsed['message'] as string) || 'Optimization failed'); return }
          if (parsed['type'] === 'status') onStatus((parsed['message'] as string) || '')
          if (parsed['type'] === 'token') onToken((parsed['text'] as string) || '')
          if (parsed['type'] === 'result') {
            onResult({
              originalScore:        parsed['originalScore'] as number,
              optimizedScore:       parsed['optimizedScore'] as number,
              scoreImprovement:     parsed['scoreImprovement'] as number,
              originalResumeText:   parsed['originalResumeText'] as string,
              optimizedResumeText:  parsed['optimizedResumeText'] as string,
              missingKeywordsBefore: (parsed['missingKeywordsBefore'] as string[]) ?? [],
              missingKeywordsAfter:  (parsed['missingKeywordsAfter'] as string[]) ?? [],
              matchIntelligence:    (parsed['matchIntelligence'] as Record<string, unknown>) ?? {},
              optimizationGuidance: (parsed['optimizationGuidance'] as OptimizeResult['optimizationGuidance']) ?? null,
            })
          }
          if (parsed['type'] === 'done') { onDone(); return }
        } catch { /* skip malformed lines */ }
      }
    }
    onDone()
  })()
}

export async function generateCoverLetter(params: {
  resumeText: string
  jobDescription?: string
  companyName?: string
  candidateName?: string
}): Promise<{ coverLetter: string }> {
  const { data } = await api.post<{ coverLetter: string }>('/api/v1/cover-letter/generate', params)
  return data
}

export async function optimizeLinkedIn(params: {
  resumeText: string
  jobDescription?: string
  targetRole?: string
}): Promise<{ headline: string; summary: string }> {
  const { data } = await api.post<{ headline: string; summary: string }>('/api/v1/linkedin/optimize', params)
  return data
}

// ─── Shared SSE reader ────────────────────────────────────────────────────────

async function readSSEStream(
  url: string,
  body: Record<string, unknown>,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (msg: string) => void,
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify(body),
    })
  } catch {
    onError('Could not reach the server. Check your connection and try again.')
    return
  }

  if (!response.ok) {
    const detail = await response.json().catch(() => ({ detail: 'Request failed' }))
    if (response.status === 401) { onError('Session expired. Please sign in again.'); return }
    if (response.status === 403) { onError('This feature requires a Pro plan.'); return }
    if (response.status === 429) { onError('Too many requests. Please wait a moment and try again.'); return }
    onError(detail.detail || 'Request failed')
    return
  }

  if (!response.body) {
    onError('Server returned a response with no body. Please try again.')
    return
  }
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const payload = line.slice(6)
      if (payload === '[DONE]') { onDone(); return }
      try {
        const parsed = JSON.parse(payload)
        if (parsed.error) { onError(parsed.error); return }
        if (parsed.chunk) onChunk(parsed.chunk)
      } catch { /* skip malformed lines */ }
    }
  }
  onDone()
}

export function streamCoverLetter(
  params: { resumeText: string; jobDescription?: string; companyName?: string; candidateName?: string },
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (msg: string) => void,
): Promise<void> {
  return readSSEStream('/api/v1/cover-letter/stream', params, onChunk, onDone, onError)
}

export function streamLinkedIn(
  params: { resumeText: string; jobDescription?: string; targetRole?: string },
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (msg: string) => void,
): Promise<void> {
  return readSSEStream('/api/v1/linkedin/stream', params, onChunk, onDone, onError)
}

export async function createCheckoutSession(plan: 'monthly' | 'onetime'): Promise<{ url: string }> {
  const { data } = await api.post<{ url: string }>(`/api/v1/payments/create-checkout-session?plan=${plan}`)
  return data
}

export async function getProStatus(): Promise<{ isPro: boolean }> {
  const { data } = await api.get<{ isPro: boolean }>('/api/v1/user/pro-status')
  return data
}
