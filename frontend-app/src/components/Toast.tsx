import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 9999,
        pointerEvents: 'none',
      }}>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast }: { toast: Toast }) {
  const icon = toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'
  const color = toast.type === 'success' ? 'var(--emerald)' : toast.type === 'error' ? 'var(--danger)' : 'var(--navy)'

  return (
    <div style={{
      background: 'white',
      border: `1px solid ${color}`,
      borderLeft: `4px solid ${color}`,
      borderRadius: 'var(--radius)',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
      minWidth: 220,
      maxWidth: 360,
      pointerEvents: 'auto',
      animation: 'slideInRight 0.25s ease',
    }}>
      <span style={{ color, fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 13, color: 'var(--charcoal)', fontWeight: 500, lineHeight: 1.4 }}>{toast.message}</span>
    </div>
  )
}
