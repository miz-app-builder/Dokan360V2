import { db, salaryGradesTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";
import { NotFoundError, ValidationError } from "../../common/errors";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SalaryGradeDto = {
  id:               number;
  shopId:           number | null;
  name:             string;
  description:      string | null;
  basicPercent:     number;
  houseRentPercent: number;
  medicalPercent:   number;
  transportPercent: number;
  foodPercent:      number;
  otherPercent:     number;
  isDefault:        boolean;
  createdAt:        string;
  updatedAt:        string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDto(row: typeof salaryGradesTable.$inferSelect): SalaryGradeDto {
  return {
    id:               row.id,
    shopId:           row.shopId ?? null,
    name:             row.name,
    description:      row.description ?? null,
    basicPercent:     Number(row.basicPercent),
    houseRentPercent: Number(row.houseRentPercent),
    medicalPercent:   Number(row.medicalPercent),
    transportPercent: Number(row.transportPercent),
    foodPercent:      Number(row.foodPercent),
    otherPercent:     Number(row.otherPercent),
    isDefault:        row.isSystemDefault,
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

// ─── Default-check helpers ────────────────────────────────────────────────────

async function hasOwnGrades(shopId: number): Promise<boolean> {
  const rows = await db
    .select({ id: salaryGradesTable.id })
    .from(salaryGradesTable)
    .where(eq(salaryGradesTable.shopId, shopId))
    .limit(1);
  return rows.length > 0;
}

async function copyDefaultsToShop(shopId: number): Promise<void> {
  const defaults = await db
    .select()
    .from(salaryGradesTable)
    .where(and(isNull(salaryGradesTable.shopId), eq(salaryGradesTable.isSystemDefault, true)));

  if (defaults.length === 0) return;

  await db.insert(salaryGradesTable).values(
    defaults.map((d) => ({
      shopId:           shopId,
      isSystemDefault:  false,
      name:             d.name,
      description:      d.description,
      basicPercent:     d.basicPercent,
      houseRentPercent: d.houseRentPercent,
      medicalPercent:   d.medicalPercent,
      transportPercent: d.transportPercent,
      foodPercent:      d.foodPercent,
      otherPercent:     d.otherPercent,
    })),
  );
}

async function resolveGradeForShop(
  shopId: number,
  gradeId: number,
): Promise<typeof salaryGradesTable.$inferSelect> {
  // Try shop's own grade first
  const [ownRow] = await db
    .select()
    .from(salaryGradesTable)
    .where(and(eq(salaryGradesTable.id, gradeId), eq(salaryGradesTable.shopId, shopId)));
  if (ownRow) return ownRow;

  // Try system default
  const [defaultRow] = await db
    .select()
    .from(salaryGradesTable)
    .where(and(eq(salaryGradesTable.id, gradeId), isNull(salaryGradesTable.shopId), eq(salaryGradesTable.isSystemDefault, true)));
  if (defaultRow) return defaultRow;

  throw new NotFoundError("Salary grade not found");
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function listSalaryGrades(shopId: number): Promise<SalaryGradeDto[]> {
  const hasOwn = await hasOwnGrades(shopId);

  if (hasOwn) {
    const rows = await db
      .select()
      .from(salaryGradesTable)
      .where(and(eq(salaryGradesTable.shopId, shopId), eq(salaryGradesTable.isSystemDefault, false)))
      .orderBy(salaryGradesTable.name);
    return rows.map(toDto);
  }

  // No own grades → return system defaults with isDefault: true
  const rows = await db
    .select()
    .from(salaryGradesTable)
    .where(and(isNull(salaryGradesTable.shopId), eq(salaryGradesTable.isSystemDefault, true)))
    .orderBy(salaryGradesTable.name);
  return rows.map(toDto);
}

export async function getSalaryGrade(shopId: number, id: number): Promise<SalaryGradeDto> {
  const row = await resolveGradeForShop(shopId, id);
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

  // Copy-on-first-write: if shop has no own grades, clone defaults first
  const hasOwn = await hasOwnGrades(shopId);
  if (!hasOwn) {
    await copyDefaultsToShop(shopId);
  }

  const [row] = await db
    .insert(salaryGradesTable)
    .values({
      shopId,
      isSystemDefault:  false,
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
  const resolved = await resolveGradeForShop(shopId, id);

  // Copy-on-write: if this is a system default, copy ALL defaults to shop first, then update the copy
  let targetId = id;
  if (resolved.isSystemDefault) {
    const hasOwn = await hasOwnGrades(shopId);
    if (!hasOwn) {
      await copyDefaultsToShop(shopId);
    }
    // Find the shop's copy that matches the default's name
    const [copy] = await db
      .select()
      .from(salaryGradesTable)
      .where(and(eq(salaryGradesTable.shopId, shopId), eq(salaryGradesTable.name, resolved.name)))
      .limit(1);
    if (!copy) throw new NotFoundError("Salary grade copy not found after migration");
    targetId = copy.id;
  }

  const existing = await getSalaryGrade(shopId, targetId);
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
  if (data.name        !== undefined) updates["name"]        = data.name;
  if (data.description !== undefined) updates["description"] = data.description;

  const [row] = await db
    .update(salaryGradesTable)
    .set(updates)
    .where(and(eq(salaryGradesTable.id, targetId), eq(salaryGradesTable.shopId, shopId)))
    .returning();
  return toDto(row);
}

export async function deleteSalaryGrade(shopId: number, id: number): Promise<void> {
  const resolved = await resolveGradeForShop(shopId, id);

  // Copy-on-write: if deleting a system default, copy ALL defaults to shop then delete the copy
  if (resolved.isSystemDefault) {
    const hasOwn = await hasOwnGrades(shopId);
    if (!hasOwn) {
      await copyDefaultsToShop(shopId);
    }
    // Find and delete the copy matching the default's name
    const deleted = await db
      .delete(salaryGradesTable)
      .where(and(eq(salaryGradesTable.shopId, shopId), eq(salaryGradesTable.name, resolved.name)))
      .returning();
    if (deleted.length === 0) throw new NotFoundError("Salary grade copy not found after migration");
    return;
  }

  const rows = await db
    .delete(salaryGradesTable)
    .where(and(eq(salaryGradesTable.id, id), eq(salaryGradesTable.shopId, shopId)))
    .returning();
  if (rows.length === 0) throw new NotFoundError("Salary grade not found");
}

