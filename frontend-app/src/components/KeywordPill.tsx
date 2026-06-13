import type { CSSProperties } from 'react'

interface KeywordPillProps {
  word: string
  type: 'matched' | 'missing'
}

export function KeywordPill({ word, type }: KeywordPillProps) {
  const styles: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    background: type === 'matched' ? 'var(--success-light)' : 'var(--danger-light)',
    color: type === 'matched' ? 'var(--success)' : 'var(--danger)',
  }
  return (
    <span style={styles}>
      <span>{type === 'matched' ? '✓' : '✗'}</span>
      {word}
    </span>
  )
}
