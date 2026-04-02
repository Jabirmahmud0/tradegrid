import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 p-6 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle size={32} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-zinc-400 max-w-md mx-auto mb-8 font-mono text-xs">
                {this.state.error?.message || "An unexpected error occurred in the visualization engine."}
            </p>
            <button 
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-6 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-bold hover:bg-zinc-800 transition-all"
            >
                <RefreshCcw size={16} />
                Restart Engine
            </button>
        </div>
      );
    }

    return this.props.children;
  }
}
