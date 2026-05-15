import { Router, type IRouter } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import * as auditLogsService from "./audit-logs.service";

const router: IRouter = Router();

router.get("/audit-logs", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const shopId = req.authUser!.shopId;
    const {
      page, limit, search, action, from, to,
    } = req.query as Record<string, string | undefined>;

    const result = await auditLogsService.listAuditLogs(shopId, {
      page:   page   ? parseInt(page,  10) : undefined,
      limit:  limit  ? parseInt(limit, 10) : undefined,
      search: search || undefined,
      action: action || undefined,
      from:   from   || undefined,
      to:     to     || undefined,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
