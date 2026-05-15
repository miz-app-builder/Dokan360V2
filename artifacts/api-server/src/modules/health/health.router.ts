import { Router, type IRouter } from "express";
import * as healthService from "./health.service";

const router: IRouter = Router();

/**
 * GET /api/health
 * GET /api/healthz  (backward-compat alias)
 *
 * Liveness-lite: always 200 if the server process is running.
 * Does NOT check downstream dependencies.
 * Use this as the load-balancer / uptime-monitor probe.
 */
router.get(["/health", "/healthz"], (_req, res) => {
  res.json(healthService.getHealth());
});

/**
 * GET /api/live
 *
 * Kubernetes / Docker liveness probe.
 * Returns 200 as long as the Node process is alive.
 * If this fails the process should be restarted.
 */
router.get("/live", (_req, res) => {
  res.json(healthService.getLive());
});

/**
 * GET /api/ready
 *
 * Kubernetes / Docker readiness probe.
 * Returns 200 only when all critical dependencies (DB) are reachable.
 * Returns 503 when the service should be taken out of rotation.
 */
router.get("/ready", async (_req, res, next): Promise<void> => {
  try {
    const status = await healthService.getReady();
    res.status(status.status === "ok" ? 200 : 503).json(status);
  } catch (err) {
    next(err);
  }
});

export default router;
