import { db, salaryGradesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { NotFoundError, ValidationError } from "../../common/errors";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SalaryGradeDto = {
  id:               number;
  shopId:           number;
  name:             string;
  description:      string | null;
  basicPercent:     number;
  houseRentPercent: number;
  medicalPercent:   number;
  transportPercent: number;
  foodPercent:      number;
  otherPercent:     number;
  createdAt:        string;
  updatedAt:        string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDto(row: typeof salaryGradesTable.$inferSelect): SalaryGradeDto {
  return {
    id:               row.id,
    shopId:           row.shopId,
    name:             row.name,
    description:      row.description ?? null,
    basicPercent:     Number(row.basicPercent),
    houseRentPercent: Number(row.houseRentPercent),
    medicalPercent:   Number(row.medicalPercent),
    transportPercent: Number(row.transportPercent),
    foodPercent:      Number(row.foodPercent),
    otherPercent:     Number(row.otherPercent),
    createdAt:        row.createdAt.toISOString(),
    updatedAt:        row.updatedAt.toISOString(),
  };
}

function validatePercentSum(
  basicPercent:     number,
  houseRentPercent: number,
  medicalPercent:   number,
  transportPercent: number,
  foodPercent:      number,
  otherPercent:     number,
): void {
  const total = basicPercent + houseRentPercent + medicalPercent + transportPercent + foodPercent + otherPercent;
  if (Math.round(total * 100) !== 10000) {
    throw new ValidationError(`Percentage sum must equal 100. Current sum: ${total.toFixed(2)}`);
  }
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function listSalaryGrades(shopId: number): Promise<SalaryGradeDto[]> {
  const rows = await db
    .select()
    .from(salaryGradesTable)
    .where(eq(salaryGradesTable.shopId, shopId))
    .orderBy(salaryGradesTable.name);
  return rows.map(toDto);
}

export async function getSalaryGrade(shopId: number, id: number): Promise<SalaryGradeDto> {
  const [row] = await db
    .select()
    .from(salaryGradesTable)
    .where(and(eq(salaryGradesTable.id, id), eq(salaryGradesTable.shopId, shopId)));
  if (!row) throw new NotFoundError("Salary grade not found");
  return toDto(row);
}

export async function createSalaryGrade(
  shopId: number,
  data: {
    name:             string;
    description?:     string;
    basicPercent:     number;
    houseRentPercent: number;
    medicalPercent:   number;
    transportPercent: number;
    foodPercent:      number;
    otherPercent:     number;
  },
): Promise<SalaryGradeDto> {
  validatePercentSum(
    data.basicPercent,
    data.houseRentPercent,
    data.medicalPercent,
    data.transportPercent,
    data.foodPercent,
    data.otherPercent,
  );

  const [row] = await db
    .insert(salaryGradesTable)
    .values({
      shopId,
      name:             data.name,
      description:      data.description,
      basicPercent:     String(data.basicPercent),
      houseRentPercent: String(data.houseRentPercent),
      medicalPercent:   String(data.medicalPercent),
      transportPercent: String(data.transportPercent),
      foodPercent:      String(data.foodPercent),
      otherPercent:     String(data.otherPercent),
    })
    .returning();
  return toDto(row);
}

export async function updateSalaryGrade(
  shopId: number,
  id:     number,
  data: {
    name?:             string;
    description?:      string;
    basicPercent?:     number;
    houseRentPercent?: number;
    medicalPercent?:   number;
    transportPercent?: number;
    foodPercent?:      number;
    otherPercent?:     number;
  },
): Promise<SalaryGradeDto> {
  const existing = await getSalaryGrade(shopId, id);

  const basicPercent     = data.basicPercent     ?? existing.basicPercent;
  const houseRentPercent = data.houseRentPercent ?? existing.houseRentPercent;
  const medicalPercent   = data.medicalPercent   ?? existing.medicalPercent;
  const transportPercent = data.transportPercent ?? existing.transportPercent;
  const foodPercent      = data.foodPercent      ?? existing.foodPercent;
  const otherPercent     = data.otherPercent     ?? existing.otherPercent;

  validatePercentSum(basicPercent, houseRentPercent, medicalPercent, transportPercent, foodPercent, otherPercent);

  const updates: Record<string, unknown> = {
    basicPercent:     String(basicPercent),
    houseRentPercent: String(houseRentPercent),
    medicalPercent:   String(medicalPercent),
    transportPercent: String(transportPercent),
    foodPercent:      String(foodPercent),
    otherPercent:     String(otherPercent),
  };
  if (data.name !== undefined)        updates["name"]        = data.name;
  if (data.description !== undefined) updates["description"] = data.description;

  const [row] = await db
    .update(salaryGradesTable)
    .set(updates)
    .where(and(eq(salaryGradesTable.id, id), eq(salaryGradesTable.shopId, shopId)))
    .returning();
  return toDto(row);
}

export async function deleteSalaryGrade(shopId: number, id: number): Promise<void> {
  const rows = await db
    .delete(salaryGradesTable)
    .where(and(eq(salaryGradesTable.id, id), eq(salaryGradesTable.shopId, shopId)))
    .returning();
  if (rows.length === 0) throw new NotFoundError("Salary grade not found");
}
