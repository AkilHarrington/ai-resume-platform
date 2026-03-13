import { http } from '../../../api/http'
import type {
  ResumeOptimizeRequest,
  ResumeOptimizeResponse,
} from '../types/resumeOptimize.types'

export function optimizeResume(payload: ResumeOptimizeRequest) {
  return http<ResumeOptimizeResponse>('/api/resume/optimize', {
    method: 'POST',
    body: payload,
  })
}