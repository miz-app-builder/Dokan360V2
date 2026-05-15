import { Router, type IRouter } from "express";
import { requireAuth, getShopId } from "../../middleware/auth.middleware";
import * as suppliersService from "./suppliers.service";
import { z } from "zod";

const router: IRouter = Router();

const CreateSupplierBody = z.object({
  name:    z.string().min(1),
  phone:   z.string().nullable().optional(),
  email:   z.string().email().nullable().optional(),
  address: z.string().nullable().optional(),
});

const UpdateSupplierBody = CreateSupplierBody.partial();

router.get("/suppliers", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    res.json(await suppliersService.listSuppliers(getShopId(req), search));
  } catch (err) { next(err); }
});

router.get("/suppliers/stats", requireAuth, async (req, res, next): Promise<void> => {
  try {
    res.json(await suppliersService.getSupplierStats(getShopId(req)));
  } catch (err) { next(err); }
});

router.get("/suppliers/:id", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: "অবৈধ ID" }); return; }
    res.json(await suppliersService.getSupplier(getShopId(req), id));
  } catch (err) { next(err); }
});

router.post("/suppliers", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const parsed = CreateSupplierBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
    res.status(201).json(await suppliersService.createSupplier(getShopId(req), parsed.data));
  } catch (err) { next(err); }
});

router.patch("/suppliers/:id", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: "অবৈধ ID" }); return; }
    const parsed = UpdateSupplierBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
    res.json(await suppliersService.updateSupplier(getShopId(req), id, parsed.data));
  } catch (err) { next(err); }
});

router.delete("/suppliers/:id", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: "অবৈধ ID" }); return; }
    await suppliersService.deleteSupplier(getShopId(req), id);
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
