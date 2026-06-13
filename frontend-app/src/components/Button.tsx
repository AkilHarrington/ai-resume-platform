import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontWeight: 600,
    borderRadius: 'var(--radius)',
    transition: 'all var(--transition)',
    border: '2px solid transparent',
    width: fullWidth ? '100%' : undefined,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    whiteSpace: 'nowrap',
  }

  const sizes = {
    sm: { padding: '6px 14px', fontSize: 13 },
    md: { padding: '10px 20px', fontSize: 15 },
    lg: { padding: '14px 28px', fontSize: 16 },
  }

  const variants: Record<string, CSSProperties> = {
    primary: { background: 'var(--emerald)', color: 'white', borderColor: 'var(--emerald)' },
    secondary: { background: 'var(--navy)', color: 'white', borderColor: 'var(--navy)' },
    outline: { background: 'transparent', color: 'var(--navy)', borderColor: 'var(--navy)' },
    ghost: { background: 'transparent', color: 'var(--charcoal)', borderColor: 'transparent' },
    danger: { background: 'var(--danger)', color: 'white', borderColor: 'var(--danger)' },
  }

  return (
    <button
      disabled={disabled || loading}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      {...props}
    >
      {loading && (
        <span style={{
          width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent',
          borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite',
        }} />
      )}
      {children}
    </button>
  )
}
