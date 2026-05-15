import { Router, type IRouter } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import * as svc from "./user-access.service";

const router: IRouter = Router();

const UpdateAccessSchema = z.object({
  allowedModules:  z.array(z.string()),
  dataRestriction: z.enum(["none", "own_sales", "own_outlet"]),
});

router.get(
  "/user-access",
  requireAuth,
  requireRole("admin"),
  async (req, res, next): Promise<void> => {
    try {
      const data = await svc.getUserAccessList(req.authUser!.shopId);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/user-access/:userId",
  requireAuth,
  requireRole("admin"),
  async (req, res, next): Promise<void> => {
    try {
      const userId = Number(req.params["userId"]);
      if (isNaN(userId)) {
        res.status(400).json({ error: "userId অবৈধ" });
        return;
      }
      const data = await svc.getUserAccess(req.authUser!.shopId, userId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

router.put(
  "/user-access/:userId",
  requireAuth,
  requireRole("admin"),
  async (req, res, next): Promise<void> => {
    try {
      const userId = Number(req.params["userId"]);
      if (isNaN(userId)) {
        res.status(400).json({ error: "userId অবৈধ" });
        return;
      }
      const parsed = UpdateAccessSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
      }
      const { allowedModules, dataRestriction } = parsed.data;
      await svc.updateUserAccess(req.authUser!.shopId, userId, allowedModules, dataRestriction);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  "/user-access/:userId/reset",
  requireAuth,
  requireRole("admin"),
  async (req, res, next): Promise<void> => {
    try {
      const userId = Number(req.params["userId"]);
      if (isNaN(userId)) {
        res.status(400).json({ error: "userId অবৈধ" });
        return;
      }
      await svc.resetUserAccess(req.authUser!.shopId, userId);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
