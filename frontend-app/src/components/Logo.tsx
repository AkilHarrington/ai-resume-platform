interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'light' | 'dark'
}

export function Logo({ size = 'md', variant = 'dark' }: LogoProps) {
  const sizes = { sm: { icon: 28, text: 16 }, md: { icon: 36, text: 20 }, lg: { icon: 48, text: 26 } }
  const s = sizes[size]
  const textColor = variant === 'light' ? '#FFFFFF' : '#1A365D'
  const accentColor = '#2F855A'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width={s.icon} height={s.icon} viewBox="0 0 36 36" fill="none">
        <rect width="36" height="36" rx="9" fill="#1A365D" />
        <rect x="8" y="9" width="20" height="2.5" rx="1.25" fill="white" opacity="0.9" />
        <rect x="8" y="14" width="14" height="2.5" rx="1.25" fill="white" opacity="0.7" />
        <rect x="8" y="19" width="16" height="2.5" rx="1.25" fill="white" opacity="0.7" />
        <rect x="8" y="24" width="11" height="2.5" rx="1.25" fill="white" opacity="0.5" />
        <circle cx="27" cy="25" r="5" fill={accentColor} />
        <path d="M24.5 25l1.5 1.5 2.5-2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <span style={{ fontSize: s.text, fontWeight: 800, color: textColor, letterSpacing: '-0.02em' }}>
          AI Resume
        </span>
        <span style={{ fontSize: s.text * 0.75, fontWeight: 600, color: accentColor, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Studio
        </span>
      </div>
    </div>
  )
}
