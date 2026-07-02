import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../app/AuthContext'
import { useTheme } from '../app/ThemeContext'
import { useIsMobile } from '../hooks/useIsMobile'
import { IconSun, IconMoon } from '../features/workspace/shared'
import {
  getApplications, createApplication, updateApplication, deleteApplication,
  type JobApplication, type JobApplicationCreate, type JobApplicationUpdate,
} from '../api/trackerApi'

// ─── Status config ────────────────────────────────────────────────────────────

const STATUSES = ['saved', 'applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn'] as const

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  saved:     { bg: 'var(--surface-2)',         color: 'var(--text-muted)',      label: 'Saved'      },
  applied:   { bg: 'rgba(26,54,93,0.12)',      color: 'var(--navy)',            label: 'Applied'    },
  screening: { bg: 'var(--warning-light)',     color: 'var(--warning)',         label: 'Screening'  },
  interview: { bg: 'var(--success-light)',     color: 'var(--success)',         label: 'Interview'  },
  offer:     { bg: 'rgba(5,150,105,0.18)',     color: '#065F46',               label: 'Offer'      },
  rejected:  { bg: 'var(--danger-light)',      color: 'var(--danger)',          label: 'Rejected'   },
  withdrawn: { bg: 'var(--surface-2)',         color: 'var(--text-muted)',      label: 'Withdrawn'  },
}

function StatusPill({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE['saved']
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999,
      background: s.bg, color: s.color, whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  )
}

// ─── Inline status select ─────────────────────────────────────────────────────

function StatusSelect({
  value, onChange,
}: { value: string; onChange: (v: string) => void }) {
  const s = STATUS_STYLE[value] ?? STATUS_STYLE['saved']
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      onClick={e => e.stopPropagation()}
      style={{
        fontSize: 11, fontWeight: 700, padding: '3px 6px', borderRadius: 999,
        background: s.bg, color: s.color,
        border: `1px solid ${s.color}`, cursor: 'pointer',
        appearance: 'none', WebkitAppearance: 'none',
        paddingRight: 20,
      }}
    >
      {STATUSES.map(st => (
        <option key={st} value={st}>{STATUS_STYLE[st].label}</option>
      ))}
    </select>
  )
}

// ─── Date formatter ───────────────────────────────────────────────────────────

function fmtDate(d: string | null): string {
  if (!d) return '—'
  // "YYYY-MM-DD" → "Mon D, YYYY" without timezone shift
  const [year, month, day] = d.split('-').map(Number)
  if (!year || !month || !day) return '—'
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr>
      {[45, 38, 14, 14, 20, 10].map((w, i) => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <div style={{
            height: 13, width: `${w}%`, minWidth: 40, borderRadius: 4,
            background: 'var(--surface-2)',
            animation: `pulse 1.5s ease-in-out ${i * 0.08}s infinite`,
          }} />
        </td>
      ))}
    </tr>
  )
}

function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--surface-0)', borderRadius: 'var(--radius)',
      border: '1px solid var(--border)', padding: '16px',
    }}>
      <div style={{ height: 14, width: '55%', borderRadius: 4, background: 'var(--surface-2)', marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: 12, width: '40%', borderRadius: 4, background: 'var(--surface-2)', marginBottom: 12, animation: 'pulse 1.5s ease-in-out 0.1s infinite' }} />
      <div style={{ height: 20, width: 72, borderRadius: 999, background: 'var(--surface-2)', animation: 'pulse 1.5s ease-in-out 0.2s infinite' }} />
    </div>
  )
}

// ─── Add / Edit modal ─────────────────────────────────────────────────────────

interface ModalProps {
  initial?: JobApplication | null
  onClose: () => void
  onSave: (data: JobApplicationCreate | JobApplicationUpdate) => void
  isSaving: boolean
}

const EMPTY_FORM: JobApplicationCreate = {
  company: '', role: '', status: 'saved',
  url: '', applied_date: '', location: '',
  salary_min: undefined, salary_max: undefined, notes: '',
}

function AppModal({ initial, onClose, onSave, isSaving }: ModalProps) {
  const [form, setForm] = useState<JobApplicationCreate>(
    initial
      ? {
          company: initial.company,
          role: initial.role,
          status: initial.status,
          url: initial.url ?? '',
          applied_date: initial.applied_date ?? '',
          location: initial.location ?? '',
          salary_min: initial.salary_min ?? undefined,
          salary_max: initial.salary_max ?? undefined,
          notes: initial.notes ?? '',
        }
      : { ...EMPTY_FORM }
  )

  const set = (k: keyof typeof form, v: string | number | undefined) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const canSubmit = form.company.trim() && form.role.trim() && !isSaving

  const fieldStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', fontSize: 13,
    border: '1px solid var(--border-input)', borderRadius: 8,
    background: 'var(--surface-1)', color: 'var(--text-primary)',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-sans)',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
    display: 'block', marginBottom: 4,
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)',
          padding: 28, width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 20 }}>
          {initial ? 'Edit Application' : 'Add Application'}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Company *</label>
              <input value={form.company} onChange={e => set('company', e.target.value)}
                placeholder="e.g. Google" style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>Role *</label>
              <input value={form.role} onChange={e => set('role', e.target.value)}
                placeholder="e.g. Product Manager" style={fieldStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} style={fieldStyle}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_STYLE[s].label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Date Applied</label>
              <input type="date" value={form.applied_date ?? ''} onChange={e => set('applied_date', e.target.value)} style={fieldStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Job URL</label>
            <input value={form.url ?? ''} onChange={e => set('url', e.target.value)}
              placeholder="https://..." style={fieldStyle} />
          </div>

          <div>
            <label style={labelStyle}>Location</label>
            <input value={form.location ?? ''} onChange={e => set('location', e.target.value)}
              placeholder="e.g. New York, NY or Remote" style={fieldStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Salary Min</label>
              <input type="number" value={form.salary_min ?? ''} min={0}
                onChange={e => set('salary_min', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="e.g. 80000" style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>Salary Max</label>
              <input type="number" value={form.salary_max ?? ''} min={0}
                onChange={e => set('salary_max', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="e.g. 110000" style={fieldStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Notes</label>
            <textarea value={form.notes ?? ''} onChange={e => set('notes', e.target.value)}
              rows={3} placeholder="Recruiter contact, interview notes, next steps…" style={{ ...fieldStyle, resize: 'vertical' }} />
          </div>

        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: 'var(--surface-1)', color: 'var(--text-secondary)',
            border: '1px solid var(--border)', borderRadius: 8,
          }}>
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!canSubmit}
            style={{
              padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'default',
              background: canSubmit ? 'var(--navy)' : 'var(--surface-1)',
              color: canSubmit ? 'white' : 'var(--text-muted)',
              border: canSubmit ? 'none' : '1px solid var(--border)',
              borderRadius: 8,
            }}
          >
            {isSaving ? 'Saving…' : initial ? 'Save Changes' : 'Add Application'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function TrackerPage() {
  const navigate   = useNavigate()
  const { user, signOut, loading } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const isMobile   = useIsMobile()
  const qc         = useQueryClient()

  const [modal, setModal]   = useState<'add' | 'edit' | null>(null)
  const [editing, setEditing] = useState<JobApplication | null>(null)
  const [error, setError]   = useState('')

  // Optimistic status — maps id → temporary status while mutation is in-flight
  const [optimisticStatus, setOptimisticStatus] = useState<Record<string, string>>({})
  const prevStatus = useRef<Record<string, string>>({})

  // Expanded cards on mobile
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [loading, user, navigate])

  const { data: apps = [], isLoading, isError } = useQuery({
    queryKey: ['tracker', user?.id],
    queryFn:  getApplications,
    enabled:  !!user,
    staleTime: 30_000,
  })

  const createMut = useMutation({
    mutationFn: (d: JobApplicationCreate) => createApplication(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tracker'] }); setModal(null); setError('') },
    onError: (e: Error) => setError(e.message),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: JobApplicationUpdate }) => updateApplication(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tracker'] }); setModal(null); setEditing(null); setError('') },
    onError: (e: Error, vars) => {
      // Revert optimistic status
      setOptimisticStatus(prev => ({ ...prev, [vars.id]: prevStatus.current[vars.id] ?? '' }))
      setError(e.message)
    },
  })

  const deleteMut = useMutation({
    mutationFn: deleteApplication,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tracker'] }),
    onError: (e: Error) => setError(e.message),
  })

  if (loading || !user) return null

  const handleStatusChange = (app: JobApplication, newStatus: string) => {
    prevStatus.current[app.id] = optimisticStatus[app.id] || app.status
    setOptimisticStatus(prev => ({ ...prev, [app.id]: newStatus }))
    updateMut.mutate({ id: app.id, data: { status: newStatus } })
  }

  const handleSave = (data: JobApplicationCreate | JobApplicationUpdate) => {
    if (editing) {
      updateMut.mutate({ id: editing.id, data: data as JobApplicationUpdate })
    } else {
      createMut.mutate(data as JobApplicationCreate)
    }
  }

  const handleDelete = (app: JobApplication) => {
    if (!window.confirm(`Remove "${app.company} — ${app.role}" from your tracker?`)) return
    deleteMut.mutate(app.id)
  }

  const openEdit = (app: JobApplication) => { setEditing(app); setModal('edit') }

  const effectiveStatus = (app: JobApplication) => optimisticStatus[app.id] || app.status

  // ── Header ──────────────────────────────────────────────────────────────────
  const header = (
    <header style={{
      height: 44, flexShrink: 0,
      background: 'var(--surface-0)', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', padding: '0 20px', gap: 10,
    }}>
      <button
        onClick={() => navigate('/')}
        aria-label="AI Resume Studio — go to homepage"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}
      >
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }}>
          <rect width="28" height="28" rx="6" fill="#1E3A5F"/>
          <rect x="7" y="7" width="14" height="3" rx="1" fill="white" opacity="0.9"/>
          <rect x="7" y="12" width="10" height="2" rx="1" fill="white" opacity="0.7"/>
          <rect x="7" y="16" width="12" height="2" rx="1" fill="white" opacity="0.7"/>
          <circle cx="21" cy="21" r="5" fill="#047857"/>
          <path d="M18.5 21L20.2 22.8L23.5 19.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
          <span style={{ fontWeight: 900, fontSize: 12, color: 'var(--text-heading)', letterSpacing: '-0.01em' }}>AI Resume</span>
          <span style={{ fontWeight: 800, fontSize: 9, color: 'var(--success)', letterSpacing: '0.08em' }}>STUDIO</span>
        </div>
      </button>
      {!isMobile && (
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.email}</span>
      )}
      <button
        onClick={() => navigate('/workspace')}
        style={{
          background: 'var(--surface-1)', color: 'var(--text-secondary)',
          border: '1px solid var(--border)', borderRadius: 6, padding: '3px 10px',
          fontSize: 11, fontWeight: 600, cursor: 'pointer',
        }}
      >
        Workspace
      </button>
      <button
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 7px', cursor: 'pointer', fontSize: 12, lineHeight: 1 }}
      >
        {theme === 'dark' ? <IconSun /> : <IconMoon />}
      </button>
      <button
        onClick={() => { signOut(); navigate('/') }}
        style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}
      >
        Sign out
      </button>
    </header>
  )

  // ── Error banner ─────────────────────────────────────────────────────────────
  const errorBanner = (isError || error) && (
    <div style={{
      background: 'var(--danger-light)', color: 'var(--danger)',
      padding: '10px 20px', fontSize: 13, borderBottom: '1px solid var(--border)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <span>{isError ? 'Could not load your applications. Please refresh.' : error}</span>
      <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 16, fontWeight: 700 }}>×</button>
    </div>
  )

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (!isLoading && apps.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--surface-page)' }}>
        {header}
        {errorBanner}
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ color: 'var(--text-muted)', margin: '0 auto 20px' }} aria-hidden>
              <rect x="8" y="12" width="48" height="40" rx="6" stroke="currentColor" strokeWidth="2"/>
              <path d="M20 26h24M20 34h16M20 42h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="50" cy="14" r="10" fill="var(--surface-0)" stroke="currentColor" strokeWidth="2"/>
              <path d="M50 10v4M50 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 8 }}>
              No applications tracked yet
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
              Track every role you apply to — status, dates, notes, and salary range all in one place.
            </p>
            <button
              onClick={() => { setEditing(null); setModal('add') }}
              style={{
                background: 'var(--navy)', color: 'white', border: 'none',
                borderRadius: 'var(--radius)', padding: '12px 28px',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Add your first application
            </button>
          </div>
        </main>
        {modal && (
          <AppModal
            initial={null}
            onClose={() => { setModal(null); setError('') }}
            onSave={handleSave}
            isSaving={createMut.isPending}
          />
        )}
      </div>
    )
  }

  // ── Desktop table ─────────────────────────────────────────────────────────────
  const desktopTable = (
    <div style={{
      background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
            {['Company', 'Role', 'Status', 'Applied', 'Location', 'Actions'].map(h => (
              <th key={h} style={{
                padding: '10px 16px', fontSize: 11, fontWeight: 700,
                color: 'var(--text-muted)', textAlign: 'left', letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
              }}>
                {h.toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: 5 }, (_, i) => <SkeletonRow key={i} />)
            : apps.map(app => (
                <tr key={app.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                      {app.url
                        ? <a href={app.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}
                            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                          >{app.company}</a>
                        : app.company
                      }
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{app.role}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <StatusSelect value={effectiveStatus(app)} onChange={v => handleStatusChange(app, v)} />
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(app.applied_date)}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{app.location || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(app)} title="Edit" style={iconBtnStyle}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M2 12l7-7 2 2-7 7H2v-2z"/><path d="M9 5l1.5-1.5L12 5l-1.5 1.5"/>
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(app)} title="Delete" style={{ ...iconBtnStyle, color: 'var(--danger)' }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M2 4h10M5 4V2h4v2M6 7v4M8 7v4M3 4l1 8h6l1-8"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
          }
        </tbody>
      </table>
    </div>
  )

  // ── Mobile cards ──────────────────────────────────────────────────────────────
  const mobileCards = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {isLoading
        ? Array.from({ length: 5 }, (_, i) => <SkeletonCard key={i} />)
        : apps.map(app => {
            const isOpen = expanded.has(app.id)
            const toggle = () => setExpanded(prev => {
              const next = new Set(prev); next.has(app.id) ? next.delete(app.id) : next.add(app.id); return next
            })
            return (
              <div key={app.id} style={{
                background: 'var(--surface-0)', borderRadius: 'var(--radius)',
                border: '1px solid var(--border)', overflow: 'hidden',
              }}>
                <div onClick={toggle} style={{ padding: '14px 14px 12px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px' }}>{app.company}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>{app.role}</p>
                    </div>
                    <StatusPill status={effectiveStatus(app)} />
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{fmtDate(app.applied_date)}</p>
                </div>
                {isOpen && (
                  <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--border)' }}>
                    {app.location && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>{app.location}</p>}
                    {app.notes && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>{app.notes}</p>}
                    {app.url && (
                      <a href={app.url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 12, color: 'var(--navy)', display: 'block', marginBottom: 10 }}>
                        View job posting
                      </a>
                    )}
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <StatusSelect value={effectiveStatus(app)} onChange={v => handleStatusChange(app, v)} />
                      <button onClick={() => openEdit(app)} style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 6, background: 'var(--surface-1)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleDelete(app)} style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 6, background: 'var(--danger-light)', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>Delete</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
      }
    </div>
  )

  // ── Page ──────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--surface-page)', overflow: 'hidden' }}>
      {header}
      {errorBanner}

      <main style={{ flex: 1, overflow: 'auto', padding: isMobile ? '16px 12px 24px' : '24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>

          {/* Page header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 3px' }}>
                Application Tracker
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                {apps.length} {apps.length === 1 ? 'application' : 'applications'} tracked
              </p>
            </div>
            <button
              onClick={() => { setEditing(null); setModal('add') }}
              style={{
                background: 'var(--navy)', color: 'white', border: 'none',
                borderRadius: 'var(--radius)', padding: '9px 18px',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
              }}
            >
              + Add Application
            </button>
          </div>

          {/* Status summary bar */}
          {!isLoading && apps.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
              {STATUSES.map(s => {
                const count = apps.filter(a => (optimisticStatus[a.id] || a.status) === s).length
                if (count === 0) return null
                const { bg, color, label } = STATUS_STYLE[s]
                return (
                  <span key={s} style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: bg, color }}>
                    {label} · {count}
                  </span>
                )
              })}
            </div>
          )}

          {isMobile ? mobileCards : desktopTable}

          {/* Footer */}
          <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
              <a href="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy</a>
              {' · '}
              <a href="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms</a>
              {' · '}
              © {new Date().getFullYear()} AI Resume Studio
            </p>
          </div>
        </div>
      </main>

      {/* Add / Edit modal */}
      {modal && (
        <AppModal
          initial={modal === 'edit' ? editing : null}
          onClose={() => { setModal(null); setEditing(null); setError('') }}
          onSave={handleSave}
          isSaving={createMut.isPending || updateMut.isPending}
        />
      )}
    </div>
  )
}

// ─── Shared icon button style ─────────────────────────────────────────────────

const iconBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', padding: 5,
  color: 'var(--text-muted)', borderRadius: 4, display: 'flex', alignItems: 'center',
  transition: 'color 0.12s, background 0.12s',
}
