import { Router, type IRouter } from "express";
import { requireAuth, getShopId } from "../../middleware/auth.middleware";
import * as dashboardService from "./dashboard.service";

const router: IRouter = Router();

router.get("/dashboard/summary", requireAuth, async (req, res, next): Promise<void> => {
  try {
    res.json(await dashboardService.getSummary(getShopId(req)));
  } catch (err) { next(err); }
});

router.get("/dashboard/recent-sales", requireAuth, async (req, res, next): Promise<void> => {
  try {
    res.json(await dashboardService.getRecentSales(getShopId(req)));
  } catch (err) { next(err); }
});

router.get("/dashboard/top-products", requireAuth, async (req, res, next): Promise<void> => {
  try {
    res.json(await dashboardService.getTopProducts(getShopId(req)));
  } catch (err) { next(err); }
});

router.get("/dashboard/sales-chart", requireAuth, async (req, res, next): Promise<void> => {
  try {
    res.json(await dashboardService.getSalesChart(getShopId(req)));
  } catch (err) { next(err); }
});

router.get("/dashboard/analytics", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const period = req.query.period === "month" ? "month" : "week";
    res.json(await dashboardService.getAnalytics(getShopId(req), period));
  } catch (err) { next(err); }
});

router.get("/dashboard/heatmap", requireAuth, async (req, res, next): Promise<void> => {
  try {
    res.json(await dashboardService.getHeatmap(getShopId(req)));
  } catch (err) { next(err); }
});

export default router;
