import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { errorReporter } from "@/lib/error-reporter";
import { Button } from "@/components/ui/button";

interface Props {
  children:   ReactNode;
  fallback?:  ReactNode;
  onError?:   (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError:   boolean;
  error:      Error | null;
}

/**
 * React Error Boundary — catches render-time errors in the component tree.
 *
 * - Reports the error to errorReporter (Sentry when configured, console otherwise).
 * - Renders a Bengali-language fallback UI instead of a white screen.
 * - "আবার চেষ্টা করুন" button resets the boundary so the user can retry.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomeComponent />
 *   </ErrorBoundary>
 *
 *   Or with a custom fallback:
 *   <ErrorBoundary fallback={<MyFallback />}>
 *     <SomeComponent />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    errorReporter.captureError(error, {
      component:      info.componentStack ?? undefined,
      page:           window.location.pathname,
    });
    this.props.onError?.(error, info);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return <DefaultFallback error={this.state.error} onReset={this.handleReset} />;
  }
}

function DefaultFallback({
  error,
  onReset,
}: {
  error: Error | null;
  onReset: () => void;
}) {
  const isDev = import.meta.env.DEV;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-foreground">
            কিছু একটা ভুল হয়েছে
          </h1>
          <p className="text-sm text-muted-foreground">
            পেইজটি লোড করতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।
            সমস্যা থাকলে পেইজ রিফ্রেশ করুন।
          </p>
        </div>

        {isDev && error && (
          <div className="text-left rounded-xl bg-muted/60 border border-border p-3 text-xs font-mono text-destructive break-all max-h-32 overflow-auto">
            {error.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button onClick={onReset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            আবার চেষ্টা করুন
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            পেইজ রিফ্রেশ করুন
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ErrorBoundary;
