import helmet from "helmet";
import { type RequestHandler, type Request, type Response, type NextFunction } from "express";
import { isProduction, isDevelopment, getSupabaseHost } from "../config/env";
import { logger } from "../common/logger";

// ─── Resolve Supabase CSP domains ─────────────────────────────────────────────
// We use the configured SUPABASE_URL to derive the exact hostname so that the
// CSP connect-src is as tight as possible (e.g. "abcdefgh.supabase.co") while
// still allowing the Supabase Realtime WebSocket connection.
const supabaseHost = getSupabaseHost();

// connectSrc entries for Supabase REST + Auth + Realtime (wss)
const supabaseConnectSrc: string[] = supabaseHost
  ? [
      `https://${supabaseHost}`,
      `wss://${supabaseHost}`,       // Supabase Realtime WebSocket
      "https://*.supabase.co",       // CDN / edge functions fallback
      "wss://*.supabase.co",
    ]
  : [
      "https://*.supabase.co",
      "wss://*.supabase.co",
    ];

// ─── Helmet (security headers) ────────────────────────────────────────────────
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],

      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        ...(isDevelopment ? ["'unsafe-eval'"] : []),
      ],

      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
      ],

      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "data:",
      ],

      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https://*.supabase.co",   // future: product/shop image storage
      ],

      connectSrc: [
        "'self'",
        ...supabaseConnectSrc,
      ],

      frameSrc:  ["'none'"],
      objectSrc: ["'none'"],

      upgradeInsecureRequests: isProduction ? [] : null,
    },
  },

  hsts: isProduction
    ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
    : false,

  // Disable COEP — Supabase Realtime uses cross-origin resources
  crossOriginEmbedderPolicy: false,

  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
});

// ─── Permissions-Policy ───────────────────────────────────────────────────────
// Disable browser features the API server never needs.
export const permissionsPolicyMiddleware: RequestHandler = (
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  res.setHeader(
    "Permissions-Policy",
    [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "interest-cohort=()",
    ].join(", "),
  );
  next();
};

// ─── Origin check (production state-changing requests) ────────────────────────
export const originCheckMiddleware: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!isProduction) { next(); return; }

  const origin  = req.headers.origin;
  const referer = req.headers.referer;

  const isSafeMethod = ["GET", "HEAD", "OPTIONS"].includes(req.method);
  if (isSafeMethod) { next(); return; }

  if (!origin && !referer) {
    logger.warn(
      { ip: req.ip, url: req.url, method: req.method },
      "security: missing origin on state-changing request",
    );
    res.status(403).json({ error: "Origin header প্রয়োজন" });
    return;
  }

  next();
};
