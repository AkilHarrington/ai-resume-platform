import { useState } from 'react'
import { useAuth } from '../../app/AuthContext'
import type { ScanResult, OptimizeResult } from '../../api/resumeApi'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

interface Props {
  scanResult: ScanResult | null
  optimizedScore: number | null
  optimizeResult: OptimizeResult | null
  coverLetter: string
  linkedin: { headline: string; summary: string } | null
  companyName: string
  resumeFileName: string
  onNewRole: () => void
}

function showToast(msg: string, type: 'success' | 'error' = 'success') {
  const el = document.createElement('div')
  el.textContent = msg
  Object.assign(el.style, {
    position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
    background: type === 'error' ? 'var(--danger)' : 'var(--navy)',
    color: 'white', padding: '10px 20px', borderRadius: 8,
    fontSize: 13, fontWeight: 600, zIndex: 9999,
    boxShadow: '0 4px 16px rgba(0,0,0,0.18)', pointerEvents: 'none',
  })
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 2800)
}

export function SummaryTab({
  scanResult, optimizedScore, optimizeResult,
  coverLetter, linkedin, companyName, resumeFileName, onNewRole,
}: Props) {
  const { session } = useAuth()
  const [downloadingResume, setDownloadingResume] = useState(false)
  const [downloadingCover, setDownloadingCover] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [feedbackGiven, setFeedbackGiven] = useState<'yes' | 'no' | null>(null)

  const beforeScore = scanResult?.overallScore ?? null
  const afterScore = optimizedScore
  const improvement = (beforeScore !== null && afterScore !== null) ? afterScore - beforeScore : null

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 2200)
    } catch {
      showToast('Copy failed — please select and copy manually.', 'error')
    }
  }

  const downloadResumePdf = async () => {
    if (!optimizeResult?.optimizedResumeText) return
    setDownloadingResume(true)
    try {
      const token = session?.access_token
      if (!token) throw new Error('Not authenticated')
      const resp = await fetch(`${API_BASE}/api/v1/resume/download-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ resumeText: optimizeResult.optimizedResumeText, template: 'professional' }),
      })
      if (!resp.ok) {
        const detail = await resp.json().catch(() => ({}))
        throw new Error((detail as { detail?: string }).detail ?? `Server error ${resp.status}`)
      }
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'optimized-resume.pdf'
      a.click()
      URL.revokeObjectURL(url)
      showToast('Resume PDF downloaded')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'PDF download failed.', 'error')
    } finally {
      setDownloadingResume(false)
    }
  }

  const downloadCoverPdf = async () => {
    if (!coverLetter) return
    setDownloadingCover(true)
    try {
      const token = session?.access_token
      if (!token) throw new Error('Not authenticated')
      const resp = await fetch(`${API_BASE}/api/v1/cover-letter/download-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ coverLetterText: coverLetter, companyName: companyName || '' }),
      })
      if (!resp.ok) {
        const detail = await resp.json().catch(() => ({}))
        throw new Error((detail as { detail?: string }).detail ?? `Server error ${resp.status}`)
      }
      const blob = await resp.blob()
      const slug = companyName ? companyName.toLowerCase().replace(/\s+/g, '-') : 'cover-letter'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cover-letter-${slug}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      showToast('Cover letter PDF downloaded')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'PDF download failed.', 'error')
    } finally {
      setDownloadingCover(false)
    }
  }

  // Score metrics to show (filter out nulls)
  const metrics = [
    beforeScore !== null && { label: 'ATS score before', value: String(beforeScore), color: 'var(--text-primary)' },
    afterScore !== null && { label: 'ATS score after', value: String(afterScore), color: 'var(--success)' },
    improvement !== null && improvement > 0 && { label: 'Points gained', value: `+${improvement}`, color: 'var(--success)' },
  ].filter(Boolean) as { label: string; value: string; color: string }[]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ── */}
      <div style={{
        background: 'var(--surface-0)', border: '1px solid var(--success)', borderRadius: 'var(--radius-lg)',
        padding: 24, boxShadow: 'var(--shadow-sm)',
      }}>
        {/* "All done" pill */}
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 11, fontWeight: 700, color: 'var(--success)',
          background: 'var(--success-light)', padding: '4px 10px', borderRadius: 999,
          marginBottom: 12,
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          All 5 steps complete
        </span>

        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 8px' }}>
          You're ready to apply
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.65, maxWidth: 480 }}>
          Your resume, cover letter, and LinkedIn are all aligned for this role.
          Everything you need is below — use it while it's fresh.
        </p>

        {/* Score metrics */}
        {metrics.length > 0 && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {metrics.map(m => (
              <div key={m.label} style={{
                background: 'var(--surface-1)', borderRadius: 'var(--radius)',
                padding: '12px 16px', minWidth: 110, flex: '1 1 110px',
              }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 5px' }}>{m.label}</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: m.color, margin: 0, lineHeight: 1 }}>{m.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Deliverables label ── */}
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', margin: 0, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
        Your deliverables
      </p>

      {/* ── Deliverables grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>

        {/* Resume card */}
        <div style={{
          background: 'var(--surface-0)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: 18, boxShadow: 'var(--shadow-sm)',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ color: 'var(--success)', flexShrink: 0 }} aria-hidden="true">
              <path d="M10 2H4a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 2v5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 11.5h6M6 9h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>Resume</p>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            {optimizeResult ? 'ATS-optimized · ready to send' : (resumeFileName || 'Uploaded resume')}
          </p>
          {optimizeResult ? (
            <button
              onClick={downloadResumePdf}
              disabled={downloadingResume}
              style={{
                background: 'var(--navy)', color: 'white', border: 'none',
                borderRadius: 'var(--radius)', padding: '8px 14px',
                fontSize: 12, fontWeight: 700, cursor: downloadingResume ? 'default' : 'pointer',
                opacity: downloadingResume ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M6 1v7M3 5.5l3 3 3-3M1 10h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {downloadingResume ? 'Saving…' : 'Download PDF'}
            </button>
          ) : (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
              Complete Step 3 to download optimized PDF
            </p>
          )}
        </div>

        {/* Cover letter card */}
        <div style={{
          background: 'var(--surface-0)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: 18, boxShadow: 'var(--shadow-sm)',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ color: 'var(--success)', flexShrink: 0 }} aria-hidden="true">
              <rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M2 6.5l7 4.5 7-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>Cover letter</p>
          </div>
          {coverLetter && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
              "{coverLetter.slice(0, 90).trim()}…"
            </p>
          )}
          {coverLetter ? (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                onClick={() => copy(coverLetter, 'cover')}
                style={{
                  background: 'var(--surface-1)', color: 'var(--text-primary)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                  padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <rect x="4" y="1" width="7" height="8" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M1 4v7h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {copied === 'cover' ? '✓ Copied' : 'Copy text'}
              </button>
              <button
                onClick={downloadCoverPdf}
                disabled={downloadingCover}
                style={{
                  background: 'var(--surface-1)', color: 'var(--text-primary)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                  padding: '7px 12px', fontSize: 12, fontWeight: 600,
                  cursor: downloadingCover ? 'default' : 'pointer',
                  opacity: downloadingCover ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M6 1v7M3 5.5l3 3 3-3M1 10h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {downloadingCover ? 'Saving…' : 'PDF'}
              </button>
            </div>
          ) : (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
              Complete Step 4 to generate
            </p>
          )}
        </div>

        {/* LinkedIn card */}
        <div style={{
          background: 'var(--surface-0)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: 18, boxShadow: 'var(--shadow-sm)',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ color: 'var(--success)', flexShrink: 0 }} aria-hidden="true">
              <rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M6 8v5M6 6.2v.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              <path d="M10 13v-2.5a1.5 1.5 0 013 0V13M10 8v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>LinkedIn</p>
          </div>
          {linkedin?.headline && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
              "{linkedin.headline.length > 80 ? linkedin.headline.slice(0, 80) + '…' : linkedin.headline}"
            </p>
          )}
          {linkedin ? (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                onClick={() => copy(linkedin.headline, 'headline')}
                style={{
                  background: 'var(--surface-1)', color: 'var(--text-primary)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                  padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <rect x="4" y="1" width="7" height="8" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M1 4v7h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {copied === 'headline' ? '✓ Copied' : 'Copy headline'}
              </button>
              <button
                onClick={() => copy(linkedin.summary, 'about')}
                style={{
                  background: 'var(--surface-1)', color: 'var(--text-primary)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                  padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <rect x="4" y="1" width="7" height="8" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M1 4v7h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {copied === 'about' ? '✓ Copied' : 'Copy About'}
              </button>
            </div>
          ) : (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
              Complete Step 5 to generate
            </p>
          )}
        </div>

      </div>

      {/* ── What's next ── */}
      <div style={{
        background: 'var(--surface-1)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '18px 20px',
      }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', margin: '0 0 14px' }}>
          What's next
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            'Apply today — this package is optimized for one specific role. The sooner you apply, the more relevant it is.',
            "Update your LinkedIn before reaching out to recruiters — they'll check it the moment your resume lands in their inbox.",
            'Applying to another role? Hit "Optimize for a new role" below. Your resume carries over — just swap the job description.',
          ].map((tip, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: 'var(--surface-0)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 800, color: 'var(--text-secondary)',
              }}>
                {i + 1}
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.65 }}>{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Outcome feedback ── */}
      <div style={{
        background: 'var(--surface-1)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '18px 20px',
      }}>
        {feedbackGiven === null ? (
          <>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
              Did you hear back from this application?
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 14px', lineHeight: 1.5 }}>
              Optional — helps us improve results for everyone in similar roles.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setFeedbackGiven('yes')}
                style={{
                  background: 'var(--success-light)', color: 'var(--success)',
                  border: '1px solid var(--success)', borderRadius: 'var(--radius)',
                  padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}
              >
                Yes, I got a response
              </button>
              <button
                onClick={() => setFeedbackGiven('no')}
                style={{
                  background: 'var(--surface-0)', color: 'var(--text-secondary)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                  padding: '7px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Not yet / No
              </button>
            </div>
          </>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            {feedbackGiven === 'yes'
              ? 'That\'s great — congratulations! We\'ll use this to improve results for similar roles.'
              : 'Thanks for letting us know. We\'ll keep refining the optimization for this role type.'}
          </p>
        )}
      </div>

      {/* ── New role CTA ── */}
      <div>
        <button
          onClick={onNewRole}
          style={{
            background: 'none', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '10px 20px',
            fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)',
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--text-muted)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M1 7a6 6 0 1112 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M1 7l2-2M1 7l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Optimize for a new role
        </button>
      </div>

    </div>
  )
}
