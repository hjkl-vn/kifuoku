import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.content}>
            <h1 style={styles.title}>Something went wrong</h1>
            <p style={styles.message}>
              An unexpected error occurred. Please try reloading the page.
            </p>
            <div style={styles.buttons}>
              <button onClick={this.handleReset} style={styles.button}>
                Try Again
              </button>
              <button onClick={this.handleReload} style={styles.buttonPrimary}>
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: '20px'
  },
  content: {
    textAlign: 'center',
    maxWidth: '400px'
  },
  title: {
    fontSize: '1.5rem',
    marginBottom: '1rem'
  },
  message: {
    color: '#888',
    marginBottom: '1.5rem'
  },
  buttons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center'
  },
  button: {
    padding: '10px 20px',
    border: '1px solid #444',
    borderRadius: '4px',
    backgroundColor: 'transparent',
    color: '#fff',
    cursor: 'pointer'
  },
  buttonPrimary: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#2e7d32',
    color: '#fff',
    cursor: 'pointer'
  }
}
