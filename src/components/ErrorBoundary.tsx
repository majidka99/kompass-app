import type { ErrorInfo } from 'react';
import React from 'react';

// Add type declaration for Vite's import.meta.env
declare global {
  interface ImportMeta {
    env: {
      DEV: boolean;
      PROD: boolean;
      MODE: string;
      [key: string]: string | boolean | undefined;
    };
  }
}

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
};

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '72px', marginBottom: '20px' }}>⚠️</div>
          <h2>Etwas ist schiefgelaufen</h2>
          <p style={{ marginBottom: '30px', color: '#d0d0d0' }}>
            Ein unerwarteter Fehler ist aufgetreten. Bitte lade die Seite neu oder kehre zur
            Startseite zurück.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#abebc6',
                color: '#2f4f4f',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              🔄 Seite neu laden
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              🏠 Zur Startseite
            </button>
          </div>

          {/* Show error details in development */}
          {import.meta.env.DEV && this.state.error && (
            <details style={{ marginTop: '30px', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', color: '#abebc6' }}>
                Fehlerdetails (nur in Entwicklung sichtbar)
              </summary>
              <pre
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  padding: '16px',
                  borderRadius: '8px',
                  marginTop: '10px',
                  fontSize: '12px',
                  overflow: 'auto',
                  color: '#ff6b6b',
                }}
              >
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
