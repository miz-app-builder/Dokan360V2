import http from "node:http";
import { env } from "./config/env";
import app from "./app";
import { logger } from "./common/logger";
import { errorReporter } from "./common/error-reporter";

async function main() {
  // ─── Initialize error reporter (Sentry or log-only) ───────────────────────
  await errorReporter.init();

  // ─── Global process error handlers ────────────────────────────────────────
  // Catches programming errors that escape Express (e.g. async callbacks,
  // background timers) so they are reported before the process terminates.
  process.on("uncaughtException", async (err: Error) => {
    await errorReporter.captureFatal(err, "uncaughtException");
    process.exit(1);
  });

  process.on("unhandledRejection", async (reason: unknown) => {
    await errorReporter.captureFatal(reason, "unhandledRejection");
    process.exit(1);
  });

  // ─── Graceful shutdown ─────────────────────────────────────────────────────
  process.on("SIGTERM", () => {
    logger.info("SIGTERM received — shutting down gracefully");
    server.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });
    // Force-close after 10 s if connections linger
    setTimeout(() => process.exit(0), 10_000).unref();
  });

  // ─── Start HTTP server ─────────────────────────────────────────────────────
  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, "Server listening");
  });

  server.on("error", async (err) => {
    await errorReporter.captureFatal(err, "server.listen");
    process.exit(1);
  });
}

main();
