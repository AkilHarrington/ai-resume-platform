import { Button } from '../../components/Button'
import { LoadingCard, EmptyState, EmptyCard } from './shared'

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
  if (isLoading) return <LoadingCard message="Claude is optimizing your LinkedIn profile..." />
  if (!result) return (
    <EmptyCard>
      <EmptyState icon="💼" title="LinkedIn Optimizer" subtitle="Get an optimized LinkedIn headline and About section that attracts recruiters and passes LinkedIn search algorithms." />
      <div style={{ marginTop: 16 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Target Role (optional)</label>
        <input
          value={targetRole}
          onChange={e => setTargetRole(e.target.value)}
          placeholder="e.g. Senior Product Manager, Software Engineer"
          style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-input)', borderRadius: 'var(--radius)', fontSize: 13, marginBottom: 12 }}
        />
        <Button fullWidth size="lg" variant="secondary" disabled={!hasResume} onClick={onRun}>
          💼 Optimize LinkedIn Profile
        </Button>
        {error && <p style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center', marginTop: 8 }}>{error}</p>}
      </div>
    </EmptyCard>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.3s ease' }}>
      <div style={{ background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)' }}>LinkedIn Headline</h3>
          <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(result.headline)}>📋 Copy</Button>
        </div>
        <div style={{ background: 'var(--surface-1)', borderRadius: 'var(--radius)', padding: '14px 16px', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
          {result.headline}
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{result.headline.length}/220 characters</p>
      </div>
      <div style={{ background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)' }}>About Section</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {isStreaming && (
              <span style={{ fontSize: 12, color: 'var(--emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--emerald)', display: 'inline-block', animation: 'pulse 1s ease-in-out infinite' }} />
                Writing…
              </span>
            )}
            <Button size="sm" variant="outline" disabled={isStreaming} onClick={() => navigator.clipboard.writeText(result.summary)}>📋 Copy</Button>
            <Button size="sm" variant="secondary" disabled={isStreaming} onClick={onRun}>Regenerate</Button>
          </div>
        </div>
        <div style={{
          background: 'var(--surface-1)', borderRadius: 'var(--radius)', padding: '16px',
          fontSize: 14, lineHeight: 1.8, color: 'var(--text-primary)', whiteSpace: 'pre-wrap',
          maxHeight: 400, overflow: 'auto',
        }}>
          {result.summary}
        </div>
      </div>
    </div>
  )
}
