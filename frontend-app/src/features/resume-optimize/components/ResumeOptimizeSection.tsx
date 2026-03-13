import { useEffect, useState } from 'react'
import type { ApiError } from '../../../types/api'
import { optimizeResume } from '../api/resumeOptimizeApi'
import { ResumeOptimizeResult } from './ResumeOptimizeResult'
import type {
  ResumeOptimizeRequest,
  ResumeOptimizeResponse,
} from '../types/resumeOptimize.types'

interface ResumeOptimizeSectionProps {
  seedValues?: ResumeOptimizeRequest | null
  autoRun?: boolean
  onAutoRunComplete?: () => void
}

export function ResumeOptimizeSection({
  seedValues = null,
  autoRun = false,
  onAutoRunComplete,
}: ResumeOptimizeSectionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [result, setResult] = useState<ResumeOptimizeResponse | null>(null)

  async function handleOptimize(values: ResumeOptimizeRequest) {
    setIsLoading(true)
    setError(null)

    try {
      const response = await optimizeResume(values)
      setResult(response)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred.'
      setError({ message })
      setResult(null)
    } finally {
      setIsLoading(false)
      onAutoRunComplete?.()
    }
  }

  useEffect(() => {
    if (autoRun && seedValues) {
      handleOptimize(seedValues)
    }
  }, [autoRun, seedValues])

  if (!seedValues && !result && !isLoading && !error) {
    return null
  }

  return (
    <section
      style={{
        padding: '28px',
        borderRadius: '20px',
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        boxShadow: '0 8px 24px rgba(17, 24, 39, 0.06)',
        marginTop: '24px',
      }}
    >
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '8px', fontSize: '1.5rem' }}>Resume Optimization</h2>
        <p style={{ margin: 0, color: '#4b5563' }}>
          Improved resume version with before vs after ATS comparison.
        </p>
      </div>

      {isLoading && (
        <div
          style={{
            padding: '20px',
            borderRadius: '16px',
            background: '#f9fafb',
            border: '1px dashed #d1d5db',
            color: '#6b7280',
          }}
        >
          Optimizing resume and recalculating ATS score...
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: '20px',
            padding: '16px',
            borderRadius: '14px',
            border: '1px solid #fecaca',
            background: '#fef2f2',
            color: '#991b1b',
          }}
        >
          <strong>Error:</strong> {error.message}
        </div>
      )}

      {result && <ResumeOptimizeResult result={result} />}
    </section>
  )
}