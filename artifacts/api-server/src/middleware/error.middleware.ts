import { Request, Response, NextFunction } from "express";
import { AppError } from "../common/errors";
import { logger } from "../common/logger";
import { errorReporter } from "../common/error-reporter";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const log = (req as { log?: typeof logger }).log ?? logger;

  // ─── Known operational errors (AppError subclasses) ───────────────────────
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      // 5xx server errors → log + report to error monitoring
      log.error(
        { err, requestId: req.id, method: req.method, url: req.url },
        `server error: ${err.message}`,
      );
      errorReporter.captureError(err, {
        requestId: req.id as string | undefined,
        userId:    req.authUser?.id,
        shopId:    req.authUser?.shopId,
        role:      req.authUser?.role,
        method:    req.method,
        url:       req.url,
      });
    } else {
      // 4xx client errors → warn level only, not reported to Sentry
      log.warn(
        { statusCode: err.statusCode, message: err.message, requestId: req.id },
        `client error: ${err.message}`,
      );
    }
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // ─── Unexpected / unhandled errors ────────────────────────────────────────
  log.error(
    {
      err,
      requestId: req.id,
      method:    req.method,
      url:       req.url,
      userId:    req.authUser?.id,
      shopId:    req.authUser?.shopId,
    },
    "unhandled error",
  );

  errorReporter.captureError(err, {
    requestId: req.id as string | undefined,
    userId:    req.authUser?.id,
    shopId:    req.authUser?.shopId,
    role:      req.authUser?.role,
    method:    req.method,
    url:       req.url,
  });

  res.status(500).json({ error: "সার্ভারে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।" });
}
