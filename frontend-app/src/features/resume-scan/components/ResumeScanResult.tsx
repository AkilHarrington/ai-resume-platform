import { ResumePreviewCard } from '../../../components/ResumePreviewCard'
import type { ResumeScanIssue, ResumeScanResponse } from '../types/resumeScan.types'

interface ResumeScanResultProps {
  result: ResumeScanResponse
  onOptimizeRequested?: () => void
  isOptimizing?: boolean
}

function getScoreMeta(score: number) {
  if (score >= 80) {
    return {
      label: 'Strong Match',
      background: '#ecfdf5',
      border: '#a7f3d0',
      text: '#065f46',
    }
  }

  if (score >= 60) {
    return {
      label: 'Moderate Match',
      background: '#fffbeb',
      border: '#fde68a',
      text: '#92400e',
    }
  }

  return {
    label: 'Weak Match',
    background: '#fef2f2',
    border: '#fecaca',
    text: '#991b1b',
  }
}

function getSeverityStyles(severity: ResumeScanIssue['severity']) {
  switch (severity) {
    case 'high':
      return {
        background: '#fef2f2',
        color: '#991b1b',
      }
    case 'medium':
      return {
        background: '#fffbeb',
        color: '#92400e',
      }
    default:
      return {
        background: '#eff6ff',
        color: '#1d4ed8',
      }
  }
}

export function ResumeScanResult({
  result,
  onOptimizeRequested,
  isOptimizing = false,
}: ResumeScanResultProps) {
  const scoreMeta = getScoreMeta(result.overallScore)
  const hasKeywordAnalysis =
    result.categoryScores.length > 0 ||
    result.issues.length > 0 ||
    result.recommendations.length > 0

  return (
    <section style={{ marginTop: '32px', display: 'grid', gap: '20px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 280px) 1fr',
          gap: '20px',
        }}
      >
        <div
          style={{
            padding: '24px',
            borderRadius: '18px',
            border: '1px solid #e5e7eb',
            background: '#111827',
            color: '#ffffff',
          }}
        >
          <p style={{ marginBottom: '8px', color: '#d1d5db', fontSize: '0.95rem' }}>Overall Score</p>
          <div style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1 }}>
            {result.overallScore}
          </div>

          <div
            style={{
              display: 'inline-flex',
              marginTop: '14px',
              padding: '8px 12px',
              borderRadius: '999px',
              background: scoreMeta.background,
              border: `1px solid ${scoreMeta.border}`,
              color: scoreMeta.text,
              fontSize: '0.9rem',
              fontWeight: 700,
            }}
          >
            {scoreMeta.label}
          </div>
        </div>

        <div
          style={{
            padding: '24px',
            borderRadius: '18px',
            border: '1px solid #e5e7eb',
            background: '#ffffff',
          }}
        >
          <h3 style={{ marginBottom: '10px' }}>Scan Summary</h3>
          <p style={{ marginBottom: '12px', color: '#374151' }}>{result.summary}</p>

          {!hasKeywordAnalysis && (
            <div
              style={{
                padding: '14px',
                borderRadius: '12px',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                color: '#6b7280',
              }}
            >
              No job-description-specific keyword analysis was available for this scan.
            </div>
          )}
        </div>
      </div>

      <ResumePreviewCard
        title="Resume Preview"
        subtitle="Current version used for ATS analysis"
        content={result.previewText}
        highlightKeywords={result.matchedKeywords}
        highlightLabel="Matched Keywords"
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        {result.categoryScores.length === 0 ? (
          <div
            style={{
              padding: '18px',
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              background: '#ffffff',
            }}
          >
            <h3 style={{ marginBottom: '8px' }}>Category Scores</h3>
            <p style={{ margin: 0, color: '#6b7280' }}>No category scores available.</p>
          </div>
        ) : (
          result.categoryScores.map((category) => (
            <div
              key={category.name}
              style={{
                padding: '18px',
                borderRadius: '16px',
                border: '1px solid #e5e7eb',
                background: '#ffffff',
              }}
            >
              <p style={{ marginBottom: '8px', color: '#6b7280', fontSize: '0.95rem' }}>
                {category.name}
              </p>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '10px' }}>
                {category.score}
              </div>

              <ul style={{ color: '#4b5563' }}>
                {category.feedback.map((item, index) => (
                  <li key={`${category.name}-${index}`} style={{ marginBottom: '6px' }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        <div
          style={{
            padding: '20px',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            background: '#ffffff',
          }}
        >
          <h3 style={{ marginBottom: '14px' }}>Issues</h3>

          {result.issues.length === 0 ? (
            <p style={{ margin: 0, color: '#6b7280' }}>No issues found.</p>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {result.issues.map((issue) => {
                const severityStyles = getSeverityStyles(issue.severity)

                return (
                  <div
                    key={issue.id}
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      background: '#f9fafb',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        marginBottom: '8px',
                      }}
                    >
                      <strong>{issue.title}</strong>

                      <span
                        style={{
                          padding: '6px 10px',
                          borderRadius: '999px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          textTransform: 'capitalize',
                          background: severityStyles.background,
                          color: severityStyles.color,
                        }}
                      >
                        {issue.severity}
                      </span>
                    </div>

                    <div style={{ color: '#4b5563' }}>{issue.description}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div
          style={{
            padding: '20px',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            background: '#ffffff',
          }}
        >
          <h3 style={{ marginBottom: '14px' }}>Recommendations</h3>

          {result.recommendations.length === 0 ? (
            <p style={{ margin: 0, color: '#6b7280' }}>No recommendations available.</p>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {result.recommendations.map((recommendation, index) => (
                <div
                  key={`${recommendation}-${index}`}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#1e3a8a',
                  }}
                >
                  {recommendation}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

{onOptimizeRequested && (
  <div
    style={{
      marginTop: '28px',
      display: 'flex',
      justifyContent: 'center',
    }}
  >
<button
  onClick={onOptimizeRequested}
  disabled={isOptimizing}
  onMouseEnter={(e) => (e.currentTarget.style.background = '#020617')}
  onMouseLeave={(e) => (e.currentTarget.style.background = '#0f172a')}
  style={{
    padding: '16px 28px',
    borderRadius: '999px',
    border: 'none',
    background: '#0f172a',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: isOptimizing ? 'not-allowed' : 'pointer',
    opacity: isOptimizing ? 0.7 : 1,
    boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
  }}
>
      {isOptimizing ? 'Optimizing...' : 'Optimize Resume'}
    </button>
  </div>
)}
    </section>
  )
}