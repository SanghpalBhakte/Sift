"use client";

import React from "react";

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("UI render error caught by AppErrorBoundary:", {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div
            role="alert"
            style={{
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <h2 style={{ marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ margin: 0, opacity: 0.8 }}>
              This part of Sweep couldn’t render properly. Refresh the page or
              navigate back and try again.
            </p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
