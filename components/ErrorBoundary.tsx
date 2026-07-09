import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error information for debugging purposes
    console.error("Uncaught error:", error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center text-white font-sans">
          <div className="text-6xl mb-6">⚠️</div>
          <h1 className="text-3xl font-bold mb-4 text-red-400">
            Something went wrong
          </h1>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">
            An unexpected error occurred in the application. Please try reloading the page.
          </p>
          
          {this.state.error && (
            <div className="bg-black/50 p-4 rounded-lg text-left overflow-auto max-w-2xl w-full mb-8 border border-red-500/30">
              <p className="text-red-400 font-mono text-sm mb-2 font-bold">
                {this.state.error.toString()}
              </p>
              <pre className="text-slate-500 font-mono text-xs whitespace-pre-wrap">
                {this.state.errorInfo?.componentStack || this.state.error.stack}
              </pre>
            </div>
          )}

          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-500 transition-colors"
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
