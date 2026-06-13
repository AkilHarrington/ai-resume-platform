import { useState } from 'react'
import { Button } from '../../components/Button'
import { LoadingCard, EmptyState, EmptyCard } from './shared'
import { useAuth } from '../../app/AuthContext'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

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

// ── Tab component ─────────────────────────────────────────────────────────────
export function CoverLetterTab({ result, isLoading, isStreaming, hasResume, companyName, setCompanyName, onRun, error }: Props) {
  const { session } = useAuth()
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (!result) return
    setIsDownloading(true)
    try {
      const token = session?.access_token
      if (!token) throw new Error('Not authenticated')
      const resp = await fetch(`${API_BASE}/api/cover-letter/download-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          coverLetterText: result,
          companyName: companyName || '',
        }),
      })
      if (!resp.ok) {
        const detail = await resp.json().catch(() => ({}))
        throw new Error(detail?.detail ?? `Server error ${resp.status}`)
      }
      const blob = await resp.blob()
      const slug = companyName ? companyName.toLowerCase().replace(/\s+/g, '-') : 'cover-letter'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cover-letter-${slug}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'PDF download failed.'
      alert(msg)
    } finally {
      setIsDownloading(false)
    }
  }

  if (isLoading) return <LoadingCard message="Claude is writing your cover letter..." />
  if (!result) return (
    <EmptyCard>
      <EmptyState icon="📝" title="Cover Letter Generator" subtitle="Claude writes a tailored, professional cover letter based on your resume and the job description." />
      <div style={{ marginTop: 16 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-600)', display: 'block', marginBottom: 6 }}>Company Name (optional)</label>
        <input
          value={companyName}
          onChange={e => setCompanyName(e.target.value)}
          placeholder="e.g. Google, Stripe, Acme Corp"
          style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', fontSize: 13, marginBottom: 12 }}
        />
        <Button fullWidth size="lg" variant="secondary" disabled={!hasResume} onClick={onRun}>
          📝 Generate Cover Letter
        </Button>
        {error && <p style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center', marginTop: 8 }}>{error}</p>}
      </div>
    </EmptyCard>
  )

  return (
    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)' }}>Your Cover Letter</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isStreaming && (
            <span style={{ fontSize: 12, color: 'var(--emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--emerald)', display: 'inline-block', animation: 'pulse 1s ease-in-out infinite' }} />
              Writing…
            </span>
          )}
          <Button size="sm" variant="outline" disabled={isStreaming} onClick={() => navigator.clipboard.writeText(result)}>📋 Copy</Button>
          <Button size="sm" variant="outline" disabled={isStreaming || isDownloading} onClick={handleDownload}>
            {isDownloading ? 'Saving…' : '⬇️ Download PDF'}
          </Button>
          <Button size="sm" variant="secondary" disabled={isStreaming} onClick={onRun}>Regenerate</Button>
        </div>
      </div>
      <div style={{
        background: 'var(--gray-50)', borderRadius: 'var(--radius)', padding: '24px 28px',
        fontSize: 14, lineHeight: 1.8, color: 'var(--charcoal)', whiteSpace: 'pre-wrap',
        maxHeight: 560, overflow: 'auto',
      }}>
        {result}
      </div>
    </div>
  )
}
