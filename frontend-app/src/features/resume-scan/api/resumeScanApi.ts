import { http } from '../../../api/http'
import type {
  ResumeScanRequest,
  ResumeScanResponse,
} from '../types/resumeScan.types'

export function scanResume(payload: ResumeScanRequest) {
  return http<ResumeScanResponse>('/api/resume/scan', {
    method: 'POST',
    body: payload,
  })
}