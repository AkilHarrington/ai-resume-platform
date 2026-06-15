import type { User } from '@supabase/supabase-js'
import type { Tab } from './shared'

interface SidebarProps {
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
  resumeText: string
  resumeFileName: string
  isPro: boolean
  user: User | null
  theme: string
  toggleTheme: () => void
  onSignOut: () => void
  onUploadClick: () => void
  isUploading: boolean
}

const NAV_ITEMS: { id: Tab; label: string; icon: string; pro?: boolean }[] = [
  { id: 'dashboard', label: 'Dashboard',    icon: '⊞' },
  { id: 'scan',      label: 'ATS Scan',     icon: '◎' },
  { id: 'optimize',  label: 'Optimize',     icon: '✦', pro: true },
  { id: 'cover-letter', label: 'Cover Letter', icon: '✉', pro: true },
  { id: 'linkedin',  label: 'LinkedIn',     icon: '◈', pro: true },
]

export function Sidebar({
  activeTab, setActiveTab,
  resumeText, resumeFileName,
  isPro, user, theme, toggleTheme, onSignOut,
  onUploadClick, isUploading,
}: SidebarProps) {
  const wordCount = resumeText ? resumeText.split(/\s+/).filter(Boolean).length : 0

  return (
    <aside style={{
      width: 224, flexShrink: 0,
      background: 'var(--surface-0)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      height: '100vh', overflow: 'hidden',
    }}>

      {/* ── Logo row ─────────────────────────────────────────── */}
      <div style={{
        height: 56, display: 'flex', alignItems: 'center',
        padding: '0 14px', gap: 8, flexShrink: 0,
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ flex: 1 }}>
          <span style={{
            fontWeight: 900, fontSize: 13, color: 'var(--text-heading)',
            letterSpacing: '-0.02em', lineHeight: 1.2,
          }}>
            AI Resume<br />Studio
          </span>
        </div>
      </div>

      {/* ── Resume chip ──────────────────────────────────────── */}
      <div style={{ padding: '10px 10px 0' }}>
        <button
          onClick={onUploadClick}
          disabled={isUploading}
          title={resumeText ? 'Click to change resume' : 'Upload your resume'}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            background: resumeText ? 'var(--success-light)' : 'var(--surface-1)',
            border: `1px solid ${resumeText ? 'var(--success)' : 'var(--border-input)'}`,
            borderRadius: 8, padding: '8px 10px', cursor: isUploading ? 'default' : 'pointer',
            textAlign: 'left', transition: 'all 0.15s ease',
          }}
        >
          <span style={{ fontSize: 16, flexShrink: 0 }}>
            {isUploading ? '⏳' : resumeText ? '📄' : '⬆'}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            {isUploading ? (
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Reading file…</div>
            ) : resumeText ? (
              <>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: 'var(--success)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {resumeFileName || 'Resume loaded'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{wordCount} words · click to change</div>
              </>
            ) : (
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                Upload Resume
              </div>
            )}
          </div>
        </button>
      </div>

      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav style={{
        flex: 1, overflow: 'auto',
        padding: '6px 10px',
        display: 'flex', flexDirection: 'column', gap: 1,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.08em',
          padding: '10px 4px 4px',
        }}>
          Workspace
        </div>

        {NAV_ITEMS.map(item => {
          const isActive = activeTab === item.id
          const isLocked = !!(item.pro && !isPro)
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 10px', borderRadius: 6, border: 'none',
                cursor: 'pointer', textAlign: 'left', width: '100%',
                background: isActive ? 'var(--navy)' : 'transparent',
                color: isActive ? 'white' : isLocked ? 'var(--text-muted)' : 'var(--text-primary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: 13, transition: 'background 0.12s ease',
              }}
              onMouseEnter={e => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-1)'
              }}
              onMouseLeave={e => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
              }}
            >
              <span style={{ width: 18, textAlign: 'center', fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {isLocked && (
                <span style={{
                  fontSize: 9, fontWeight: 800,
                  color: isActive ? 'rgba(255,255,255,0.8)' : 'var(--emerald)',
                  background: isActive ? 'rgba(255,255,255,0.15)' : 'var(--success-light)',
                  padding: '1px 5px', borderRadius: 999, letterSpacing: '0.04em',
                }}>PRO</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* ── Footer ───────────────────────────────────────────── */}
      <div style={{
        padding: '10px', borderTop: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0,
      }}>
        {/* Avatar + email */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 2px' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--navy)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 11, color: 'white', fontWeight: 700 }}>
              {user?.email?.[0]?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: 'var(--text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user?.email ?? ''}
            </div>
            <div style={{ fontSize: 10, color: isPro ? 'var(--success)' : 'var(--text-muted)' }}>
              {isPro ? '✓ Pro plan' : 'Free plan'}
            </div>
          </div>
        </div>

        {/* Theme + sign out */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              width: 36, background: 'var(--surface-1)', border: '1px solid var(--border)',
              borderRadius: 6, padding: '5px 0', cursor: 'pointer', fontSize: 13,
            }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            onClick={onSignOut}
            style={{
              flex: 1, background: 'var(--surface-1)', border: '1px solid var(--border)',
              borderRadius: 6, padding: '5px 8px', cursor: 'pointer',
              fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)',
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  )
}
