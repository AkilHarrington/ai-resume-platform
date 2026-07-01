import { useState } from 'react'
import { Button } from '../../components/Button'
import { EmptyState, EmptyCard, IconDocument } from './shared'
import { useAuth } from '../../app/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

interface Props {
  result: string
  isLoading: boolean
  isStreaming?: boolean
  hasResume: boolean
  companyName: string
  setCompanyName: (v: string) => void
  onRun: () => void
  error: string
}

export function CoverLetterTab({ result, isLoading, isStreaming, hasResume, companyName, setCompanyName, onRun, error }: Props) {
  const { session } = useAuth()
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (!result) return
    setIsDownloading(true)
    try {
      const token = session?.access_token
      if (!token) throw new Error('Not authenticated')
      const resp = await fetch(`${API_BASE}/api/v1/cover-letter/download-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ coverLetterText: result, companyName: companyName || '' }),
      })
      if (!resp.ok) {
        const detail = await resp.json().catch(() => ({}))
        throw new Error(detail?.detail ?? `Server error ${resp.status}`)
      }
      const blob = await resp.blob()
      const slug = companyName ? companyName.toLowerCase().replace(/\s+/g, '-') : 'cover-letter'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `cover-letter-${slug}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'PDF download failed.')
    } finally {
      setIsDownloading(false)
    }
  }

  // ── Empty state — before generation starts ────────────────────────────────
  if (!isStreaming && !result) return (
    <EmptyCard>
      <EmptyState
        icon={<IconDocument />}
        title="Cover Letter Generator"
        subtitle="Claude writes a tailored, professional cover letter based on your resume and the job description."
      />
      <div style={{ marginTop: 16 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
          Company Name (optional)
        </label>
        <input
          value={companyName}
          onChange={e => setCompanyName(e.target.value)}
          placeholder="e.g. Google, Stripe, Acme Corp"
          style={{
            width: '100%', padding: '8px 12px', fontSize: 13, marginBottom: 12,
            border: '1px solid var(--border-input)', borderRadius: 'var(--radius)',
            background: 'var(--surface-1)', color: 'var(--text-primary)',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
        <Button fullWidth size="lg" variant="secondary" disabled={!hasResume} onClick={onRun}>
          Generate Cover Letter
        </Button>
        {error && <p style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center', marginTop: 8 }}>{error}</p>}
      </div>
    </EmptyCard>
  )

  // ── Unified progressive view — same card, content morphs ─────────────────
  // stepIdx: 0 = Preparing (skeleton), 1 = Writing (live text), 2 = Done
  const stepIdx    = isLoading ? 0 : isStreaming ? 1 : 2
  const stepLabels = ['Preparing', 'Writing', 'Done']

  return (
    <div style={{
      background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)',
      padding: 28, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)',
      animation: 'fadeIn 0.3s ease',
    }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-heading)' }}>Your Cover Letter</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button size="sm" variant="outline" disabled={!!isStreaming || !result} onClick={() => navigator.clipboard.writeText(result)}>
            Copy
          </Button>
          <Button size="sm" variant="outline" disabled={!!isStreaming || isDownloading || !result} onClick={handleDownload}>
            {isDownloading ? 'Saving…' : 'Download PDF'}
          </Button>
          {!isLoading && (
            <Button size="sm" variant="secondary" disabled={!!isStreaming} onClick={onRun}>Regenerate</Button>
          )}
        </div>
      </div>

      {/* ── Step indicator ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
        {stepLabels.map((label, i) => {
          const isDone   = i < stepIdx
          const isActive = i === stepIdx
          return [
            <div key={`s${i}`} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <div style={{
                width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8, fontWeight: 800,
                background: isDone ? 'var(--success-light)' : isActive ? 'var(--navy)' : 'var(--surface-2)',
                color: isDone ? 'var(--success)' : isActive ? 'white' : 'var(--text-muted)',
                transition: 'background 0.3s ease, color 0.3s ease',
              }}>
                {isDone ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: 11, whiteSpace: 'nowrap',
                fontWeight: isActive ? 700 : 400,
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
              }}>
                {label}
              </span>
            </div>,
            i < stepLabels.length - 1
              ? <div key={`l${i}`} style={{ height: 1, width: 12, flexShrink: 0, background: isDone ? 'var(--success)' : 'var(--border)', transition: 'background 0.3s' }} />
              : null,
          ]
        }).flat()}
      </div>

      {/* ── Content — skeleton or live text, always the same container ── */}
      <div style={{
        background: 'var(--surface-1)', borderRadius: 'var(--radius)',
        padding: '24px 28px', maxHeight: 560, overflow: 'auto',
      }}>
        {isLoading ? (
          // Skeleton shaped like a real cover letter
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Date / address block */}
            {[20, 32, 26].map((w, i) => (
              <div key={`d${i}`} style={{ height: 11, width: `${w}%`, borderRadius: 4, background: 'var(--surface-2)', animation: `pulse 1.5s ease-in-out ${i * 0.05}s infinite` }} />
            ))}
            <div style={{ height: 14 }} />
            {/* Salutation */}
            <div style={{ height: 12, width: '38%', borderRadius: 4, background: 'var(--surface-2)', animation: 'pulse 1.5s ease-in-out 0.15s infinite' }} />
            <div style={{ height: 8 }} />
            {/* Paragraph 1 */}
            {[100, 96, 88, 93, 72].map((w, i) => (
              <div key={`p1${i}`} style={{ height: 12, width: `${w}%`, borderRadius: 4, background: 'var(--surface-2)', animation: `pulse 1.5s ease-in-out ${0.2 + i * 0.05}s infinite` }} />
            ))}
            <div style={{ height: 16 }} />
            {/* Paragraph 2 */}
            {[94, 99, 86, 91, 78, 62].map((w, i) => (
              <div key={`p2${i}`} style={{ height: 12, width: `${w}%`, borderRadius: 4, background: 'var(--surface-2)', animation: `pulse 1.5s ease-in-out ${0.45 + i * 0.05}s infinite` }} />
            ))}
            <div style={{ height: 16 }} />
            {/* Paragraph 3 */}
            {[90, 97, 82, 65].map((w, i) => (
              <div key={`p3${i}`} style={{ height: 12, width: `${w}%`, borderRadius: 4, background: 'var(--surface-2)', animation: `pulse 1.5s ease-in-out ${0.7 + i * 0.05}s infinite` }} />
            ))}
            <div style={{ height: 20 }} />
            {/* Closing */}
            {[22, 18].map((w, i) => (
              <div key={`cl${i}`} style={{ height: 12, width: `${w}%`, borderRadius: 4, background: 'var(--surface-2)', animation: `pulse 1.5s ease-in-out ${0.9 + i * 0.05}s infinite` }} />
            ))}
          </div>
        ) : (
          // Live streaming text or complete result — same element, no layout shift
          <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
            {result}
            {isStreaming && (
              <span style={{
                display: 'inline-block', width: 2, height: '1em',
                background: 'var(--navy)', marginLeft: 1, verticalAlign: 'text-bottom',
                animation: 'blink 1s step-end infinite',
              }} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
