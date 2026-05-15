import crypto from "node:crypto";
import path from "node:path";
import express, { type Express } from "express";
import cors from "cors";
import compression from "compression";
import pinoHttp from "pino-http";
import { env, getAllowedOrigins, isProduction } from "./config/env";
import router from "./router";
import { logger } from "./common/logger";
import { errorHandler } from "./middleware/error.middleware";
import { helmetMiddleware, originCheckMiddleware, permissionsPolicyMiddleware } from "./middleware/security-headers.middleware";
import { apiRateLimit } from "./middleware/rate-limit.middleware";

const app: Express = express();

// ─── Trust proxy ──────────────────────────────────────────────────────────────
// TRUSTED_PROXY_COUNT defaults to 1 — correct for Replit, Vercel, and single
// Nginx reverse-proxy setups.  Set to 0 only when running without a proxy.
app.set("trust proxy", env.TRUSTED_PROXY_COUNT > 0 ? env.TRUSTED_PROXY_COUNT : false);

// ─── Security headers (helmet) ────────────────────────────────────────────────
app.use(helmetMiddleware);

// ─── Permissions-Policy ───────────────────────────────────────────────────────
app.use(permissionsPolicyMiddleware);

// ─── Gzip / Brotli response compression ──────────────────────────────────────
// Compresses all API responses and static files (HTML, CSS, JS, JSON, fonts).
// Assets served with long-lived Cache-Control headers benefit most because the
// compressed bytes are stored in the browser cache after the first download.
//
// Threshold: 1 kB — don't compress tiny responses where overhead exceeds gain.
// Level: 6 — good balance between CPU usage and compression ratio (1–9 scale).
app.use(
  compression({
    threshold: 1024,
    level:     6,
    filter(req, res) {
      // Let the default filter handle content-type detection,
      // but skip compression for Server-Sent Events streams.
      if (res.getHeader("Content-Type") === "text/event-stream") return false;
      return compression.filter(req, res);
    },
  }),
);

// ─── HTTP request logging + request ID ───────────────────────────────────────
app.use(
  pinoHttp({
    logger,

    // Accept X-Request-Id from upstream or generate a new UUID
    genReqId(req, res) {
      const existing = req.headers["x-request-id"];
      const id =
        typeof existing === "string" && existing.length > 0
          ? existing
          : crypto.randomUUID();
      res.setHeader("X-Request-Id", id);
      return id;
    },

    // What to log for each request
    serializers: {
      req(req) {
        return {
          id:     req.id,
          method: req.method,
          url:    req.url?.split("?")[0] ?? req.url,
          ip:     req.raw?.socket?.remoteAddress,
        };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },

    // Custom message format
    customSuccessMessage(req, res, responseTime) {
      return `${req.method} ${(req.url ?? "").split("?")[0]} ${res.statusCode} ${Math.round(responseTime)}ms`;
    },
    customErrorMessage(req, res, err) {
      return `${req.method} ${(req.url ?? "").split("?")[0]} ${res.statusCode} ${err.message}`;
    },

    // Do not log healthz in production to avoid noise
    autoLogging: {
      ignore: (req) => isProduction && req.url === "/api/healthz",
    },
  }),
);

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = getAllowedOrigins();

if (isProduction && Array.isArray(allowedOrigins) && allowedOrigins.length === 0) {
  logger.warn(
    "CORS: no allowed origins configured for production. " +
    "Set CORS_ORIGINS or ensure REPLIT_DOMAINS is injected.",
  );
}

app.use(
  cors({
    origin:         allowedOrigins,
    credentials:    true,
    methods:        ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    exposedHeaders: ["X-Request-Id"],
    maxAge:         600, // preflight cache: 10 minutes
  }),
);

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ─── Origin check (production state-changing requests) ────────────────────────
app.use(originCheckMiddleware);

// ─── General API rate limit ───────────────────────────────────────────────────
app.use("/api", apiRateLimit);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api", router);

// ─── Static file serving + SPA (production only) ─────────────────────────────
// In production, the Express server serves the pre-built React frontend so that
// a single port (8080) handles both the API and the UI.
//
// Override the static directory with STATIC_SERVE_DIR if needed.
// Default path assumes the monorepo root is the current working directory.
if (isProduction) {
  const staticDir =
    process.env.STATIC_SERVE_DIR ??
    path.resolve(process.cwd(), "artifacts", "dokan360", "dist", "public");

  logger.info({ staticDir }, "Production: serving pre-built frontend");

  // Serve Vite's hashed assets with aggressive caching (1 year).
  // The compression middleware above will automatically gzip these responses.
  app.use(
    express.static(staticDir, {
      maxAge: "1y",
      etag:   true,
      index:  false, // disable directory index — we handle it via SPA fallback
    }),
  );

  // SPA catch-all: any request that did not match an API route or a static file
  // is forwarded to index.html so client-side routing (Wouter) can take over.
  app.use((_req, res, next) => {
    res.sendFile(path.join(staticDir, "index.html"), (err?: Error | null) => {
      if (err) next(err);
    });
  });
}

// ─── Error handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
