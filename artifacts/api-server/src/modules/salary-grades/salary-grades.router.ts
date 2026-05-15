import { Router, type IRouter } from "express";
import { z } from "zod";
import { requireAuth, getShopId } from "../../middleware/auth.middleware";
import * as svc from "./salary-grades.service";

const router: IRouter = Router();

const PercentField = z.number().min(0).max(100);

const CreateSalaryGradeBody = z.object({
  name:             z.string().min(1),
  description:      z.string().optional(),
  basicPercent:     PercentField,
  houseRentPercent: PercentField,
  medicalPercent:   PercentField,
  transportPercent: PercentField,
  foodPercent:      PercentField,
  otherPercent:     PercentField,
});

const UpdateSalaryGradeBody = CreateSalaryGradeBody.partial();

router.get("/salary-grades", requireAuth, async (req, res, next): Promise<void> => {
  try {
    res.json(await svc.listSalaryGrades(getShopId(req)));
  } catch (e) { next(e); }
});

router.post("/salary-grades", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const body = CreateSalaryGradeBody.parse(req.body);
    res.status(201).json(await svc.createSalaryGrade(getShopId(req), body));
  } catch (e) { next(e); }
});

router.get("/salary-grades/:id", requireAuth, async (req, res, next): Promise<void> => {
  try {
    res.json(await svc.getSalaryGrade(getShopId(req), Number(req.params["id"])));
  } catch (e) { next(e); }
});

router.patch("/salary-grades/:id", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const body = UpdateSalaryGradeBody.parse(req.body);
    res.json(await svc.updateSalaryGrade(getShopId(req), Number(req.params["id"]), body));
  } catch (e) { next(e); }
});

router.delete("/salary-grades/:id", requireAuth, async (req, res, next): Promise<void> => {
  try {
    await svc.deleteSalaryGrade(getShopId(req), Number(req.params["id"]));
    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;
