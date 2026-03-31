import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('App crashed:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'sans-serif', padding: 24, background: '#f8fafc',
        }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: '#0f172a' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#475569', marginBottom: 20, textAlign: 'center', maxWidth: 480 }}>
            The app crashed. Check the browser console (F12) for details.
          </p>
          <pre style={{
            background: '#fee2e2', color: '#dc2626', padding: '12px 16px',
            borderRadius: 8, fontSize: 13, maxWidth: 600, overflowX: 'auto', marginBottom: 24,
          }}>
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#0284c7', color: 'white', border: 'none',
              borderRadius: 8, padding: '10px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
