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
        <div className="flex items-center justify-center min-h-screen bg-neutral-900 text-white p-5">
          <div className="text-center max-w-md">
            <h1 className="text-2xl mb-4">Something went wrong</h1>
            <p className="text-neutral-500 mb-6">
              An unexpected error occurred. Please try reloading the page.
            </p>
            <div className="flex gap-2.5 justify-center">
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 border border-neutral-700 rounded bg-transparent text-white cursor-pointer hover:bg-neutral-800"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-5 py-2.5 border-none rounded bg-success text-white cursor-pointer hover:bg-success/90"
              >
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
