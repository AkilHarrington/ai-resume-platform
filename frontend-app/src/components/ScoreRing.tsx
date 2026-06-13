import { useState, useEffect } from 'react'

interface ScoreRingProps {
  score: number
  size?: number
  label?: string
  animate?: boolean
}

export function ScoreRing({ score, size = 120, label = 'ATS Score', animate = true }: ScoreRingProps) {
  const [displayed, setDisplayed] = useState(animate ? 0 : score)

  useEffect(() => {
    if (!animate) { setDisplayed(score); return }
    setDisplayed(0)
    let raf: number
    let start: number | null = null
    const duration = 900

    function step(ts: number) {
      if (start === null) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setDisplayed(Math.round(score * eased))
      if (progress < 1) raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [score, animate])

  const r = (size - 16) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 75 ? 'var(--emerald)' : score >= 55 ? 'var(--warning)' : 'var(--danger)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--gray-100)" strokeWidth="8" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
        />
        <text
          x={size / 2} y={size / 2}
          textAnchor="middle" dominantBaseline="middle"
          style={{ transform: 'rotate(90deg)', transformOrigin: `${size / 2}px ${size / 2}px` }}
          fill={color} fontSize={size * 0.22} fontWeight={800} fontFamily="var(--font-sans)"
        >
          {displayed}
        </text>
      </svg>
      {label && (
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
      )}
    </div>
  )
}
