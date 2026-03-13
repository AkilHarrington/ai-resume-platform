interface ResumePreviewCardProps {
  title: string
  subtitle?: string
  content: string
  accent?: 'default' | 'success'
  highlightKeywords?: string[]
  highlightLabel?: string
  highlightStyle?: 'matched' | 'resolved'
}

function formatResumeText(content: string) {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getHighlightStyles(style: 'matched' | 'resolved') {
  if (style === 'resolved') {
    return {
      background: '#dcfce7',
      color: '#166534',
    }
  }

  return {
    background: '#fef3c7',
    color: '#92400e',
  }
}

function renderHighlightedText(
  text: string,
  keywords: string[],
  highlightStyle: 'matched' | 'resolved',
) {
  if (!keywords.length) {
    return text
  }

  const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length)
  const pattern = sortedKeywords.map(escapeRegExp).join('|')

  if (!pattern) {
    return text
  }

  const regex = new RegExp(`(${pattern})`, 'gi')
  const parts = text.split(regex)
  const styles = getHighlightStyles(highlightStyle)

  return parts.map((part, index) => {
    const isMatch = sortedKeywords.some((keyword) => keyword.toLowerCase() === part.toLowerCase())

    if (!isMatch) {
      return <span key={`${part}-${index}`}>{part}</span>
    }

    return (
      <mark
        key={`${part}-${index}`}
        style={{
          background: styles.background,
          color: styles.color,
          padding: '0.08em 0.22em',
          borderRadius: '6px',
          fontWeight: 700,
        }}
      >
        {part}
      </mark>
    )
  })
}

function isSectionHeading(line: string) {
  return ['summary', 'skills', 'experience', 'education', 'certifications'].includes(
    line.toLowerCase(),
  )
}

function isBullet(line: string) {
  return line.startsWith('•') || line.startsWith('-')
}

export function ResumePreviewCard({
  title,
  subtitle,
  content,
  accent = 'default',
  highlightKeywords = [],
  highlightLabel,
  highlightStyle = 'matched',
}: ResumePreviewCardProps) {
  const lines = formatResumeText(content)

  const styles =
    accent === 'success'
      ? {
          border: '1px solid #bfdbfe',
          background: '#f8fbff',
          titleColor: '#1e3a8a',
          badgeBg: '#dbeafe',
          badgeColor: '#1d4ed8',
        }
      : {
          border: '1px solid #e5e7eb',
          background: '#ffffff',
          titleColor: '#111827',
          badgeBg: '#f3f4f6',
          badgeColor: '#374151',
        }

  const name = lines[0] ?? ''
  const possibleTitle = lines[1] ?? ''
  const bodyLines = lines.slice(2)

  return (
    <div
      style={{
        borderRadius: '18px',
        border: styles.border,
        background: styles.background,
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(17, 24, 39, 0.06)',
      }}
    >
      <div
        style={{
          padding: '16px 18px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h3 style={{ margin: 0, color: styles.titleColor, fontSize: '1.05rem' }}>{title}</h3>
          {subtitle ? (
            <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.92rem' }}>{subtitle}</p>
          ) : null}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {highlightKeywords.length > 0 && highlightLabel ? (
            <span
              style={{
                padding: '7px 10px',
                borderRadius: '999px',
                background: highlightStyle === 'resolved' ? '#dcfce7' : '#fffbeb',
                color: highlightStyle === 'resolved' ? '#166534' : '#92400e',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              {highlightLabel}
            </span>
          ) : null}

          <span
            style={{
              padding: '7px 10px',
              borderRadius: '999px',
              background: styles.badgeBg,
              color: styles.badgeColor,
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            Preview
          </span>
        </div>
      </div>

      <div
        style={{
          padding: '32px',
          minHeight: '460px',
          background: '#ffffff',
        }}
      >
        {lines.length === 0 ? (
          <p style={{ margin: 0, color: '#9ca3af' }}>No resume content available yet.</p>
        ) : (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  color: '#111827',
                  letterSpacing: '-0.02em',
                }}
              >
                {renderHighlightedText(name, highlightKeywords, highlightStyle)}
              </h1>

              {possibleTitle ? (
                <p
                  style={{
                    margin: '6px 0 0',
                    fontSize: '1rem',
                    color: '#4b5563',
                    fontWeight: 600,
                  }}
                >
                  {renderHighlightedText(possibleTitle, highlightKeywords, highlightStyle)}
                </p>
              ) : null}
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              {bodyLines.map((line, index) => {
                if (isSectionHeading(line)) {
                  return (
                    <div
                      key={`${line}-${index}`}
                      style={{
                        marginTop: '14px',
                        paddingTop: '12px',
                        borderTop: '1px solid #e5e7eb',
                      }}
                    >
                      <h2
                        style={{
                          margin: 0,
                          fontSize: '0.9rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: '#111827',
                          fontWeight: 800,
                        }}
                      >
                        {renderHighlightedText(line, highlightKeywords, highlightStyle)}
                      </h2>
                    </div>
                  )
                }

                if (isBullet(line)) {
                  return (
                    <div
                      key={`${line}-${index}`}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'flex-start',
                      }}
                    >
                      <span style={{ color: '#6b7280', lineHeight: 1.7 }}>•</span>
                      <p
                        style={{
                          margin: 0,
                          color: '#1f2937',
                          fontSize: '0.97rem',
                          lineHeight: 1.7,
                        }}
                      >
                        {renderHighlightedText(
                          line.replace(/^[•-]\s*/, ''),
                          highlightKeywords,
                          highlightStyle,
                        )}
                      </p>
                    </div>
                  )
                }

                return (
                  <p
                    key={`${line}-${index}`}
                    style={{
                      margin: 0,
                      color: '#1f2937',
                      fontSize: '0.98rem',
                      lineHeight: 1.75,
                    }}
                  >
                    {renderHighlightedText(line, highlightKeywords, highlightStyle)}
                  </p>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}