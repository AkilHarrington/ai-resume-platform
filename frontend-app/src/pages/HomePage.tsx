import { useState } from 'react'
import { ResumeOptimizeSection } from '../features/resume-optimize/components/ResumeOptimizeSection'
import { ResumeScanSection } from '../features/resume-scan/components/ResumeScanSection'
import type { ResumeScanRequest } from '../features/resume-scan/types/resumeScan.types'

export function HomePage() {
  const [optimizeSeed, setOptimizeSeed] = useState<ResumeScanRequest | null>(null)
  const [isOptimizingFromScan, setIsOptimizingFromScan] = useState(false)

  function handleOptimizeRequested(values: ResumeScanRequest) {
    setOptimizeSeed(values)
    setIsOptimizingFromScan(true)
  }

  function handleOptimizeComplete() {
    setIsOptimizingFromScan(false)
  }

  return (
    <main>
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
        }}
      >
        <section
          style={{
            marginBottom: '24px',
            padding: '28px',
            borderRadius: '20px',
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            boxShadow: '0 8px 24px rgba(17, 24, 39, 0.06)',
          }}
        >
          <h1 style={{ marginBottom: '12px', fontSize: '2.25rem' }}>AI Resume Platform</h1>
          <p style={{ marginBottom: '16px', color: '#4b5563', fontSize: '1rem' }}>
            Scan resumes against job descriptions, surface keyword gaps, and compare before vs after
            ATS improvement.
          </p>

          <div
            style={{
              display: 'inline-flex',
              padding: '8px 12px',
              borderRadius: '999px',
              background: '#eef2ff',
              color: '#3730a3',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
          >
            Resume Scan + Optimization MVP is live
          </div>
        </section>

        <ResumeScanSection
          onOptimizeRequested={handleOptimizeRequested}
          isOptimizingFromScan={isOptimizingFromScan}
        />

        <ResumeOptimizeSection
          seedValues={optimizeSeed}
          autoRun={isOptimizingFromScan}
          onAutoRunComplete={handleOptimizeComplete}
        />
      </div>
    </main>
  )
}