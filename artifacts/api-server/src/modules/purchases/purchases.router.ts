import { Router, type IRouter } from "express";
import { requireAuth, getShopId, getAuthUser } from "../../middleware/auth.middleware";
import * as purchasesService from "./purchases.service";
import { z } from "zod";

const router: IRouter = Router();

const PurchaseItemSchema = z.object({
  productId:     z.number().int().nullable().optional(),
  productNameBn: z.string().min(1),
  quantity:      z.number().positive(),
  costPrice:     z.number().min(0),
});

const CreatePurchaseBody = z.object({
  supplierId:  z.number().int().nullable().optional(),
  total:       z.number().min(0),
  paid:        z.number().min(0),
  note:        z.string().nullable().optional(),
  status:      z.enum(["received", "pending", "cancelled"]).optional(),
  purchasedAt: z.string().optional(),
  items:       z.array(PurchaseItemSchema).min(1),
});

const PayDueBody = z.object({
  amount: z.number().positive(),
});

router.get("/purchases", requireAuth, async (req, res, next): Promise<void> => {
  try {
    res.json(await purchasesService.listPurchases(getShopId(req)));
  } catch (err) { next(err); }
});

router.get("/purchases/stats", requireAuth, async (req, res, next): Promise<void> => {
  try {
    res.json(await purchasesService.getPurchaseStats(getShopId(req)));
  } catch (err) { next(err); }
});

router.get("/purchases/:id", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: "অবৈধ ID" }); return; }
    res.json(await purchasesService.getPurchase(getShopId(req), id));
  } catch (err) { next(err); }
});

router.post("/purchases", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const parsed = CreatePurchaseBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
    const user = getAuthUser(req);
    res.status(201).json(await purchasesService.createPurchase(getShopId(req), user.id, parsed.data));
  } catch (err) { next(err); }
});

router.post("/purchases/:id/pay", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: "অবৈধ ID" }); return; }
    const parsed = PayDueBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
    res.json(await purchasesService.paySupplierDue(getShopId(req), id, parsed.data.amount));
  } catch (err) { next(err); }
});

router.delete("/purchases/:id", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: "অবৈধ ID" }); return; }
    await purchasesService.deletePurchase(getShopId(req), id);
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
