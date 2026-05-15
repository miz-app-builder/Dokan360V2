import { Router, type IRouter } from "express";
import { z } from "zod";
import { requireAuth, getShopId, getUserId } from "../../middleware/auth.middleware";
import * as svc from "./leaves.service";
import { ValidationError } from "../../common/errors";

const router: IRouter = Router();

const LeaveStatusEnum = z.enum(["pending", "approved", "rejected", "cancelled"]);

// ─── GET /leave-types ─────────────────────────────────────────────────────────

router.get("/leave-types", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const data   = await svc.listLeaveTypes(shopId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── POST /leave-types ────────────────────────────────────────────────────────

const CreateLeaveTypeBody = z.object({
  name:        z.string().min(1).max(100),
  nameBn:      z.string().min(1).max(100),
  defaultDays: z.number().int().min(0).max(365),
  isPaid:      z.boolean(),
  color:       z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

router.post("/leave-types", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const body   = CreateLeaveTypeBody.parse(req.body);
    const data   = await svc.createLeaveType(shopId, body);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /leave-types/:id ───────────────────────────────────────────────────

const UpdateLeaveTypeBody = z.object({
  name:        z.string().min(1).max(100).optional(),
  nameBn:      z.string().min(1).max(100).optional(),
  defaultDays: z.number().int().min(0).max(365).optional(),
  isPaid:      z.boolean().optional(),
  color:       z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  isActive:    z.boolean().optional(),
});

router.patch("/leave-types/:id", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const id     = Number(req.params["id"]);
    if (!id) throw new ValidationError("Invalid leave type ID");
    const body   = UpdateLeaveTypeBody.parse(req.body);
    const data   = await svc.updateLeaveType(shopId, id, body);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /leave-types/:id ──────────────────────────────────────────────────

router.delete("/leave-types/:id", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const id     = Number(req.params["id"]);
    if (!id) throw new ValidationError("Invalid leave type ID");
    await svc.deleteLeaveType(shopId, id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─── GET /leave-requests ──────────────────────────────────────────────────────

router.get("/leave-requests", requireAuth, async (req, res, next) => {
  try {
    const shopId     = getShopId(req);
    const page       = Number(req.query["page"])  || 1;
    const limit      = Number(req.query["limit"]) || 20;
    const employeeId = req.query["employeeId"] ? Number(req.query["employeeId"]) : undefined;
    const year       = req.query["year"] ? Number(req.query["year"]) : undefined;
    const from       = typeof req.query["from"] === "string" ? req.query["from"] : undefined;
    const to         = typeof req.query["to"]   === "string" ? req.query["to"]   : undefined;
    const rawStatus  = req.query["status"];
    const status     = rawStatus ? LeaveStatusEnum.parse(rawStatus) : undefined;

    const result = await svc.listLeaveRequests(shopId, { employeeId, status, from, to, year, page, limit });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── POST /leave-requests ─────────────────────────────────────────────────────

const CreateLeaveRequestBody = z.object({
  employeeId:  z.number().int().positive(),
  leaveTypeId: z.number().int().positive(),
  fromDate:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  toDate:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason:      z.string().max(500).optional(),
});

router.post("/leave-requests", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const body   = CreateLeaveRequestBody.parse(req.body);
    if (body.fromDate > body.toDate) throw new ValidationError("fromDate must be before or equal to toDate");
    const data   = await svc.createLeaveRequest(shopId, body);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /leave-requests/:id ────────────────────────────────────────────────

const UpdateLeaveRequestBody = z.object({
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  toDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  reason:   z.string().max(500).optional(),
});

router.patch("/leave-requests/:id", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const id     = Number(req.params["id"]);
    if (!id) throw new ValidationError("Invalid leave request ID");
    const body   = UpdateLeaveRequestBody.parse(req.body);
    const data   = await svc.updateLeaveRequest(shopId, id, body);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /leave-requests/:id/approve ───────────────────────────────────────

router.patch("/leave-requests/:id/approve", requireAuth, async (req, res, next) => {
  try {
    const shopId     = getShopId(req);
    const approverId = getUserId(req);
    const id         = Number(req.params["id"]);
    if (!id) throw new ValidationError("Invalid leave request ID");
    const note       = typeof req.body?.note === "string" ? req.body.note : undefined;
    const data       = await svc.approveLeaveRequest(shopId, id, approverId, note);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /leave-requests/:id/reject ────────────────────────────────────────

const RejectBody = z.object({ reason: z.string().min(1).max(500) });

router.patch("/leave-requests/:id/reject", requireAuth, async (req, res, next) => {
  try {
    const shopId     = getShopId(req);
    const approverId = getUserId(req);
    const id         = Number(req.params["id"]);
    if (!id) throw new ValidationError("Invalid leave request ID");
    const { reason } = RejectBody.parse(req.body);
    const data       = await svc.rejectLeaveRequest(shopId, id, approverId, reason);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /leave-requests/:id ───────────────────────────────────────────────

router.delete("/leave-requests/:id", requireAuth, async (req, res, next) => {
  try {
    const shopId = getShopId(req);
    const id     = Number(req.params["id"]);
    if (!id) throw new ValidationError("Invalid leave request ID");
    await svc.deleteLeaveRequest(shopId, id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─── GET /leave-balances ──────────────────────────────────────────────────────

router.get("/leave-balances", requireAuth, async (req, res, next) => {
  try {
    const shopId     = getShopId(req);
    const year       = req.query["year"] ? Number(req.query["year"]) : undefined;
    const employeeId = req.query["employeeId"] ? Number(req.query["employeeId"]) : undefined;
    const data       = await svc.listLeaveBalances(shopId, { year, employeeId });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
