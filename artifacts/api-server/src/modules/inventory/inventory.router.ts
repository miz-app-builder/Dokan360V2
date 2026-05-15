import { Router, type IRouter } from "express";
import { AdjustInventoryBody } from "@workspace/api-zod";
import { requireAuth, getShopId, getAuthUser } from "../../middleware/auth.middleware";
import * as inventoryService from "./inventory.service";
import { logAudit } from "../auth/audit.service";

const router: IRouter = Router();

function getCtx(req: Parameters<typeof getAuthUser>[0]) {
  return {
    ip:        (req as any).ip ?? null,
    userAgent: (req.headers["user-agent"] as string) ?? null,
  };
}

router.get("/inventory", requireAuth, async (req, res, next): Promise<void> => {
  try {
    res.json(await inventoryService.listInventory(getShopId(req)));
  } catch (err) { next(err); }
});

router.post("/inventory/adjust", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const parsed = AdjustInventoryBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
    const { productId, quantity, type, reason } = parsed.data;
    const user = getAuthUser(req);
    const result = await inventoryService.adjustInventory(productId, quantity, type, reason ?? undefined);
    void logAudit("stock_adjusted", {
      userId: user.id, shopId: user.shopId, ...getCtx(req),
      meta: { productId, quantity, type, reason: reason ?? null },
    });
    res.json(result);
  } catch (err) { next(err); }
});

router.get("/inventory/adjustments", requireAuth, async (req, res, next): Promise<void> => {
  try {
    res.json(await inventoryService.listAdjustments());
  } catch (err) { next(err); }
});

export default router;
