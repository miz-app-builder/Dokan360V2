import { Router, type IRouter } from "express";
import { requireAuth, getShopId } from "../../middleware/auth.middleware";
import { getHrAnalytics } from "./hr.service";
import { ValidationError } from "../../common/errors";

const router: IRouter = Router();

// ─── GET /hr/analytics ────────────────────────────────────────────────────────

router.get("/hr/analytics", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const month  = Number(req.query["month"]);
    const year   = Number(req.query["year"]);

    if (!month || !year || month < 1 || month > 12 || year < 2020) {
      throw new ValidationError("Valid month (1-12) and year (≥2020) are required");
    }

    const data = await getHrAnalytics(shopId, month, year);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
