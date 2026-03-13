import { useState } from 'react'
import type { ApiError } from '../../../types/api'
import type { ResumeTemplate } from '../../../types/resumeTemplate'
import { scanResume } from '../api/resumeScanApi'
import { ResumeScanForm } from './ResumeScanForm'
import { ResumeScanResult } from './ResumeScanResult'
import type { ResumeScanRequest, ResumeScanResponse } from '../types/resumeScan.types'

interface ResumeScanSectionProps {
  onOptimizeRequested?: (values: ResumeScanRequest) => void
  isOptimizingFromScan?: boolean
  template?: ResumeTemplate
}

function getFriendlyErrorMessage(message: string) {
  if (message.toLowerCase().includes('could not reach the server')) {
    return {
      title: 'Unable to connect',
      body: 'The backend may be stopped or restarting. Confirm the API server is running on port 3000, then try again.',
    }
  }

  if (message.toLowerCase().includes('invalid')) {
    return {
      title: 'Invalid request',
      body: 'The resume or job description could not be processed. Review the text and try again.',
    }
  }

  if (message.toLowerCase().includes('server hit an error')) {
    return {
      title: 'Server error',
      body: 'The scan could not be completed because the server ran into a problem. Please try again in a moment.',
    }
  }

  return {
    title: 'Scan failed',
    body: message || 'Something went wrong while scanning the resume.',
  }
}

export function ResumeScanSection({
  onOptimizeRequested,
  isOptimizingFromScan = false,
  template = 'professional',
}: ResumeScanSectionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [result, setResult] = useState<ResumeScanResponse | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [lastSubmittedValues, setLastSubmittedValues] = useState<ResumeScanRequest | null>(null)

  async function handleScan(values: ResumeScanRequest) {
    setIsLoading(true)
    setError(null)
    setHasSubmitted(true)
    setLastSubmittedValues(values)

    try {
      const response = await scanResume(values)
      setResult(response)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred.'
      setError({ message })
      setResult(null)
    } finally {
      setIsLoading(false)
    }
  }

  function handleOptimizeFromScan() {
    if (!lastSubmittedValues || !onOptimizeRequested) {
      return
    }

    onOptimizeRequested(lastSubmittedValues)
  }

  const friendlyError = error ? getFriendlyErrorMessage(error.message) : null

  return (
    <section
      style={{
        padding: '28px',
        borderRadius: '20px',
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        boxShadow: '0 8px 24px rgba(17, 24, 39, 0.06)',
      }}
    >
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '8px', fontSize: '1.5rem' }}>Resume Scan</h2>
        <p style={{ margin: 0, color: '#4b5563' }}>
          Test resume-to-job-description alignment and surface keyword gaps instantly.
        </p>
      </div>

      <ResumeScanForm onSubmit={handleScan} isLoading={isLoading} />

      {friendlyError && (
        <div
          style={{
            marginTop: '20px',
            padding: '18px',
            borderRadius: '14px',
            border: '1px solid #fecaca',
            background: '#fef2f2',
            color: '#991b1b',
            display: 'grid',
            gap: '8px',
          }}
        >
          <strong>{friendlyError.title}</strong>
          <p style={{ margin: 0 }}>{friendlyError.body}</p>
        </div>
      )}

      {!result && !error && !isLoading && !hasSubmitted && (
        <div
          style={{
            marginTop: '24px',
            padding: '20px',
            borderRadius: '16px',
            background: '#f9fafb',
            border: '1px dashed #d1d5db',
            color: '#6b7280',
          }}
        >
          No scan results yet. Submit a resume to see ATS score, issues, recommendations, and a live preview.
        </div>
      )}

      {result && (
        <ResumeScanResult
          result={result}
          onOptimizeRequested={onOptimizeRequested ? handleOptimizeFromScan : undefined}
          isOptimizing={isOptimizingFromScan}
          template={template}
        />
      )}
    </section>
  )
}