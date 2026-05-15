import { Router, type IRouter } from "express";
import {
  CreateProductBody,
  ListProductsQueryParams,
  GetProductParams,
  UpdateProductParams,
  UpdateProductBody,
  DeleteProductParams,
} from "@workspace/api-zod";
import { requireAuth, getShopId, getAuthUser } from "../../middleware/auth.middleware";
import * as productsService from "./products.service";
import { logAudit } from "../auth/audit.service";

const router: IRouter = Router();

function getCtx(req: Parameters<typeof getAuthUser>[0]) {
  return {
    ip:        (req as any).ip ?? null,
    userAgent: (req.headers["user-agent"] as string) ?? null,
  };
}

router.get("/products", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const params = ListProductsQueryParams.safeParse(req.query);
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
    res.json(await productsService.listProducts(getShopId(req), params.data));
  } catch (err) { next(err); }
});

router.post("/products", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const parsed = CreateProductBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
    const user = getAuthUser(req);
    const result = await productsService.createProduct(getShopId(req), parsed.data);
    void logAudit("product_created", {
      userId: user.id, shopId: user.shopId, ...getCtx(req),
      meta: { productId: result.id, name: result.nameBn },
    });
    res.status(201).json(result);
  } catch (err) { next(err); }
});

router.get("/products/:id", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const params = GetProductParams.safeParse(req.params);
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
    res.json(await productsService.getProduct(getShopId(req), params.data.id));
  } catch (err) { next(err); }
});

router.patch("/products/:id", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const params = UpdateProductParams.safeParse(req.params);
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
    const parsed = UpdateProductBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
    const user = getAuthUser(req);
    const result = await productsService.updateProduct(getShopId(req), params.data.id, parsed.data);
    void logAudit("product_updated", {
      userId: user.id, shopId: user.shopId, ...getCtx(req),
      meta: { productId: params.data.id, changes: parsed.data },
    });
    res.json(result);
  } catch (err) { next(err); }
});

router.delete("/products/:id", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const params = DeleteProductParams.safeParse(req.params);
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
    const user = getAuthUser(req);
    await productsService.deleteProduct(getShopId(req), params.data.id);
    void logAudit("product_deleted", {
      userId: user.id, shopId: user.shopId, ...getCtx(req),
      meta: { productId: params.data.id },
    });
    res.sendStatus(204);
  } catch (err) { next(err); }
});

export default router;
