import { ResumePreviewCard } from '../../../components/ResumePreviewCard'
import type { ResumeOptimizeResponse } from '../types/resumeOptimize.types'

interface ResumeOptimizeResultProps {
  result: ResumeOptimizeResponse
}

function getImprovementColor(scoreImprovement: number) {
  if (scoreImprovement > 0) {
    return {
      background: '#ecfdf5',
      border: '#a7f3d0',
      text: '#065f46',
      label: `+${scoreImprovement}`,
      tone: 'Improved',
    }
  }

  if (scoreImprovement < 0) {
    return {
      background: '#fef2f2',
      border: '#fecaca',
      text: '#991b1b',
      label: `${scoreImprovement}`,
      tone: 'Reduced',
    }
  }

  return {
    background: '#f9fafb',
    border: '#e5e7eb',
    text: '#374151',
    label: '0',
    tone: 'No Change',
  }
}

export function ResumeOptimizeResult({ result }: ResumeOptimizeResultProps) {
  const improvementMeta = getImprovementColor(result.scoreImprovement)
  const removedKeywords = result.missingKeywordsBefore.filter(
    (keyword) => !result.missingKeywordsAfter.includes(keyword),
  )

  return (
    <section style={{ marginTop: '32px', display: 'grid', gap: '20px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
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
          <p style={{ marginBottom: '8px', color: '#6b7280' }}>Original Score</p>
          <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{result.originalScore}</div>
        </div>

        <div
          style={{
            padding: '20px',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            background: '#ffffff',
          }}
        >
          <p style={{ marginBottom: '8px', color: '#6b7280' }}>Optimized Score</p>
          <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{result.optimizedScore}</div>
        </div>

        <div
          style={{
            padding: '20px',
            borderRadius: '16px',
            border: `1px solid ${improvementMeta.border}`,
            background: improvementMeta.background,
            color: improvementMeta.text,
          }}
        >
          <p style={{ marginBottom: '8px' }}>Score Improvement</p>
          <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{improvementMeta.label}</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{improvementMeta.tone}</div>
        </div>
      </div>

      <div
        style={{
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          background: '#ffffff',
        }}
      >
        <h3 style={{ marginBottom: '14px' }}>Proof of Improvement</h3>

        {removedKeywords.length === 0 ? (
          <p style={{ margin: 0, color: '#6b7280' }}>
            No missing keywords were removed during this optimization pass.
          </p>
        ) : (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {removedKeywords.map((keyword) => (
              <span
                key={keyword}
                style={{
                  padding: '8px 12px',
                  borderRadius: '999px',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  color: '#065f46',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                }}
              >
                Resolved: {keyword}
              </span>
            ))}
          </div>
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
          <h3 style={{ marginBottom: '14px' }}>Missing Keywords Before</h3>
          {result.missingKeywordsBefore.length === 0 ? (
            <p style={{ margin: 0, color: '#6b7280' }}>No missing keywords before optimization.</p>
          ) : (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {result.missingKeywordsBefore.map((keyword) => (
                <span
                  key={keyword}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '999px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  {keyword}
                </span>
              ))}
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
          <h3 style={{ marginBottom: '14px' }}>Missing Keywords After</h3>
          {result.missingKeywordsAfter.length === 0 ? (
            <p style={{ margin: 0, color: '#065f46' }}>No missing keywords after optimization.</p>
          ) : (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {result.missingKeywordsAfter.map((keyword) => (
                <span
                  key={keyword}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '999px',
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    color: '#92400e',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
        }}
      >
        <ResumePreviewCard
          title="Before Optimization"
          subtitle="Original resume version"
          content={result.originalResumeText}
        />

        <ResumePreviewCard
          title="After Optimization"
          subtitle="Improved resume version"
          content={result.optimizedResumeText}
          accent="success"
          highlightKeywords={removedKeywords}
          highlightLabel="Resolved Keywords"
          highlightStyle="resolved"
        />
      </div>
    </section>
  )
}