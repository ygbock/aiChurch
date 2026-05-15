import React from 'react';
import { telemetry } from './telemetry';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  name: string; // Component or region name
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class TelemetryErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    telemetry.track({
      event: `UI_ERROR_${this.props.name}`,
      error: error.message,
      metadata: {
        componentStack: errorInfo.componentStack,
        name: this.props.name
      }
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <h3 className="font-semibold text-sm">Component Error ({this.props.name})</h3>
          <p className="text-xs mt-1">{this.state.error?.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
