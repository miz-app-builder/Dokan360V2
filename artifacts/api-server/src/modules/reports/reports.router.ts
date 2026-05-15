import { Router, type IRouter } from "express";
import { GetSalesReportQueryParams } from "@workspace/api-zod";
import { requireAuth, getShopId } from "../../middleware/auth.middleware";
import * as reportsService from "./reports.service";
import { z } from "zod/v4";

const router: IRouter = Router();

const DateRangeQuery = z.object({ from: z.string().optional(), to: z.string().optional() });

router.get("/reports/sales", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const params = GetSalesReportQueryParams.safeParse(req.query);
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
    res.json(await reportsService.getSalesReport(getShopId(req), params.data.from, params.data.to));
  } catch (err) { next(err); }
});

router.get("/reports/inventory", requireAuth, async (req, res, next): Promise<void> => {
  try {
    res.json(await reportsService.getInventoryReport(getShopId(req)));
  } catch (err) { next(err); }
});

router.get("/reports/profit", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const parsed = DateRangeQuery.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
    res.json(await reportsService.getProfitReport(getShopId(req), parsed.data.from, parsed.data.to));
  } catch (err) { next(err); }
});

router.get("/reports/products", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const parsed = DateRangeQuery.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
    res.json(await reportsService.getProductsReport(getShopId(req), parsed.data.from, parsed.data.to));
  } catch (err) { next(err); }
});

router.get("/reports/due", requireAuth, async (req, res, next): Promise<void> => {
  try {
    res.json(await reportsService.getDueReport(getShopId(req)));
  } catch (err) { next(err); }
});

router.get("/reports/staff", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const parsed = DateRangeQuery.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
    res.json(await reportsService.getStaffReport(getShopId(req), parsed.data.from, parsed.data.to));
  } catch (err) { next(err); }
});

export default router;
