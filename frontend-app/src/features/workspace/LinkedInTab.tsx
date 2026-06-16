import { Button } from '../../components/Button'
import { EmptyState, EmptyCard } from './shared'

interface Props {
  result: { headline: string; summary: string } | null
  isLoading: boolean
  isStreaming?: boolean
  hasResume: boolean
  targetRole: string
  setTargetRole: (v: string) => void
  onRun: () => void
  error: string
}

export function LinkedInTab({ result, isLoading, isStreaming, hasResume, targetRole, setTargetRole, onRun, error }: Props) {

  // ── Empty state — before generation starts ────────────────────────────────
  if (!isStreaming && !result) return (
    <EmptyCard>
      <EmptyState
        icon="💼"
        title="LinkedIn Optimizer"
        subtitle="Get an optimized LinkedIn headline and About section that attracts recruiters and passes LinkedIn search algorithms."
      />
      <div style={{ marginTop: 16 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
          Target Role (optional)
        </label>
        <input
          value={targetRole}
          onChange={e => setTargetRole(e.target.value)}
          placeholder="e.g. Senior Product Manager, Software Engineer"
          style={{
            width: '100%', padding: '8px 12px', fontSize: 13, marginBottom: 12,
            border: '1px solid var(--border-input)', borderRadius: 'var(--radius)',
            background: 'var(--surface-1)', color: 'var(--text-primary)',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
        <Button fullWidth size="lg" variant="secondary" disabled={!hasResume} onClick={onRun}>
          💼 Optimize LinkedIn Profile
        </Button>
        {error && <p style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center', marginTop: 8 }}>{error}</p>}
      </div>
    </EmptyCard>
  )

  // ── Unified progressive view — two cards, content morphs in place ─────────
  // stepIdx: 0 = Preparing (skeleton), 1 = Writing (live text), 2 = Done
  const stepIdx    = isLoading ? 0 : isStreaming ? 1 : 2
  const stepLabels = ['Preparing', 'Writing', 'Done']

  // Headline is ready once first tokens arrive (result becomes non-null)
  // About section is ready once 'SUMMARY:' marker appears in the stream
  const headlineReady = !isLoading && !!result?.headline
  const summaryReady  = !isLoading && !!result?.summary

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.3s ease' }}>

      {/* ── Step indicator ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
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

      {/* ── Headline card ── */}
      <div style={{ background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)' }}>LinkedIn Headline</h3>
          <Button
            size="sm" variant="outline"
            disabled={!headlineReady || !!isStreaming}
            onClick={() => navigator.clipboard.writeText(result?.headline ?? '')}
          >
            📋 Copy
          </Button>
        </div>
        <div style={{ background: 'var(--surface-1)', borderRadius: 'var(--radius)', padding: '14px 16px', minHeight: 48, display: 'flex', alignItems: 'center' }}>
          {!headlineReady ? (
            // Skeleton — single headline line
            <div style={{ height: 16, width: '65%', borderRadius: 4, background: 'var(--surface-2)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ) : (
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
              {result?.headline}
              {/* Cursor shown while headline is streaming and summary hasn't started */}
              {isStreaming && !summaryReady && (
                <span style={{
                  display: 'inline-block', width: 2, height: '1em',
                  background: 'var(--navy)', marginLeft: 1, verticalAlign: 'text-bottom',
                  animation: 'blink 1s step-end infinite',
                }} />
              )}
            </div>
          )}
        </div>
        {headlineReady && result?.headline && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
            {result.headline.length}/220 characters
          </p>
        )}
      </div>

      {/* ── About card ── */}
      <div style={{ background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)' }}>About Section</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              size="sm" variant="outline"
              disabled={!summaryReady || !!isStreaming}
              onClick={() => navigator.clipboard.writeText(result?.summary ?? '')}
            >
              📋 Copy
            </Button>
            {!isLoading && (
              <Button size="sm" variant="secondary" disabled={!!isStreaming} onClick={onRun}>Regenerate</Button>
            )}
          </div>
        </div>
        <div style={{ background: 'var(--surface-1)', borderRadius: 'var(--radius)', padding: '16px', maxHeight: 400, overflow: 'auto' }}>
          {!summaryReady ? (
            // Skeleton — paragraph block for About section
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[100, 94, 88, 96, 80, 90, 72, 85, 62].map((w, i) => (
                <div key={i} style={{
                  height: 12, width: `${w}%`, borderRadius: 4,
                  background: 'var(--surface-2)',
                  animation: `pulse 1.5s ease-in-out ${i * 0.07}s infinite`,
                }} />
              ))}
            </div>
          ) : (
            // Live or complete About text — fills in place, no layout shift
            <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
              {result?.summary}
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
    </div>
  )
}
