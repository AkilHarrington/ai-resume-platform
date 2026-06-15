// ─── Shimmer keyframe injected once ──────────────────────────────────────────
// globals.css already has @keyframes shimmer — we rely on that.
// If it's missing, add:  @keyframes shimmer { from{background-position:-200px 0} to{background-position:calc(200px + 100%) 0} }

const SHIMMER: React.CSSProperties = {
  background: 'linear-gradient(90deg, var(--surface-1) 25%, var(--surface-2) 50%, var(--surface-1) 75%)',
  backgroundSize: '400px 100%',
  animation: 'shimmer 1.4s ease-in-out infinite',
  borderRadius: 6,
}

function Bone({ w, h, style }: { w?: number | string; h?: number; style?: React.CSSProperties }) {
  return (
    <div style={{ ...SHIMMER, width: w ?? '100%', height: h ?? 14, borderRadius: 6, flexShrink: 0, ...style }} />
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--surface-0)', borderRadius: 12, padding: 24,
      border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
      display: 'flex', flexDirection: 'column', gap: 14,
      ...style,
    }}>
      {children}
    </div>
  )
}

// ─── Scan skeleton ────────────────────────────────────────────────────────────
export function ScanSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header card */}
      <Card>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          {/* Score ring placeholder */}
          <div style={{ ...SHIMMER, width: 100, height: 100, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Bone w="55%" h={20} />
            <Bone w="80%" h={13} />
            <Bone w="65%" h={13} />
          </div>
        </div>
      </Card>

      {/* Two-column body */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
        {/* Left: breakdown */}
        <Card>
          <Bone w="40%" h={14} />
          {[85, 65, 90, 55, 70, 60].map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Bone w="50%" h={12} />
                <Bone w={28} h={12} />
              </div>
              <div style={{ ...SHIMMER, height: 7, borderRadius: 999 }} />
            </div>
          ))}
        </Card>

        {/* Right: verdict + keywords */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <Bone w="30%" h={12} />
            <Bone h={13} />
            <Bone w="90%" h={13} />
            <Bone w="75%" h={13} />
          </Card>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Card>
              <Bone w="40%" h={13} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <Bone key={i} w={[60, 72, 50, 80, 55, 66, 48, 70][i]} h={24} style={{ borderRadius: 999 }} />
                ))}
              </div>
            </Card>
            <Card>
              <Bone w="40%" h={13} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Bone key={i} w={[58, 70, 50, 62, 76, 52][i]} h={24} style={{ borderRadius: 999 }} />
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Optimize skeleton ────────────────────────────────────────────────────────
export function OptimizeSkeleton({ statusMessage }: { statusMessage?: string } = {}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {statusMessage && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--emerald)', display: 'inline-block', animation: 'pulse 1s ease-in-out infinite' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{statusMessage}</span>
        </div>
      )}
      {/* Score delta card */}
      <Card>
        <Bone w="35%" h={18} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginTop: 8 }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Bone w={12} h={12} style={{ borderRadius: 2 }} />
            <div style={{ ...SHIMMER, width: 90, height: 90, borderRadius: '50%' }} />
          </div>
          <Bone w={32} h={32} style={{ borderRadius: '50%' }} />
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Bone w={12} h={12} style={{ borderRadius: 2 }} />
            <div style={{ ...SHIMMER, width: 90, height: 90, borderRadius: '50%' }} />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 20 }}>
            <Bone w="50%" h={28} />
            <Bone w="70%" h={13} />
          </div>
        </div>
      </Card>

      {/* Resume text card */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Bone w="30%" h={16} />
          <div style={{ display: 'flex', gap: 6 }}>
            {[60, 50, 70].map((w, i) => <Bone key={i} w={w} h={28} style={{ borderRadius: 6 }} />)}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
          {[100, 85, 90, 70, 95, 60, 80, 75, 88, 65].map((w, i) => (
            <Bone key={i} w={`${w}%`} h={13} />
          ))}
        </div>
      </Card>
    </div>
  )
}

// ─── Cover letter skeleton ────────────────────────────────────────────────────
export function CoverLetterSkeleton() {
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Bone w="30%" h={18} />
        <div style={{ display: 'flex', gap: 8 }}>
          <Bone w={60} h={28} style={{ borderRadius: 6 }} />
          <Bone w={80} h={28} style={{ borderRadius: 6 }} />
          <Bone w={90} h={28} style={{ borderRadius: 6 }} />
        </div>
      </div>
      {/* Letter body lines */}
      <div style={{ background: 'var(--surface-1)', borderRadius: 8, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Bone w="30%" h={13} />
        <Bone w="20%" h={13} />
        <div style={{ height: 12 }} />
        <Bone w="45%" h={14} style={{ marginBottom: 4 }} />
        {[95, 88, 92, 70, 82, 90].map((w, i) => <Bone key={i} w={`${w}%`} h={13} />)}
        <div style={{ height: 8 }} />
        {[90, 85, 78, 92, 65].map((w, i) => <Bone key={i} w={`${w}%`} h={13} />)}
        <div style={{ height: 8 }} />
        {[88, 72, 60].map((w, i) => <Bone key={i} w={`${w}%`} h={13} />)}
        <div style={{ height: 12 }} />
        <Bone w="25%" h={13} />
        <Bone w="35%" h={13} />
      </div>
    </Card>
  )
}

// ─── LinkedIn skeleton ────────────────────────────────────────────────────────
export function LinkedInSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Bone w="30%" h={15} />
          <Bone w={60} h={28} style={{ borderRadius: 6 }} />
        </div>
        <div style={{ background: 'var(--surface-1)', borderRadius: 8, padding: '14px 16px' }}>
          <Bone w="80%" h={18} />
        </div>
        <Bone w="15%" h={11} />
      </Card>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Bone w="25%" h={15} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Bone w={60} h={28} style={{ borderRadius: 6 }} />
            <Bone w={90} h={28} style={{ borderRadius: 6 }} />
          </div>
        </div>
        <div style={{ background: 'var(--surface-1)', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[90, 82, 88, 70, 78, 92, 65, 75].map((w, i) => <Bone key={i} w={`${w}%`} h={13} />)}
        </div>
      </Card>
    </div>
  )
}
