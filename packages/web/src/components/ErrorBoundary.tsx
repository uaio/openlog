import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[openLog Web] Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.icon}>⚠️</div>
          <h2 style={styles.title}>Something went wrong</h2>
          <p style={styles.message}>{this.state.error?.message}</p>
          <button
            style={styles.button}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    padding: '2rem',
    textAlign: 'center' as const,
    backgroundColor: '#1a1a2e',
    color: '#eee',
  },
  icon: {
    fontSize: '3rem',
    marginBottom: '1rem',
  },
  title: {
    margin: '0 0 0.5rem',
    fontSize: '1.5rem',
  },
  message: {
    margin: '0 0 1.5rem',
    color: '#aaa',
    fontSize: '0.9rem',
    maxWidth: '400px',
    wordBreak: 'break-word' as const,
  },
  button: {
    padding: '0.6rem 1.5rem',
    fontSize: '0.9rem',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#4a9eff',
    color: '#fff',
    cursor: 'pointer',
  },
};
