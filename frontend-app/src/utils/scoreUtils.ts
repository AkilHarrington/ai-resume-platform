// Shared score-to-percentile mapping — single source of truth used by
// OptimizeTab (personalized banner) and DashboardTab (completion card).

export function scoreToPercentile(score: number): string {
  if (score >= 92) return 'top 5%'
  if (score >= 85) return 'top 10%'
  if (score >= 80) return 'top 20%'
  if (score >= 75) return 'top 30%'
  if (score >= 68) return 'top 40%'
  if (score >= 60) return 'top 50%'
  if (score >= 50) return 'bottom 40%'
  return 'bottom 25%'
}

// Human-readable label for UI display (e.g. "Top 10% of applicants")
export function scoreToPercentileLabel(score: number): string {
  const p = scoreToPercentile(score)
  return p.charAt(0).toUpperCase() + p.slice(1) + ' of applicants'
}
