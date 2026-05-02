import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-zinc-100">Something went wrong</h2>
              <p className="text-sm text-zinc-400">
                A critical rendering error occurred. Our team has been notified.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-zinc-950 rounded-lg p-4 border border-zinc-800 text-left overflow-x-auto">
                <p className="text-xs font-mono text-red-400 whitespace-pre-wrap break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="inline-flex items-center justify-center gap-2 bg-zinc-100 text-zinc-900 px-6 py-3 rounded-full font-semibold hover:bg-white transition-colors w-full"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
