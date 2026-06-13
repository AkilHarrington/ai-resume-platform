import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  tabName?: string
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Something went wrong.' }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.tabName}]`, error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background: 'white', borderRadius: 'var(--radius-lg)', padding: 32,
          boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)',
          textAlign: 'center', marginTop: 16,
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>
            {this.props.tabName ? `${this.props.tabName} ran into a problem` : 'Something went wrong'}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 20, maxWidth: 360, margin: '0 auto 20px' }}>
            {this.state.message}
          </p>
          <button
            onClick={this.handleReset}
            style={{
              background: 'var(--navy)', color: 'white', border: 'none',
              borderRadius: 'var(--radius)', padding: '10px 24px',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
