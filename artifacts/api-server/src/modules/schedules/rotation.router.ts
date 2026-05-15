import { Router, type IRouter } from "express";
import { z } from "zod";
import { requireAuth, getShopId } from "../../middleware/auth.middleware";
import * as svc from "./rotation.service";
import { ValidationError } from "../../common/errors";

const router: IRouter = Router();

const RotationCycleTypeEnum = z.enum(["daily", "weekly", "monthly"]);

// ─── GET /rotation-patterns ───────────────────────────────────────────────────

router.get("/rotation-patterns", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const result = await svc.listRotationPatterns(shopId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── POST /rotation-patterns ──────────────────────────────────────────────────

const CreatePatternBody = z.object({
  name:        z.string().min(1),
  nameBn:      z.string().min(1),
  cycleType:   RotationCycleTypeEnum,
  cycleLength: z.number().int().min(1).max(12),
  startDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  isDefault:   z.boolean().optional(),
});

router.post("/rotation-patterns", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const body   = CreatePatternBody.parse(req.body);
    const result = await svc.createRotationPattern(shopId, body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// ─── GET /rotation-patterns/:id ───────────────────────────────────────────────

router.get("/rotation-patterns/:id", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const id     = Number(req.params["id"]);
    if (!id) throw new ValidationError("Invalid pattern ID");
    const result = await svc.getRotationPatternWithSlots(shopId, id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /rotation-patterns/:id ─────────────────────────────────────────────

const UpdatePatternBody = z.object({
  name:        z.string().min(1).optional(),
  nameBn:      z.string().min(1).optional(),
  cycleType:   RotationCycleTypeEnum.optional(),
  cycleLength: z.number().int().min(1).max(12).optional(),
  startDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  isDefault:   z.boolean().optional(),
  isActive:    z.boolean().optional(),
});

router.patch("/rotation-patterns/:id", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const id     = Number(req.params["id"]);
    if (!id) throw new ValidationError("Invalid pattern ID");
    const body   = UpdatePatternBody.parse(req.body);
    const result = await svc.updateRotationPattern(shopId, id, body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /rotation-patterns/:id ────────────────────────────────────────────

router.delete("/rotation-patterns/:id", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const id     = Number(req.params["id"]);
    if (!id) throw new ValidationError("Invalid pattern ID");
    await svc.deleteRotationPattern(shopId, id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /rotation-patterns/:id/slots ─────────────────────────────────────────

const SlotsBody = z.object({
  slots: z.array(z.object({
    slotIndex: z.number().int().min(0),
    weekday:   z.number().int().min(0).max(6).nullable().optional(),
    shiftId:   z.number().int().positive().nullable().optional(),
  })),
});

router.put("/rotation-patterns/:id/slots", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const id     = Number(req.params["id"]);
    if (!id) throw new ValidationError("Invalid pattern ID");
    const body   = SlotsBody.parse(req.body);
    const result = await svc.setRotationPatternSlots(shopId, id, body.slots);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── GET /employees/:id/rotation ──────────────────────────────────────────────

router.get("/employees/:id/rotation", requireAuth, async (req, res, next) => {
  try {
    const shopId     = getShopId(req);
    const employeeId = Number(req.params["id"]);
    if (!employeeId) throw new ValidationError("Invalid employee ID");
    const result = await svc.getEmployeeRotation(shopId, employeeId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── POST /employees/:id/rotation ─────────────────────────────────────────────

const AssignRotationBody = z.object({
  patternId: z.number().int().positive(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
});

router.post("/employees/:id/rotation", requireAuth, async (req, res, next) => {
  try {
    const shopId     = getShopId(req);
    const employeeId = Number(req.params["id"]);
    if (!employeeId) throw new ValidationError("Invalid employee ID");
    const body = AssignRotationBody.parse(req.body);
    const result = await svc.assignEmployeeRotation(shopId, employeeId, body.patternId, body.startDate);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /employees/:id/rotation ───────────────────────────────────────────

router.delete("/employees/:id/rotation", requireAuth, async (req, res, next) => {
  try {
    const shopId     = getShopId(req);
    const employeeId = Number(req.params["id"]);
    if (!employeeId) throw new ValidationError("Invalid employee ID");
    await svc.removeEmployeeRotation(shopId, employeeId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─── GET /employees/:id/rotation-schedule ─────────────────────────────────────

router.get("/employees/:id/rotation-schedule", requireAuth, async (req, res, next) => {
  try {
    const shopId     = getShopId(req);
    const employeeId = Number(req.params["id"]);
    if (!employeeId) throw new ValidationError("Invalid employee ID");
    const result = await svc.getEmployeeRotationSchedule(shopId, employeeId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
