import { API_BASE_URL } from '../../../api/config'
import { apiPost } from '../../../api/http'
import type { ResumeScanRequest, ResumeScanResponse } from '../types/resumeScan.types'

export async function scanResume(
  payload: ResumeScanRequest,
): Promise<ResumeScanResponse> {
  return apiPost<ResumeScanResponse, ResumeScanRequest>(
    `${API_BASE_URL}/api/resume/scan`,
    payload,
  )
}