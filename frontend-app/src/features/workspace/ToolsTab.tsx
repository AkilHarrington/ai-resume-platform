import { useState } from 'react'
import { generateProfessionalSummary, enhanceBullet } from '../../api/resumeApi'
import { LoadingCard } from './shared'

interface ToolsTabProps {
  resumeText: string
  targetRole?: string
}

// ─── Professional Summary Generator ──────────────────────────────────────────

function SummaryGenerator({ resumeText, targetRole }: ToolsTabProps) {
  const [role, setRole] = useState(targetRole || '')
  const [years, setYears] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleGenerate() {
    if (!resumeText.trim()) {
      setError('Upload your resume first (Step 1) before generating a summary.')
      return
    }
    setLoading(true)
    setError('')
    setResult('')
    try {
      const { summary } = await generateProfessionalSummary({
        resumeText,
        targetRole: role,
        yearsExperience: years,
      })
      setResult(summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    if (!result) return
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <div style={{
      background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)',
      padding: '28px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: 'linear-gradient(135deg, #1A356E 0%, #2e57bc 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0,
        }}>✍️</div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>
            Professional Summary Generator
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, marginTop: 2 }}>
            3-4 sentences tailored to your role — ready to paste at the top of your resume
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Target Role <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            value={role}
            onChange={e => setRole(e.target.value)}
            placeholder="e.g. Product Manager"
            style={{
              width: '100%', boxSizing: 'border-box',
              border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              padding: '9px 12px', fontSize: 14,
              background: 'var(--surface-1)', color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Years of Experience <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            value={years}
            onChange={e => setYears(e.target.value)}
            placeholder="e.g. 6"
            style={{
              width: '100%', boxSizing: 'border-box',
              border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              padding: '9px 12px', fontSize: 14,
              background: 'var(--surface-1)', color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading}
        style={{
          background: loading ? 'var(--text-muted)' : 'var(--navy)',
          color: 'white', border: 'none', borderRadius: 'var(--radius)',
          padding: '10px 22px', fontSize: 14, fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 20,
        }}
      >
        {loading ? 'Generating…' : 'Generate Summary'}
      </button>

      {error && (
        <div style={{
          background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)',
          borderRadius: 'var(--radius)', padding: '10px 14px',
          fontSize: 13, color: '#dc2626', marginBottom: 16,
        }}>{error}</div>
      )}

      {result && (
        <div style={{
          background: 'var(--surface-1)', borderRadius: 'var(--radius)',
          padding: '16px', border: '1px solid var(--border)', position: 'relative',
        }}>
          <p style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap' }}>
            {result}
          </p>
          <button
            onClick={handleCopy}
            style={{
              position: 'absolute', top: 10, right: 10,
              background: copied ? '#047857' : 'var(--surface-0)',
              color: copied ? 'white' : 'var(--text-secondary)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              padding: '4px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Bullet Point Enhancer ─────────────────────────────────────────────────

function BulletEnhancer({ targetRole }: { targetRole?: string }) {
  const [bullet, setBullet] = useState('')
  const [role, setRole] = useState(targetRole || '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleEnhance() {
    if (!bullet.trim()) {
      setError('Enter a bullet point to enhance.')
      return
    }
    setLoading(true)
    setError('')
    setResult('')
    try {
      const { enhanced } = await enhanceBullet({ bulletText: bullet, targetRole: role })
      setResult(enhanced)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    if (!result) return
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <div style={{
      background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)',
      padding: '28px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: 'linear-gradient(135deg, #1C3A2B 0%, #2d7a55 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0,
        }}>⚡</div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>
            Bullet Point Enhancer
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, marginTop: 2 }}>
            Paste a weak bullet — get back a strong, results-focused rewrite
          </p>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
          Target Role <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
        </label>
        <input
          value={role}
          onChange={e => setRole(e.target.value)}
          placeholder="e.g. Operations Manager"
          style={{
            width: '100%', boxSizing: 'border-box',
            border: '1px solid var(--border)', borderRadius: 'var(--radius)',
            padding: '9px 12px', fontSize: 14,
            background: 'var(--surface-1)', color: 'var(--text-primary)',
            outline: 'none',
          }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
          Your Bullet Point
        </label>
        <textarea
          value={bullet}
          onChange={e => setBullet(e.target.value)}
          placeholder="e.g. Helped with scheduling and making sure meetings ran on time"
          rows={3}
          style={{
            width: '100%', boxSizing: 'border-box',
            border: '1px solid var(--border)', borderRadius: 'var(--radius)',
            padding: '10px 12px', fontSize: 14, resize: 'vertical',
            background: 'var(--surface-1)', color: 'var(--text-primary)',
            outline: 'none', fontFamily: 'inherit',
          }}
        />
      </div>

      <button
        onClick={handleEnhance}
        disabled={loading}
        style={{
          background: loading ? 'var(--text-muted)' : '#1C3A2B',
          color: 'white', border: 'none', borderRadius: 'var(--radius)',
          padding: '10px 22px', fontSize: 14, fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 20,
        }}
      >
        {loading ? 'Enhancing…' : 'Enhance Bullet'}
      </button>

      {error && (
        <div style={{
          background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)',
          borderRadius: 'var(--radius)', padding: '10px 14px',
          fontSize: 13, color: '#dc2626', marginBottom: 16,
        }}>{error}</div>
      )}

      {result && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{
              background: 'rgba(220,38,38,0.06)', borderRadius: 'var(--radius)',
              padding: '14px', border: '1px solid rgba(220,38,38,0.15)',
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Before
              </p>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
                {bullet}
              </p>
            </div>
            <div style={{
              background: 'rgba(4,120,87,0.07)', borderRadius: 'var(--radius)',
              padding: '14px', border: '1px solid rgba(4,120,87,0.2)',
              position: 'relative',
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#047857', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                After
              </p>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)', margin: 0 }}>
                {result}
              </p>
              <button
                onClick={handleCopy}
                style={{
                  position: 'absolute', top: 8, right: 8,
                  background: copied ? '#047857' : 'var(--surface-0)',
                  color: copied ? 'white' : 'var(--text-secondary)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                  padding: '3px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
            Tip: Paste this into your resume, then enhance another bullet.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Main ToolsTab ─────────────────────────────────────────────────────────

export default function ToolsTab({ resumeText, targetRole }: ToolsTabProps) {
  if (!resumeText) {
    return (
      <LoadingCard message="Upload your resume in Step 1 to unlock the writing tools." />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 4px' }}>
          Writing Tools
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
          AI tools to help you write stronger resume content — free to use anytime.
        </p>
      </div>
      <SummaryGenerator resumeText={resumeText} targetRole={targetRole} />
      <BulletEnhancer targetRole={targetRole} />
    </div>
  )
}
