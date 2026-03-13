import { API_BASE_URL } from '../../../api/config'
import { apiPost } from '../../../api/http'
import type {
  ResumeOptimizeRequest,
  ResumeOptimizeResponse,
} from '../types/resumeOptimize.types'

export async function optimizeResume(
  payload: ResumeOptimizeRequest,
): Promise<ResumeOptimizeResponse> {
  return apiPost<ResumeOptimizeResponse, ResumeOptimizeRequest>(
    `${API_BASE_URL}/api/resume/optimize`,
    payload,
  )
}