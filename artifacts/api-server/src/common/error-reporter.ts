/**
 * Centralized Error Reporter — Sentry-ready architecture (TASK 8)
 *
 * Design principles:
 *  - Single capture surface: all errors flow through this module.
 *  - Zero Sentry coupling at build time: Sentry is an optional peer dep loaded
 *    dynamically only when SENTRY_DSN is present at runtime.
 *  - Graceful no-op in development / when DSN is absent.
 *  - Compatible with @sentry/node API surface so adding Sentry later is a
 *    one-line change (set SENTRY_DSN secret → auto-activates).
 */

import { env, isProduction } from "../config/env";
import { logger } from "./logger";

// ─── Context types (mirror Sentry's shape) ─────────────────────────────────

export interface ErrorContext {
  requestId?:  string;
  userId?:     number | string;
  shopId?:     number | string;
  role?:       string;
  method?:     string;
  url?:        string;
  [key: string]: unknown;
}

export type ErrorLevel = "fatal" | "error" | "warning" | "info" | "debug";

// ─── Internal Sentry type shim ─────────────────────────────────────────────
// We don't import @sentry/node at the top level to keep the bundle clean when
// Sentry is not installed.  The dynamic import below assigns to this variable.

type SentrySDK = {
  init(options: Record<string, unknown>): void;
  captureException(err: unknown, ctx?: Record<string, unknown>): string;
  captureMessage(msg: string, level?: string): string;
  setUser(user: { id: string; role?: string } | null): void;
  withScope(cb: (scope: {
    setTag(key: string, value: string): void;
    setExtra(key: string, value: unknown): void;
    setContext(name: string, ctx: Record<string, unknown>): void;
  }) => void): void;
};

// ─── ErrorReporter class ────────────────────────────────────────────────────

class ErrorReporter {
  private _sentry: SentrySDK | null = null;
  private _initialized = false;

  /**
   * Initialize the reporter.
   * Call once at server startup (before any request handling).
   */
  async init(): Promise<void> {
    if (this._initialized) return;
    this._initialized = true;

    const dsn = env.SENTRY_DSN;
    if (!dsn) {
      logger.info(
        "ErrorReporter: SENTRY_DSN not set — running in log-only mode." +
        (isProduction ? " Set SENTRY_DSN to enable Sentry in production." : ""),
      );
      return;
    }

    try {
      // @ts-expect-error — @sentry/node is an optional peer dependency; not listed
      // in package.json. Install with: pnpm --filter @workspace/api-server add @sentry/node
      const Sentry = await import(/* webpackIgnore: true */ "@sentry/node") as unknown as { default: SentrySDK } | SentrySDK;
      const sdk: SentrySDK = "default" in Sentry ? (Sentry as { default: SentrySDK }).default : (Sentry as SentrySDK);
      sdk.init({
        dsn,
        environment:  env.SENTRY_ENVIRONMENT ?? env.NODE_ENV,
        release:      env.SENTRY_RELEASE,
        tracesSampleRate: isProduction ? 0.1 : 0,
        maxBreadcrumbs: 50,
        attachStacktrace: true,
      });
      this._sentry = sdk;
      logger.info(
        { environment: env.SENTRY_ENVIRONMENT ?? env.NODE_ENV },
        "ErrorReporter: Sentry initialized",
      );
    } catch {
      logger.warn(
        "ErrorReporter: @sentry/node not installed — logging errors locally only. " +
        "Run `pnpm --filter @workspace/api-server add @sentry/node` to enable Sentry.",
      );
    }
  }

  /**
   * Capture an error (exception) with optional structured context.
   * - 5xx server errors → always captured
   * - 4xx client errors → NOT captured (expected operational errors)
   *
   * @param err     The error object to capture.
   * @param context Structured key-value context attached to the event.
   */
  captureError(err: unknown, context: ErrorContext = {}): void {
    const { requestId, userId, shopId, role, method, url, ...extra } = context;

    if (this._sentry) {
      this._sentry.withScope((scope) => {
        if (requestId) scope.setTag("request_id", requestId);
        if (method)    scope.setTag("http.method",  method);
        if (url)       scope.setTag("http.url",     url);
        if (role)      scope.setTag("user.role",    role);
        if (userId)    scope.setContext("user", { id: String(userId), role });
        if (shopId)    scope.setContext("shop", { id: String(shopId) });
        for (const [k, v] of Object.entries(extra)) {
          scope.setExtra(k, v);
        }
        this._sentry!.captureException(err);
      });
    }

    logger.error(
      { err, requestId, userId, shopId, role, method, url, ...extra },
      err instanceof Error ? err.message : "Unknown error captured",
    );
  }

  /**
   * Capture a free-form message (non-exception) with a severity level.
   */
  captureMessage(
    message: string,
    level: ErrorLevel = "info",
    context: ErrorContext = {},
  ): void {
    if (this._sentry) {
      this._sentry.withScope((scope) => {
        const { requestId, userId, shopId, role, ...extra } = context;
        if (requestId) scope.setTag("request_id", requestId);
        if (role)      scope.setTag("user.role",  role);
        if (userId)    scope.setContext("user",   { id: String(userId), role });
        if (shopId)    scope.setContext("shop",   { id: String(shopId) });
        for (const [k, v] of Object.entries(extra)) {
          scope.setExtra(k, v);
        }
        this._sentry!.captureMessage(message, level);
      });
    }

    const pinoLevel = level === "warning" ? "warn" : level;
    (logger[pinoLevel as keyof typeof logger] as (ctx: unknown, msg: string) => void)(
      context,
      message,
    );
  }

  /**
   * Capture a fatal process-level error (uncaughtException / unhandledRejection).
   * Flushes Sentry before the process exits.
   */
  async captureFatal(err: unknown, origin: string): Promise<void> {
    logger.fatal({ err, origin }, `Fatal process error: ${origin}`);

    if (this._sentry) {
      try {
        this._sentry.captureException(err);
      } catch {
        // Best-effort: ignore secondary errors during fatal handling
      }
    }
  }

  /** True if Sentry SDK was successfully loaded and initialized. */
  get isSentryActive(): boolean {
    return this._sentry !== null;
  }
}

// ─── Singleton ──────────────────────────────────────────────────────────────

export const errorReporter = new ErrorReporter();
