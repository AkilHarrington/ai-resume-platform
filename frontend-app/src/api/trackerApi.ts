import axios from 'axios'
import { supabase } from '../services/supabase'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

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
    if (error.response?.status === 401) return Promise.reject(new Error('Session expired. Please sign in again.'))
    if (error.response?.status === 404) return Promise.reject(new Error('Application not found.'))
    if (error.response?.status === 429) return Promise.reject(new Error('Too many requests. Please wait a moment.'))
    return Promise.reject(error)
  }
)

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JobApplication {
  id: string
  user_id: string
  company: string
  role: string
  status: string
  url: string | null
  applied_date: string | null
  location: string | null
  salary_min: number | null
  salary_max: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface JobApplicationCreate {
  company: string
  role: string
  status?: string
  url?: string
  applied_date?: string
  location?: string
  salary_min?: number | null
  salary_max?: number | null
  notes?: string
}

export interface JobApplicationUpdate {
  company?: string
  role?: string
  status?: string
  url?: string
  applied_date?: string
  location?: string
  salary_min?: number | null
  salary_max?: number | null
  notes?: string
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function getApplications(): Promise<JobApplication[]> {
  const { data } = await api.get<{ applications: JobApplication[] }>('/api/v1/tracker')
  return data.applications
}

export async function createApplication(payload: JobApplicationCreate): Promise<JobApplication> {
  const { data } = await api.post<JobApplication>('/api/v1/tracker', payload)
  return data
}

export async function updateApplication(id: string, payload: JobApplicationUpdate): Promise<JobApplication> {
  const { data } = await api.patch<JobApplication>(`/api/v1/tracker/${id}`, payload)
  return data
}

export async function deleteApplication(id: string): Promise<void> {
  await api.delete(`/api/v1/tracker/${id}`)
}
