import { Router, type IRouter } from "express";
import { z } from "zod";
import { requireAuth, getShopId } from "../../middleware/auth.middleware";
import * as svc from "./payroll.service";
import { ValidationError } from "../../common/errors";

const router: IRouter = Router();

// ─── GET /payroll ─────────────────────────────────────────────────────────────

router.get("/payroll", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const month  = Number(req.query["month"]);
    const year   = Number(req.query["year"]);
    if (!month || !year || month < 1 || month > 12 || year < 2020) {
      throw new ValidationError("Valid month (1-12) and year (≥2020) are required");
    }
    const employeeId    = req.query["employeeId"]    ? Number(req.query["employeeId"]) : undefined;
    const rawStatus     = req.query["paymentStatus"];
    const paymentStatus = rawStatus === "unpaid" || rawStatus === "paid" ? rawStatus : undefined;
    const result = await svc.listPayroll(shopId, { month, year, employeeId, paymentStatus });
    res.json(result);
  } catch (err) { next(err); }
});

// ─── GET /payroll/stats ───────────────────────────────────────────────────────

router.get("/payroll/stats", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const month  = Number(req.query["month"]);
    const year   = Number(req.query["year"]);
    if (!month || !year || month < 1 || month > 12 || year < 2020) {
      throw new ValidationError("Valid month (1-12) and year (≥2020) are required");
    }
    const result = await svc.getPayrollStats(shopId, month, year);
    res.json(result);
  } catch (err) { next(err); }
});

// ─── POST /payroll/generate ───────────────────────────────────────────────────

const GenerateBody = z.object({
  month:                z.number().int().min(1).max(12),
  year:                 z.number().int().min(2020),
  overtimeRatePerMinute: z.number().min(0).optional(),
});

router.post("/payroll/generate", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const body   = GenerateBody.parse(req.body);
    const result = await svc.generatePayroll(shopId, body.month, body.year, body.overtimeRatePerMinute);
    res.status(201).json(result);
  } catch (err) { next(err); }
});

// ─── GET /payroll/employee/:employeeId ────────────────────────────────────────

router.get("/payroll/employee/:employeeId", requireAuth, async (req, res, next) => {
  try {
    const shopId     = getShopId(req);
    const employeeId = Number(req.params["employeeId"]);
    const limit      = Number(req.query["limit"]) || 24;
    if (!employeeId) throw new ValidationError("Invalid employee ID");
    const result = await svc.getEmployeePayrollHistory(shopId, employeeId, limit);
    res.json(result);
  } catch (err) { next(err); }
});

// ─── GET /payroll/:id ─────────────────────────────────────────────────────────

router.get("/payroll/:id", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const id     = Number(req.params["id"]);
    if (!id) throw new ValidationError("Invalid payroll record ID");
    const result = await svc.getPayrollRecord(shopId, id);
    res.json(result);
  } catch (err) { next(err); }
});

// ─── PATCH /payroll/:id ───────────────────────────────────────────────────────

const UpdateBody = z.object({
  houseRentAllowance:    z.number().min(0).optional(),
  medicalAllowance:      z.number().min(0).optional(),
  transportAllowance:    z.number().min(0).optional(),
  foodAllowance:         z.number().min(0).optional(),
  commission:            z.number().min(0).optional(),
  overtimePay:           z.number().min(0).optional(),
  bonus:                 z.number().min(0).optional(),
  advance:               z.number().min(0).optional(),
  otherDeductions:       z.number().min(0).optional(),
  providentFundEmployee: z.number().min(0).optional(),
  providentFundEmployer: z.number().min(0).optional(),
  taxDeduction:          z.number().min(0).optional(),
  loanDeduction:         z.number().min(0).optional(),
  note:                  z.string().optional(),
});

router.patch("/payroll/:id", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const id     = Number(req.params["id"]);
    if (!id) throw new ValidationError("Invalid payroll record ID");
    const body   = UpdateBody.parse(req.body);
    const result = await svc.updatePayrollRecord(shopId, id, body);
    res.json(result);
  } catch (err) { next(err); }
});

// ─── POST /payroll/:id/pay ────────────────────────────────────────────────────

router.post("/payroll/:id/pay", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const id     = Number(req.params["id"]);
    if (!id) throw new ValidationError("Invalid payroll record ID");
    const note   = typeof req.body?.note === "string" ? req.body.note : undefined;
    const result = await svc.markPayrollPaid(shopId, id, note);
    res.json(result);
  } catch (err) { next(err); }
});

// ─── DELETE /payroll/:id ──────────────────────────────────────────────────────

router.delete("/payroll/:id", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const id     = Number(req.params["id"]);
    if (!id) throw new ValidationError("Invalid payroll record ID");
    await svc.deletePayrollRecord(shopId, id);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
