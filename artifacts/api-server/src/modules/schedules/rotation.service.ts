import {
  db,
  rotationPatternsTable,
  rotationPatternSlotsTable,
  employeeRotationsTable,
  shiftsTable,
  employeesTable,
  shopsTable,
  type RotationCycleType,
} from "@workspace/db";
import { eq, and, isNull, desc } from "drizzle-orm";
import { NotFoundError, ValidationError } from "../../common/errors";

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export type RotationPatternDto = {
  id:          number;
  shopId:      number;
  name:        string;
  nameBn:      string;
  cycleType:   RotationCycleType;
  cycleLength: number;
  startDate:   string;
  isDefault:   boolean;
  isActive:    boolean;
  createdAt:   string;
  updatedAt:   string;
};

export type RotationPatternSlotDto = {
  id:             number;
  patternId:      number;
  slotIndex:      number;
  weekday:        number | null;
  shiftId:        number | null;
  shiftName:      string | null;
  shiftNameBn:    string | null;
  shiftColor:     string | null;
  shiftStartTime: string | null;
  shiftEndTime:   string | null;
  createdAt:      string;
  updatedAt:      string;
};

export type RotationPatternWithSlotsDto = RotationPatternDto & {
  slots: RotationPatternSlotDto[];
};

export type EmployeeRotationAssignmentDto = {
  id:            number;
  employeeId:    number;
  patternId:     number;
  patternName:   string;
  patternNameBn: string;
  cycleType:     RotationCycleType;
  cycleLength:   number;
  startDate:     string;
  endDate:       string | null;
  createdAt:     string;
};

export type RotationDaySlotDto = {
  weekday:        number;
  shiftId:        number | null;
  shiftName:      string | null;
  shiftNameBn:    string | null;
  shiftColor:     string | null;
  shiftStartTime: string | null;
  shiftEndTime:   string | null;
};

export type EmployeeRotationScheduleDto = {
  hasRotation:      boolean;
  patternId:        number | null;
  patternName:      string | null;
  patternNameBn:    string | null;
  cycleType:        RotationCycleType | null;
  cycleLength:      number | null;
  currentSlotIndex: number | null;
  days:             RotationDaySlotDto[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toPatternDto(row: typeof rotationPatternsTable.$inferSelect): RotationPatternDto {
  return {
    id:          row.id,
    shopId:      row.shopId,
    name:        row.name,
    nameBn:      row.nameBn,
    cycleType:   row.cycleType,
    cycleLength: row.cycleLength,
    startDate:   typeof row.startDate === "string" ? row.startDate : (row.startDate as Date).toISOString().split("T")[0]!,
    isDefault:   row.isDefault,
    isActive:    row.isActive,
    createdAt:   row.createdAt.toISOString(),
    updatedAt:   row.updatedAt.toISOString(),
  };
}

function toSlotDto(
  row: typeof rotationPatternSlotsTable.$inferSelect,
  shift: { name: string; nameBn: string; color: string; startTime: string; endTime: string } | null,
): RotationPatternSlotDto {
  return {
    id:             row.id,
    patternId:      row.patternId,
    slotIndex:      row.slotIndex,
    weekday:        row.weekday,
    shiftId:        row.shiftId,
    shiftName:      shift?.name ?? null,
    shiftNameBn:    shift?.nameBn ?? null,
    shiftColor:     shift?.color ?? null,
    shiftStartTime: shift?.startTime ?? null,
    shiftEndTime:   shift?.endTime ?? null,
    createdAt:      row.createdAt.toISOString(),
    updatedAt:      row.updatedAt.toISOString(),
  };
}

/**
 * Calculate which slot index is "now" based on cycle type.
 * startDate is the anchor — slot 0 begins on startDate.
 */
function computeCurrentSlot(
  startDate:   string,
  cycleType:   RotationCycleType,
  cycleLength: number,
): number {
  const anchor = new Date(startDate);
  anchor.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs   = today.getTime() - anchor.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (cycleType === "daily") {
    // Each day advances the slot; negative diff wraps backwards
    return ((diffDays % cycleLength) + cycleLength) % cycleLength;
  }
  if (cycleType === "weekly") {
    const diffWeeks = Math.floor(diffDays / 7);
    return ((diffWeeks % cycleLength) + cycleLength) % cycleLength;
  }
  // monthly
  const anchorYear  = anchor.getFullYear();
  const anchorMonth = anchor.getMonth();
  const todayYear   = today.getFullYear();
  const todayMonth  = today.getMonth();
  const diffMonths  = (todayYear - anchorYear) * 12 + (todayMonth - anchorMonth);
  return ((diffMonths % cycleLength) + cycleLength) % cycleLength;
}

// ─── Rotation Pattern CRUD ────────────────────────────────────────────────────

export async function listRotationPatterns(shopId: number): Promise<RotationPatternDto[]> {
  const rows = await db
    .select()
    .from(rotationPatternsTable)
    .where(eq(rotationPatternsTable.shopId, shopId))
    .orderBy(desc(rotationPatternsTable.isDefault), rotationPatternsTable.name);
  return rows.map(toPatternDto);
}

export async function createRotationPattern(
  shopId: number,
  data: {
    name:        string;
    nameBn:      string;
    cycleType:   RotationCycleType;
    cycleLength: number;
    startDate:   string;
    isDefault?:  boolean;
  },
): Promise<RotationPatternDto> {
  if (data.cycleLength < 1 || data.cycleLength > 12) {
    throw new ValidationError("cycleLength must be between 1 and 12");
  }

  // If marking as default, unset all others for this shop
  if (data.isDefault) {
    await db
      .update(rotationPatternsTable)
      .set({ isDefault: false })
      .where(eq(rotationPatternsTable.shopId, shopId));
  }

  const inserted = await db
    .insert(rotationPatternsTable)
    .values({
      shopId,
      name:        data.name,
      nameBn:      data.nameBn,
      cycleType:   data.cycleType,
      cycleLength: data.cycleLength,
      startDate:   data.startDate,
      isDefault:   data.isDefault ?? false,
    })
    .returning();

  return toPatternDto(inserted[0]!);
}

export async function getRotationPatternWithSlots(
  shopId: number,
  id:     number,
): Promise<RotationPatternWithSlotsDto> {
  const patternRows = await db
    .select()
    .from(rotationPatternsTable)
    .where(and(eq(rotationPatternsTable.id, id), eq(rotationPatternsTable.shopId, shopId)))
    .limit(1);

  if (!patternRows[0]) throw new NotFoundError("Rotation pattern not found");

  const slotRows = await db
    .select({ slot: rotationPatternSlotsTable, shift: shiftsTable })
    .from(rotationPatternSlotsTable)
    .leftJoin(shiftsTable, eq(rotationPatternSlotsTable.shiftId, shiftsTable.id))
    .where(eq(rotationPatternSlotsTable.patternId, id))
    .orderBy(rotationPatternSlotsTable.slotIndex, rotationPatternSlotsTable.weekday);

  return {
    ...toPatternDto(patternRows[0]!),
    slots: slotRows.map((r) => toSlotDto(r.slot, r.shift ?? null)),
  };
}

export async function updateRotationPattern(
  shopId: number,
  id:     number,
  data: Partial<{
    name:        string;
    nameBn:      string;
    cycleType:   RotationCycleType;
    cycleLength: number;
    startDate:   string;
    isDefault:   boolean;
    isActive:    boolean;
  }>,
): Promise<RotationPatternDto> {
  const existing = await db
    .select()
    .from(rotationPatternsTable)
    .where(and(eq(rotationPatternsTable.id, id), eq(rotationPatternsTable.shopId, shopId)))
    .limit(1);

  if (!existing[0]) throw new NotFoundError("Rotation pattern not found");

  if (data.cycleLength !== undefined && (data.cycleLength < 1 || data.cycleLength > 12)) {
    throw new ValidationError("cycleLength must be between 1 and 12");
  }

  if (data.isDefault === true) {
    await db
      .update(rotationPatternsTable)
      .set({ isDefault: false })
      .where(and(eq(rotationPatternsTable.shopId, shopId)));
  }

  const updated = await db
    .update(rotationPatternsTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(rotationPatternsTable.id, id))
    .returning();

  return toPatternDto(updated[0]!);
}

export async function deleteRotationPattern(shopId: number, id: number): Promise<void> {
  const existing = await db
    .select({ id: rotationPatternsTable.id })
    .from(rotationPatternsTable)
    .where(and(eq(rotationPatternsTable.id, id), eq(rotationPatternsTable.shopId, shopId)))
    .limit(1);

  if (!existing[0]) throw new NotFoundError("Rotation pattern not found");
  await db.delete(rotationPatternsTable).where(eq(rotationPatternsTable.id, id));
}

// ─── Slots (bulk replace) ─────────────────────────────────────────────────────

export async function setRotationPatternSlots(
  shopId:    number,
  patternId: number,
  slots: Array<{ slotIndex: number; weekday?: number | null; shiftId?: number | null }>,
): Promise<RotationPatternSlotDto[]> {
  const pattern = await db
    .select()
    .from(rotationPatternsTable)
    .where(and(eq(rotationPatternsTable.id, patternId), eq(rotationPatternsTable.shopId, shopId)))
    .limit(1);

  if (!pattern[0]) throw new NotFoundError("Rotation pattern not found");

  // Delete existing slots and replace with new ones atomically
  await db.delete(rotationPatternSlotsTable).where(eq(rotationPatternSlotsTable.patternId, patternId));

  if (slots.length === 0) return [];

  const inserted = await db
    .insert(rotationPatternSlotsTable)
    .values(
      slots.map((s) => ({
        patternId,
        slotIndex: s.slotIndex,
        weekday:   s.weekday ?? null,
        shiftId:   s.shiftId ?? null,
      })),
    )
    .returning();

  // Fetch shift info for each inserted slot
  const shiftIds = [...new Set(inserted.map((r) => r.shiftId).filter((id): id is number => id !== null))];
  const shifts = shiftIds.length > 0
    ? await db.select().from(shiftsTable).where(eq(shiftsTable.shopId, shopId))
    : [];
  const shiftMap = new Map(shifts.map((s) => [s.id, s]));

  return inserted
    .sort((a, b) => a.slotIndex - b.slotIndex || (a.weekday ?? 0) - (b.weekday ?? 0))
    .map((row) => toSlotDto(row, row.shiftId ? (shiftMap.get(row.shiftId) ?? null) : null));
}

// ─── Employee Rotation Assignment ─────────────────────────────────────────────

export async function getEmployeeRotation(
  shopId:     number,
  employeeId: number,
): Promise<EmployeeRotationAssignmentDto | null> {
  const employee = await db
    .select({ id: employeesTable.id })
    .from(employeesTable)
    .where(and(eq(employeesTable.id, employeeId), eq(employeesTable.shopId, shopId)))
    .limit(1);

  if (!employee[0]) throw new NotFoundError("Employee not found");

  const rows = await db
    .select({
      rotation: employeeRotationsTable,
      pattern:  rotationPatternsTable,
    })
    .from(employeeRotationsTable)
    .innerJoin(rotationPatternsTable, eq(employeeRotationsTable.patternId, rotationPatternsTable.id))
    .where(
      and(
        eq(employeeRotationsTable.employeeId, employeeId),
        isNull(employeeRotationsTable.endDate),
      ),
    )
    .orderBy(desc(employeeRotationsTable.createdAt))
    .limit(1);

  if (!rows[0]) return null;

  const { rotation, pattern } = rows[0]!;
  return {
    id:            rotation.id,
    employeeId:    rotation.employeeId,
    patternId:     rotation.patternId,
    patternName:   pattern.name,
    patternNameBn: pattern.nameBn,
    cycleType:     pattern.cycleType,
    cycleLength:   pattern.cycleLength,
    startDate:     typeof rotation.startDate === "string"
      ? rotation.startDate
      : (rotation.startDate as Date).toISOString().split("T")[0]!,
    endDate:       rotation.endDate
      ? typeof rotation.endDate === "string"
        ? rotation.endDate
        : (rotation.endDate as Date).toISOString().split("T")[0]!
      : null,
    createdAt:     rotation.createdAt.toISOString(),
  };
}

export async function assignEmployeeRotation(
  shopId:     number,
  employeeId: number,
  patternId:  number,
  startDate:  string,
): Promise<EmployeeRotationAssignmentDto> {
  // Verify employee belongs to shop
  const employee = await db
    .select({ id: employeesTable.id })
    .from(employeesTable)
    .where(and(eq(employeesTable.id, employeeId), eq(employeesTable.shopId, shopId)))
    .limit(1);
  if (!employee[0]) throw new NotFoundError("Employee not found");

  // Verify pattern belongs to shop
  const pattern = await db
    .select()
    .from(rotationPatternsTable)
    .where(and(eq(rotationPatternsTable.id, patternId), eq(rotationPatternsTable.shopId, shopId)))
    .limit(1);
  if (!pattern[0]) throw new NotFoundError("Rotation pattern not found");

  // End any existing active rotation for this employee
  await db
    .update(employeeRotationsTable)
    .set({ endDate: startDate, updatedAt: new Date() })
    .where(
      and(
        eq(employeeRotationsTable.employeeId, employeeId),
        isNull(employeeRotationsTable.endDate),
      ),
    );

  const inserted = await db
    .insert(employeeRotationsTable)
    .values({ employeeId, patternId, startDate })
    .returning();

  return {
    id:            inserted[0]!.id,
    employeeId:    inserted[0]!.employeeId,
    patternId:     inserted[0]!.patternId,
    patternName:   pattern[0]!.name,
    patternNameBn: pattern[0]!.nameBn,
    cycleType:     pattern[0]!.cycleType,
    cycleLength:   pattern[0]!.cycleLength,
    startDate:     typeof inserted[0]!.startDate === "string"
      ? inserted[0]!.startDate
      : (inserted[0]!.startDate as Date).toISOString().split("T")[0]!,
    endDate:       null,
    createdAt:     inserted[0]!.createdAt.toISOString(),
  };
}

export async function removeEmployeeRotation(shopId: number, employeeId: number): Promise<void> {
  const employee = await db
    .select({ id: employeesTable.id })
    .from(employeesTable)
    .where(and(eq(employeesTable.id, employeeId), eq(employeesTable.shopId, shopId)))
    .limit(1);
  if (!employee[0]) throw new NotFoundError("Employee not found");

  const today = new Date().toISOString().split("T")[0]!;
  await db
    .update(employeeRotationsTable)
    .set({ endDate: today, updatedAt: new Date() })
    .where(
      and(
        eq(employeeRotationsTable.employeeId, employeeId),
        isNull(employeeRotationsTable.endDate),
      ),
    );
}

// ─── Effective Rotation Schedule (read-only, for Employee Profile) ─────────────

export async function getEmployeeRotationSchedule(
  shopId:     number,
  employeeId: number,
): Promise<EmployeeRotationScheduleDto> {
  const assignment = await getEmployeeRotation(shopId, employeeId);

  if (!assignment) {
    return {
      hasRotation:      false,
      patternId:        null,
      patternName:      null,
      patternNameBn:    null,
      cycleType:        null,
      cycleLength:      null,
      currentSlotIndex: null,
      days:             [],
    };
  }

  const currentSlot = computeCurrentSlot(
    assignment.startDate,
    assignment.cycleType,
    assignment.cycleLength,
  );

  // Fetch slots for this pattern filtered to current cycle slot
  const slotRows = await db
    .select({ slot: rotationPatternSlotsTable, shift: shiftsTable })
    .from(rotationPatternSlotsTable)
    .leftJoin(shiftsTable, eq(rotationPatternSlotsTable.shiftId, shiftsTable.id))
    .where(
      and(
        eq(rotationPatternSlotsTable.patternId, assignment.patternId),
        eq(rotationPatternSlotsTable.slotIndex, currentSlot),
      ),
    )
    .orderBy(rotationPatternSlotsTable.weekday);

  const days: RotationDaySlotDto[] = [];

  if (assignment.cycleType === "daily") {
    // For daily rotation, show only today (single slot, no weekday)
    const todayWeekday = new Date().getDay();
    const slot = slotRows[0];
    days.push({
      weekday:        todayWeekday,
      shiftId:        slot?.slot.shiftId ?? null,
      shiftName:      slot?.shift?.name ?? null,
      shiftNameBn:    slot?.shift?.nameBn ?? null,
      shiftColor:     slot?.shift?.color ?? null,
      shiftStartTime: slot?.shift?.startTime ?? null,
      shiftEndTime:   slot?.shift?.endTime ?? null,
    });
  } else {
    // For weekly / monthly: show all 7 weekdays mapped from slots
    const slotMap = new Map<number, typeof slotRows[number]>();
    for (const r of slotRows) {
      if (r.slot.weekday !== null) slotMap.set(r.slot.weekday, r);
    }
    for (let wd = 0; wd <= 6; wd++) {
      const r = slotMap.get(wd);
      days.push({
        weekday:        wd,
        shiftId:        r?.slot.shiftId ?? null,
        shiftName:      r?.shift?.name ?? null,
        shiftNameBn:    r?.shift?.nameBn ?? null,
        shiftColor:     r?.shift?.color ?? null,
        shiftStartTime: r?.shift?.startTime ?? null,
        shiftEndTime:   r?.shift?.endTime ?? null,
      });
    }
  }

  return {
    hasRotation:      true,
    patternId:        assignment.patternId,
    patternName:      assignment.patternName,
    patternNameBn:    assignment.patternNameBn,
    cycleType:        assignment.cycleType,
    cycleLength:      assignment.cycleLength,
    currentSlotIndex: currentSlot,
    days,
  };
}
