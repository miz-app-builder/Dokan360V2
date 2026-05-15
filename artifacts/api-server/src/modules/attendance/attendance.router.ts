import { Router, type IRouter } from "express";
import { z } from "zod";
import { requireAuth, getShopId } from "../../middleware/auth.middleware";
import * as svc from "./attendance.service";
import { ValidationError } from "../../common/errors";

const router: IRouter = Router();

const AttendanceStatusEnum = z.enum(["present", "absent", "late", "half_day", "holiday", "leave"]);

// ─── GET /attendance ──────────────────────────────────────────────────────────

router.get("/attendance", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const page       = Number(req.query["page"])  || 1;
    const limit      = Number(req.query["limit"]) || 31;
    const employeeId = req.query["employeeId"] ? Number(req.query["employeeId"]) : undefined;
    const from       = typeof req.query["from"] === "string" ? req.query["from"] : undefined;
    const to         = typeof req.query["to"]   === "string" ? req.query["to"]   : undefined;
    const rawStatus  = req.query["status"];
    const status     = rawStatus
      ? AttendanceStatusEnum.parse(rawStatus)
      : undefined;

    const result = await svc.listAttendance(shopId, { employeeId, from, to, status, page, limit });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── GET /attendance/today ────────────────────────────────────────────────────

router.get("/attendance/today", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const result = await svc.getTodayAttendance(shopId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── GET /attendance/report ───────────────────────────────────────────────────

router.get("/attendance/report", requireAuth, async (req, res, next) => {
  try {
    const shopId     = getShopId(req);
    const year       = Number(req.query["year"]);
    const month      = Number(req.query["month"]);
    const employeeId = req.query["employeeId"] ? Number(req.query["employeeId"]) : undefined;

    if (!year || !month || year < 2020 || month < 1 || month > 12) {
      throw new ValidationError("Valid year and month are required");
    }

    const result = await svc.getAttendanceReport(shopId, year, month, employeeId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── POST /attendance/check-in ────────────────────────────────────────────────

const CheckInBody = z.object({
  employeeId:   z.number().int().positive(),
  checkInTime:  z.string().optional(),
  note:         z.string().optional(),
});

router.post("/attendance/check-in", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const body   = CheckInBody.parse(req.body);
    const record = await svc.checkIn(shopId, body.employeeId, body.checkInTime, body.note);
    res.json(record);
  } catch (err) {
    next(err);
  }
});

// ─── POST /attendance/check-out ───────────────────────────────────────────────

const CheckOutBody = z.object({
  employeeId:    z.number().int().positive(),
  checkOutTime:  z.string().optional(),
  note:          z.string().optional(),
});

router.post("/attendance/check-out", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const body   = CheckOutBody.parse(req.body);
    const record = await svc.checkOut(shopId, body.employeeId, body.checkOutTime, body.note);
    res.json(record);
  } catch (err) {
    next(err);
  }
});

// ─── POST /attendance ─────────────────────────────────────────────────────────

const CreateAttendanceBody = z.object({
  employeeId:       z.number().int().positive(),
  date:             z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkIn:          z.string().optional(),
  checkOut:         z.string().optional(),
  status:           AttendanceStatusEnum,
  lateMinutes:      z.number().int().min(0).optional(),
  overtimeMinutes:  z.number().int().min(0).optional(),
  note:             z.string().optional(),
});

router.post("/attendance", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const body   = CreateAttendanceBody.parse(req.body);
    const record = await svc.createAttendance(shopId, body);
    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /attendance/:id ────────────────────────────────────────────────────

const UpdateAttendanceBody = z.object({
  checkIn:          z.string().optional(),
  checkOut:         z.string().optional(),
  status:           AttendanceStatusEnum.optional(),
  lateMinutes:      z.number().int().min(0).optional(),
  overtimeMinutes:  z.number().int().min(0).optional(),
  note:             z.string().optional(),
});

router.patch("/attendance/:id", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const id     = Number(req.params["id"]);
    if (!id) throw new ValidationError("Invalid attendance ID");
    const body   = UpdateAttendanceBody.parse(req.body);
    const record = await svc.updateAttendance(shopId, id, body);
    res.json(record);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /attendance/:id ───────────────────────────────────────────────────

router.delete("/attendance/:id", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const id     = Number(req.params["id"]);
    if (!id) throw new ValidationError("Invalid attendance ID");
    await svc.deleteAttendance(shopId, id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
