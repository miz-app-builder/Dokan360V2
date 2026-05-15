import { Router, type IRouter } from "express";
import { z } from "zod";
import { requireAuth, getShopId } from "../../middleware/auth.middleware";
import * as svc from "./employees.service";

const router: IRouter = Router();

const EmployeeStatusEnum    = z.enum(["active", "inactive", "suspended", "resigned"]);
const EmployeeGenderEnum    = z.enum(["male", "female", "other"]);
const EmployeeBloodGroupEnum = z.enum(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]);

const PosAccessSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(6),
  role:     z.enum(["admin", "seller", "viewer"]),
});

const CreateEmployeeBody = z.object({
  name:             z.string().min(1),
  employeeCode:     z.string().nullable().optional(),
  fatherName:       z.string().nullable().optional(),
  motherName:       z.string().nullable().optional(),
  phone:            z.string().nullable().optional(),
  emergencyContact: z.string().nullable().optional(),
  email:            z.string().email().nullable().optional(),
  address:          z.string().nullable().optional(),
  nidNumber:        z.string().nullable().optional(),
  dateOfBirth:      z.string().nullable().optional(),
  gender:           EmployeeGenderEnum.nullable().optional(),
  joiningDate:      z.string().nullable().optional(),
  bloodGroup:       EmployeeBloodGroupEnum.nullable().optional(),
  salary:           z.number().nonnegative().nullable().optional(),
  salaryGradeId:    z.number().int().positive().nullable().optional(),
  status:           EmployeeStatusEnum.optional(),
  department:       z.string().nullable().optional(),
  designation:      z.string().nullable().optional(),
  photo:            z.string().nullable().optional(),
  nidDocPath:       z.string().nullable().optional(),
  cvPath:           z.string().nullable().optional(),
  contractPath:     z.string().nullable().optional(),
  notes:            z.string().nullable().optional(),
  posAccess:        PosAccessSchema.nullable().optional(),
  linkUserId:       z.number().int().positive().nullable().optional(),
});

const UpdateEmployeeBody = CreateEmployeeBody
  .omit({ posAccess: true })
  .partial();

const GrantAccessBody = PosAccessSchema;

const ListEmployeesQuery = z.object({
  search:      z.string().optional(),
  status:      z.string().optional(),
  department:  z.string().optional(),
  designation: z.string().optional(),
});

/* ─── List employees + unlinked system users ─────────────────── */
router.get("/employees", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const q = ListEmployeesQuery.safeParse(req.query);
    if (!q.success) { res.status(400).json({ error: q.error.message }); return; }
    res.json(await svc.listEmployees(
      getShopId(req),
      q.data.search,
      q.data.status,
      q.data.department,
      q.data.designation,
    ));
  } catch (err) { next(err); }
});

/* ─── Next serial Employee Code ─────────────────────────────── */
router.get("/employees/next-code", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const code = await svc.getNextEmployeeCode(getShopId(req));
    res.json({ code });
  } catch (err) { next(err); }
});

/* ─── Stats ──────────────────────────────────────────────────── */
router.get("/employees/stats", requireAuth, async (req, res, next): Promise<void> => {
  try {
    res.json(await svc.getEmployeeStats(getShopId(req)));
  } catch (err) { next(err); }
});

/* ─── Get single employee ────────────────────────────────────── */
router.get("/employees/:id", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: "অবৈধ ID" }); return; }
    res.json(await svc.getEmployee(getShopId(req), id));
  } catch (err) { next(err); }
});

/* ─── Create employee (optional POS access) ──────────────────── */
router.post("/employees", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const parsed = CreateEmployeeBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

    const { posAccess, linkUserId, salary, ...rest } = parsed.data;
    const data = {
      ...rest,
      salary: salary !== undefined && salary !== null ? String(salary) : null,
    };

    res.status(201).json(
      await svc.createEmployee(
        getShopId(req),
        data as Parameters<typeof svc.createEmployee>[1],
        posAccess ?? undefined,
        linkUserId ?? undefined,
      ),
    );
  } catch (err) { next(err); }
});

/* ─── Update employee ────────────────────────────────────────── */
router.patch("/employees/:id", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: "অবৈধ ID" }); return; }
    const parsed = UpdateEmployeeBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
    const data = {
      ...parsed.data,
      ...(parsed.data.salary !== undefined ? {
        salary: parsed.data.salary !== null ? String(parsed.data.salary) : null,
      } : {}),
    };
    res.json(await svc.updateEmployee(getShopId(req), id, data as Parameters<typeof svc.updateEmployee>[2]));
  } catch (err) { next(err); }
});

/* ─── Delete employee ────────────────────────────────────────── */
router.delete("/employees/:id", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: "অবৈধ ID" }); return; }
    await svc.deleteEmployee(getShopId(req), id);
    res.status(204).send();
  } catch (err) { next(err); }
});

/* ─── Grant POS access to existing employee ─────────────────── */
router.post("/employees/:id/grant-access", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: "অবৈধ ID" }); return; }
    const parsed = GrantAccessBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
    res.json(
      await svc.grantEmployeeAccess(getShopId(req), id, parsed.data, {
        ip:        req.ip,
        userAgent: req.headers["user-agent"],
      }),
    );
  } catch (err) { next(err); }
});

/* ─── Revoke POS access from employee ───────────────────────── */
router.delete("/employees/:id/revoke-access", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: "অবৈধ ID" }); return; }
    res.json(
      await svc.revokeEmployeeAccess(getShopId(req), id, {
        ip:        req.ip,
        userAgent: req.headers["user-agent"],
      }),
    );
  } catch (err) { next(err); }
});

export default router;
