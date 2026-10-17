import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage =
        this.state.error?.message && typeof this.state.error.message === 'string'
          ? this.state.error.message
          : 'An unexpected application error occurred.';

      return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-card p-8 sm:p-10 space-y-6 text-center animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Something went wrong</h1>
              <p className="text-xs text-slate-500 leading-relaxed">
                The application encountered an unexpected issue while rendering this page.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs font-mono text-slate-700 break-words max-h-32 overflow-y-auto">
              {errorMessage}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="outline"
                className="w-full py-2.5 flex items-center justify-center gap-2 text-xs"
                onClick={this.handleGoHome}
              >
                <Home className="w-4 h-4" />
                Return Home
              </Button>
              <Button
                className="w-full py-2.5 flex items-center justify-center gap-2 text-xs shadow-md shadow-rose-200"
                onClick={this.handleReload}
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
