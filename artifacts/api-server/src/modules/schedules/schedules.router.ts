import { Router, type IRouter } from "express";
import { z } from "zod";
import { requireAuth, getShopId } from "../../middleware/auth.middleware";
import * as svc from "./schedules.service";
import { ValidationError } from "../../common/errors";

const router: IRouter = Router();

const ScheduleTypeEnum = z.enum(["weekly", "specific_date", "holiday"]);

// ─── GET /shifts ──────────────────────────────────────────────────────────────

router.get("/shifts", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const result = await svc.listShifts(shopId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── POST /shifts ─────────────────────────────────────────────────────────────

const CreateShiftBody = z.object({
  name:      z.string().min(1),
  nameBn:    z.string().min(1),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format"),
  endTime:   z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format"),
  color:     z.string().optional(),
});

router.post("/shifts", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const body   = CreateShiftBody.parse(req.body);
    const result = await svc.createShift(shopId, body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /shifts/:id ────────────────────────────────────────────────────────

const UpdateShiftBody = z.object({
  name:      z.string().min(1).optional(),
  nameBn:    z.string().min(1).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime:   z.string().regex(/^\d{2}:\d{2}$/).optional(),
  color:     z.string().optional(),
  isActive:  z.boolean().optional(),
});

router.patch("/shifts/:id", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const id     = Number(req.params["id"]);
    if (!id) throw new ValidationError("Invalid shift ID");
    const body   = UpdateShiftBody.parse(req.body);
    const result = await svc.updateShift(shopId, id, body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /shifts/:id ───────────────────────────────────────────────────────

router.delete("/shifts/:id", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const id     = Number(req.params["id"]);
    if (!id) throw new ValidationError("Invalid shift ID");
    await svc.deleteShift(shopId, id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─── GET /schedules/weekly ────────────────────────────────────────────────────

router.get("/schedules/weekly", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const result = await svc.getWeeklySchedule(shopId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── GET /schedules/calendar ──────────────────────────────────────────────────

router.get("/schedules/calendar", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const year   = Number(req.query["year"]);
    const month  = Number(req.query["month"]);
    if (!year || !month || year < 2020 || month < 1 || month > 12) {
      throw new ValidationError("Valid year and month are required");
    }
    const result = await svc.getCalendarSchedule(shopId, year, month);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── GET /schedules ───────────────────────────────────────────────────────────

router.get("/schedules", requireAuth, async (req, res, next) => {
  try {
    const shopId     = getShopId(req);
    const employeeId = req.query["employeeId"] ? Number(req.query["employeeId"]) : undefined;
    const rawType    = req.query["type"];
    const type       = rawType ? ScheduleTypeEnum.parse(rawType) : undefined;
    const month      = req.query["month"] ? Number(req.query["month"]) : undefined;
    const year       = req.query["year"]  ? Number(req.query["year"])  : undefined;

    const result = await svc.listSchedules(shopId, { employeeId, type, month, year });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── POST /schedules ──────────────────────────────────────────────────────────

const CreateScheduleBody = z.object({
  employeeId: z.number().int().positive(),
  shiftId:    z.number().int().positive().optional(),
  type:       ScheduleTypeEnum,
  weekday:    z.number().int().min(0).max(6).optional(),
  date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  note:       z.string().optional(),
});

router.post("/schedules", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const body   = CreateScheduleBody.parse(req.body);
    const result = await svc.createSchedule(shopId, body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /schedules/:id ─────────────────────────────────────────────────────

const UpdateScheduleBody = z.object({
  shiftId: z.number().int().positive().optional(),
  note:    z.string().optional(),
});

router.patch("/schedules/:id", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const id     = Number(req.params["id"]);
    if (!id) throw new ValidationError("Invalid schedule ID");
    const body   = UpdateScheduleBody.parse(req.body);
    const result = await svc.updateSchedule(shopId, id, body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /schedules/:id ────────────────────────────────────────────────────

router.delete("/schedules/:id", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const id     = Number(req.params["id"]);
    if (!id) throw new ValidationError("Invalid schedule ID");
    await svc.deleteSchedule(shopId, id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
