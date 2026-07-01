import { useState } from 'react'
import { EmptyState, EmptyCard, IconPerson } from './shared'

// ─── Question parser ──────────────────────────────────────────────────────────

interface Question {
  number: number
  question: string
  category: string
  star: string
}

function parseQuestions(text: string): Question[] {
  if (!text.trim()) return []

  // Split on blank lines between questions
  const blocks = text.split(/\n\n+/).filter(b => b.trim())
  const questions: Question[] = []

  for (const block of blocks) {
    const lines = block.trim().split('\n')
    const questionLine = lines[0]?.trim() || ''
    const starLine = lines.find(l => l.trim().startsWith('STAR:'))?.trim() || ''

    // Match "1. Question text [Category]" — category bracket is optional
    const qMatch = questionLine.match(/^(\d+)\.\s+(.*?)(?:\s+(\[[\w\s-]+\]))?\s*$/)
    if (!qMatch) continue

    const number = parseInt(qMatch[1], 10)
    const questionText = qMatch[2].trim()
    const category = qMatch[3] ? qMatch[3].replace(/[\[\]]/g, '').trim() : ''
    const star = starLine.replace(/^STAR:\s*/, '').trim()

    if (questionText) {
      questions.push({ number, question: questionText, category, star })
    }
  }

  return questions
}

// ─── Category badge colours ───────────────────────────────────────────────────

const CATEGORY_STYLE: Record<string, { bg: string; color: string }> = {
  'Behavioral':    { bg: 'var(--surface-2)',                  color: 'var(--text-secondary)' },
  'Situational':   { bg: 'rgba(26,54,93,0.10)',               color: 'var(--navy)'           },
  'Role-Specific': { bg: 'rgba(26,54,93,0.10)',               color: 'var(--navy)'           },
  'Values':        { bg: 'var(--success-light)',              color: 'var(--success)'        },
}

function categoryStyle(cat: string) {
  return CATEGORY_STYLE[cat] ?? { bg: 'var(--surface-2)', color: 'var(--text-muted)' }
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard({ index }: { index: number }) {
  const delay = index * 0.07
  return (
    <div style={{
      background: 'var(--surface-1)', borderRadius: 'var(--radius)',
      border: '1px solid var(--border)', padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        {/* Number circle */}
        <div style={{
          width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
          background: 'var(--surface-2)',
          animation: `pulse 1.5s ease-in-out ${delay}s infinite`,
        }} />
        {/* Question text placeholder */}
        <div style={{
          height: 13, flex: 1, borderRadius: 4, background: 'var(--surface-2)',
          animation: `pulse 1.5s ease-in-out ${delay + 0.1}s infinite`,
        }} />
        {/* Category badge placeholder */}
        <div style={{
          height: 13, width: 80, flexShrink: 0, borderRadius: 4, background: 'var(--surface-2)',
          animation: `pulse 1.5s ease-in-out ${delay + 0.2}s infinite`,
        }} />
      </div>
      <div style={{
        height: 10, width: '65%', borderRadius: 4, background: 'var(--surface-2)',
        animation: `pulse 1.5s ease-in-out ${delay + 0.3}s infinite`,
      }} />
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  result: string
  isLoading: boolean
  isStreaming: boolean
  hasResume: boolean
  onRun: () => void
  error: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InterviewPrepTab({ result, isLoading, isStreaming, hasResume, onRun, error }: Props) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [copied, setCopied] = useState(false)

  const toggle = (num: number) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(num) ? next.delete(num) : next.add(num)
      return next
    })
  }

  const handleCopyAll = () => {
    navigator.clipboard.writeText(result)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
      .catch(() => {})
  }

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (!isLoading && !isStreaming && !result) {
    return (
      <EmptyCard>
        <EmptyState
          icon={<IconPerson />}
          title="Interview Prep"
          subtitle="Get 10 targeted interview questions with STAR coaching notes, generated from your resume and job description."
        />
        <div style={{ marginTop: 16 }}>
          <button
            onClick={onRun}
            disabled={!hasResume}
            style={{
              width: '100%', padding: '12px 0', fontSize: 14, fontWeight: 700,
              background: hasResume ? 'var(--navy)' : 'var(--surface-1)',
              color: hasResume ? 'white' : 'var(--text-muted)',
              border: hasResume ? 'none' : '1px solid var(--border)',
              borderRadius: 'var(--radius)', cursor: hasResume ? 'pointer' : 'default',
              transition: 'background 0.15s',
            }}
          >
            Generate Interview Questions
          </button>
          {error && (
            <p style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center', marginTop: 8 }}>
              {error}
            </p>
          )}
        </div>
      </EmptyCard>
    )
  }

  // ── Loading / streaming — show skeleton ──────────────────────────────────────
  if (isLoading || isStreaming) {
    return (
      <div style={{
        background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)',
        padding: 28, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)',
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 4px' }}>
          Interview Questions
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 20px' }}>
          Generating your personalized questions…
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 10 }, (_, i) => <SkeletonCard key={i} index={i} />)}
        </div>
      </div>
    )
  }

  // ── Done — parse and render ───────────────────────────────────────────────────
  const questions = parseQuestions(result)

  // Fallback: parsing failed — render raw text
  if (questions.length === 0) {
    return (
      <div style={{
        background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)',
        padding: 28, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)',
        animation: 'fadeIn 0.3s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-heading)' }}>Interview Questions</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleCopyAll} style={smallBtnStyle}>{copied ? 'Copied!' : 'Copy all'}</button>
            <button onClick={onRun} style={smallBtnStyle}>Regenerate</button>
          </div>
        </div>
        <div style={{ background: 'var(--surface-1)', borderRadius: 'var(--radius)', padding: '20px 24px' }}>
          <pre style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', margin: 0 }}>
            {result}
          </pre>
        </div>
      </div>
    )
  }

  // ── Structured card view ──────────────────────────────────────────────────────
  return (
    <div style={{
      background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)',
      padding: 28, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)',
      animation: 'fadeIn 0.3s ease',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 3px' }}>
            Interview Questions
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            Click any card to reveal the STAR coaching note
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={handleCopyAll} style={smallBtnStyle}>
            {copied ? 'Copied!' : 'Copy all'}
          </button>
          <button onClick={onRun} style={smallBtnStyle}>Regenerate</button>
        </div>
      </div>

      {/* Question cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {questions.map(q => {
          const isOpen = expanded.has(q.number)
          const { bg, color } = categoryStyle(q.category)

          return (
            <div
              key={q.number}
              onClick={() => toggle(q.number)}
              style={{
                background: 'var(--surface-1)', borderRadius: 'var(--radius)',
                border: `1px solid ${isOpen ? 'var(--navy)' : 'var(--border)'}`,
                overflow: 'hidden', cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
            >
              {/* Question row */}
              <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                {/* Number badge */}
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--navy)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, marginTop: 1,
                }}>
                  {q.number}
                </div>

                {/* Question content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--text-primary)', margin: '0 0 8px', fontWeight: 500 }}>
                    {q.question}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    {q.category && (
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                        background: bg, color,
                      }}>
                        {q.category}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto', flexShrink: 0 }}>
                      {isOpen ? 'Hide tip ↑' : 'STAR tip ↓'}
                    </span>
                  </div>
                </div>
              </div>

              {/* STAR coaching note — revealed on click */}
              {isOpen && q.star && (
                <div style={{
                  padding: '12px 16px 14px 52px',
                  background: 'var(--surface-2)',
                  borderTop: '1px solid var(--border)',
                  animation: 'fadeIn 0.15s ease',
                }}>
                  <p style={{
                    fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
                    margin: '0 0 4px', letterSpacing: '0.05em', textTransform: 'uppercase',
                  }}>
                    STAR coaching
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.65, margin: 0 }}>
                    {q.star}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Shared button style ──────────────────────────────────────────────────────

const smallBtnStyle: React.CSSProperties = {
  padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
  background: 'var(--surface-1)', color: 'var(--text-secondary)',
  border: '1px solid var(--border)', borderRadius: 6,
}
