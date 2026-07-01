import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

export type Tab = 'dashboard' | 'scan' | 'optimize' | 'cover-letter' | 'linkedin' | 'summary' | 'tools'

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

export function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
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
      <div style={{ fontSize: 44, marginBottom: 16 }}>🔒</div>
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
