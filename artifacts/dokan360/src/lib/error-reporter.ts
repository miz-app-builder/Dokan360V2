/**
 * Frontend Error Reporter — Sentry-ready architecture (TASK 8)
 *
 * Design: plug-in pattern — NO dynamic imports, zero Sentry coupling.
 *
 * When Sentry is installed and configured:
 *   1. Install @sentry/react: pnpm --filter @workspace/dokan360 add @sentry/react
 *   2. In main.tsx, init Sentry and call errorReporter.installSentry(Sentry)
 *
 * Without Sentry: errors are logged to console (dev) or silently dropped (prod).
 * This keeps the bundle clean with zero overhead when Sentry is not active.
 */

const isDev = import.meta.env.DEV;

export interface ErrorContext {
  userId?:    number | string;
  shopId?:    number | string;
  role?:      string;
  page?:      string;
  component?: string;
  [key: string]: unknown;
}

export type ErrorLevel = "fatal" | "error" | "warning" | "info" | "debug";

/**
 * Minimal Sentry interface — matches both @sentry/react and @sentry/browser.
 * Only the methods we actually call are declared here.
 */
export interface SentryAdapter {
  captureException(err: unknown): string;
  captureMessage(msg: string, level?: string): string;
  setUser(user: { id: string; role?: string } | null): void;
  withScope(cb: (scope: SentryScope) => void): void;
}

export interface SentryScope {
  setTag(key: string, value: string): void;
  setExtra(key: string, value: unknown): void;
  setContext(name: string, ctx: Record<string, unknown>): void;
}

class FrontendErrorReporter {
  private _sentry: SentryAdapter | null = null;
  private _initialized = false;

  /**
   * Called at startup. With no Sentry installed, this is a no-op.
   * Call installSentry() BEFORE init() to enable Sentry.
   */
  init(): void {
    if (this._initialized) return;
    this._initialized = true;

    if (isDev) {
      if (this._sentry) {
        console.info("[ErrorReporter] Sentry active.");
      } else {
        console.info(
          "[ErrorReporter] Running in log-only mode. " +
          "Call errorReporter.installSentry(Sentry) before init() to enable Sentry.",
        );
      }
    }
  }

  /**
   * Plug in a pre-initialized Sentry SDK instance.
   *
   * Usage in main.tsx when Sentry is installed:
   *   import * as Sentry from "@sentry/react";
   *   Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN, ... });
   *   errorReporter.installSentry(Sentry);
   *   errorReporter.init();
   */
  installSentry(sdk: SentryAdapter): void {
    this._sentry = sdk;
  }

  /**
   * Set authenticated user on all subsequent Sentry events.
   * Call after login; pass null on logout.
   */
  setUser(user: { id: number | string; role?: string } | null): void {
    if (!this._sentry) return;
    this._sentry.setUser(user ? { id: String(user.id), role: user.role } : null);
  }

  /**
   * Capture an error (exception) with structured context.
   */
  captureError(err: unknown, context: ErrorContext = {}): void {
    const { userId, shopId, role, ...extra } = context;

    if (this._sentry) {
      this._sentry.withScope((scope) => {
        if (role)   scope.setTag("user.role",  role);
        if (userId) scope.setContext("user",   { id: String(userId), role });
        if (shopId) scope.setContext("shop",   { id: String(shopId) });
        for (const [k, v] of Object.entries(extra)) {
          scope.setExtra(k, v);
        }
        this._sentry!.captureException(err);
      });
    }

    if (isDev) {
      console.error("[ErrorReporter]", err, context);
    }
  }

  /**
   * Capture a free-form message at the given severity level.
   */
  captureMessage(
    message: string,
    level: ErrorLevel = "info",
    context: ErrorContext = {},
  ): void {
    if (this._sentry) {
      this._sentry.withScope((scope) => {
        for (const [k, v] of Object.entries(context)) {
          scope.setExtra(k, v);
        }
        this._sentry!.captureMessage(message, level);
      });
    }

    if (isDev) {
      const fn = level === "error" || level === "fatal" ? console.error
               : level === "warning"                    ? console.warn
               :                                          console.info;
      fn("[ErrorReporter]", message, context);
    }
  }

  get isSentryActive(): boolean {
    return this._sentry !== null;
  }
}

export const errorReporter = new FrontendErrorReporter();
