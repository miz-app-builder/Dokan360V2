import { Router, type IRouter } from "express";
import { CreateCategoryBody, UpdateCategoryParams, UpdateCategoryBody, DeleteCategoryParams } from "@workspace/api-zod";
import { requireAuth, getShopId } from "../../middleware/auth.middleware";
import * as categoriesService from "./categories.service";

const router: IRouter = Router();

router.get("/categories", requireAuth, async (req, res, next): Promise<void> => {
  try {
    res.json(await categoriesService.listCategories(getShopId(req)));
  } catch (err) { next(err); }
});

router.post("/categories", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const parsed = CreateCategoryBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
    res.status(201).json(await categoriesService.createCategory(getShopId(req), parsed.data));
  } catch (err) { next(err); }
});

router.patch("/categories/:id", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const params = UpdateCategoryParams.safeParse(req.params);
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
    const parsed = UpdateCategoryBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
    res.json(await categoriesService.updateCategory(getShopId(req), params.data.id, parsed.data));
  } catch (err) { next(err); }
});

router.delete("/categories/:id", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const params = DeleteCategoryParams.safeParse(req.params);
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
    await categoriesService.deleteCategory(getShopId(req), params.data.id);
    res.sendStatus(204);
  } catch (err) { next(err); }
});

export default router;
