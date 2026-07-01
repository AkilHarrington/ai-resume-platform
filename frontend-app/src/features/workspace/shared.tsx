import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

// ─── Reusable SVG icons (no emoji) ───────────────────────────────────────────

export function IconBars() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect x="2" y="24" width="10" height="14" rx="2" fill="currentColor" opacity="0.35"/>
      <rect x="15" y="15" width="10" height="23" rx="2" fill="currentColor" opacity="0.6"/>
      <rect x="28" y="7"  width="10" height="31" rx="2" fill="currentColor" opacity="0.9"/>
    </svg>
  )
}

export function IconEdit() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 34L26 14L31 19L11 39L6 34Z"/>
      <path d="M26 14L30 10L34 14L30 18"/>
      <path d="M6 34L4 38L8 36Z" fill="currentColor" stroke="none"/>
    </svg>
  )
}

export function IconDocument() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <rect x="7" y="4" width="26" height="32" rx="3"/>
      <path d="M13 14h14M13 20h14M13 26h8"/>
    </svg>
  )
}

export function IconPerson() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <circle cx="20" cy="13" r="7"/>
      <path d="M6 37c0-7.7 6.3-14 14-14s14 6.3 14 14"/>
    </svg>
  )
}

export function IconLock() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <rect x="6" y="16" width="24" height="16" rx="3"/>
      <path d="M12 16V12a6 6 0 0112 0v4"/>
    </svg>
  )
}

export function IconSun() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
      <circle cx="9" cy="9" r="3.5"/>
      <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.2 3.2l1.4 1.4M13.4 13.4l1.4 1.4M3.2 14.8l1.4-1.4M13.4 4.6l1.4-1.4"/>
    </svg>
  )
}

export function IconMoon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
      <path d="M14.5 10.5A6.5 6.5 0 017 3a6.5 6.5 0 100 12 6.5 6.5 0 007.5-4.5z"/>
    </svg>
  )
}

export function IconMail() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="6" y="12" width="36" height="26" rx="3"/>
      <path d="M6 16l18 12 18-12"/>
    </svg>
  )
}

export function IconWarning() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M18 4L3 32h30L18 4z"/>
      <path d="M18 16v7M18 27v1"/>
    </svg>
  )
}

export type Tab = 'dashboard' | 'scan' | 'optimize' | 'cover-letter' | 'linkedin' | 'interview' | 'summary' | 'tools'

export function LoadingCard({ message }: { message: string }) {
  return (
    <div style={{
      background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)', padding: '60px 32px',
      textAlign: 'center', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)',
    }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--navy)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 20px' }} />
      <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>{message}</p>
    </div>
  )
}

export function EmptyState({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-muted)', marginBottom: 20 }}>{icon}</div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 360, margin: '0 auto' }}>{subtitle}</p>
    </div>
  )
}

export function EmptyCard({ children }: { children: ReactNode }) {
  return (
    <div style={{ background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)', padding: '32px 28px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
      {children}
    </div>
  )
}

export function UpgradePrompt({ feature, description }: { feature: string; description: string }) {
  const navigate = useNavigate()
  return (
    <div style={{
      background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)', padding: '56px 32px',
      textAlign: 'center', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-muted)', marginBottom: 16 }}><IconLock /></div>
      <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 10 }}>{feature}</h3>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 380, margin: '0 auto 28px' }}>{description}</p>
      <button
        onClick={() => navigate('/pricing')}
        style={{
          background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 'var(--radius)',
          padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}
      >
        Upgrade to Pro
      </button>
    </div>
  )
}
