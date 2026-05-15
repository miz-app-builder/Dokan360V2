import { Router, type IRouter } from "express";
import { CreateSaleBody, ListSalesQueryParams, GetSaleParams } from "@workspace/api-zod";
import { requireAuth, getShopId, getAuthUser } from "../../middleware/auth.middleware";
import * as salesService from "./sales.service";
import { logAudit } from "../auth/audit.service";

const router: IRouter = Router();

function getCtx(req: Parameters<typeof getAuthUser>[0]) {
  return {
    ip:        (req as any).ip ?? null,
    userAgent: (req.headers["user-agent"] as string) ?? null,
  };
}

router.get("/sales", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const params = ListSalesQueryParams.safeParse(req.query);
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
    res.json(await salesService.listSales(getShopId(req), params.data));
  } catch (err) { next(err); }
});

router.post("/sales", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const parsed = CreateSaleBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
    const user = getAuthUser(req);
    const result = await salesService.createSale(getShopId(req), user.id, parsed.data);
    void logAudit("sale_created", {
      userId: user.id, shopId: user.shopId, ...getCtx(req),
      meta: {
        saleId:        result.id,
        invoiceNumber: result.invoiceNumber,
        total:         result.total,
        paymentMethod: result.paymentMethod,
      },
    });
    res.status(201).json(result);
  } catch (err) { next(err); }
});

router.get("/sales/:id", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const params = GetSaleParams.safeParse(req.params);
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
    res.json(await salesService.getSale(getShopId(req), params.data.id));
  } catch (err) { next(err); }
});

export default router;
