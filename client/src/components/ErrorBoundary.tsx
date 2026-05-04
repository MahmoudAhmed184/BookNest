import { Component, type ErrorInfo, type ReactNode } from "react";
import ErrorState from "./ErrorState";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Unexpected UI error:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorState
          title="This page hit a snag"
          message="Refresh the view and try again. Your reading data is still safe."
          onRetry={() => this.setState({ hasError: false })}
          className="my-12"
        />
      );
    }

    return this.props.children;
  }
}
