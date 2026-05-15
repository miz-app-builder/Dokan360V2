import {
  db,
  shiftsTable,
  dutySchedulesTable,
  employeesTable,
  type ScheduleType,
} from "@workspace/db";
import { eq, and, or, gte, lte, inArray } from "drizzle-orm";
import { NotFoundError, ValidationError } from "../../common/errors";

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export type ShiftDto = {
  id:        number;
  shopId:    number;
  name:      string;
  nameBn:    string;
  startTime: string;
  endTime:   string;
  color:     string;
  isActive:  boolean;
  createdAt: string;
  updatedAt: string;
};

export type DutyScheduleDto = {
  id:             number;
  shopId:         number;
  employeeId:     number;
  employeeName:   string;
  employeeCode:   string | null;
  shiftId:        number | null;
  shiftName:      string | null;
  shiftNameBn:    string | null;
  shiftStartTime: string | null;
  shiftEndTime:   string | null;
  shiftColor:     string | null;
  type:           ScheduleType;
  weekday:        number | null;
  date:           string | null;
  note:           string | null;
  createdAt:      string;
  updatedAt:      string;
};

export type WeeklyDaySlot = {
  weekday:     number;
  scheduleId:  number | null;
  shiftId:     number | null;
  shiftName:   string | null;
  shiftNameBn: string | null;
  shiftColor:  string | null;
  isHoliday:   boolean;
};

export type WeeklyEmployeeRow = {
  employeeId:   number;
  employeeName: string;
  employeeCode: string | null;
  days:         WeeklyDaySlot[];
};

export type WeeklyScheduleResponse = {
  shifts: ShiftDto[];
  rows:   WeeklyEmployeeRow[];
};

export type CalendarDayAssignment = {
  employeeId:   number;
  employeeName: string;
  employeeCode: string | null;
  scheduleId:   number;
  shiftId:      number | null;
  shiftName:    string | null;
  shiftNameBn:  string | null;
  shiftColor:   string | null;
  isHoliday:    boolean;
  isOverride:   boolean;
};

export type CalendarDay = {
  date:        string;
  weekday:     number;
  assignments: CalendarDayAssignment[];
};

export type CalendarScheduleResponse = {
  year:  number;
  month: number;
  days:  CalendarDay[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toShiftDto(row: typeof shiftsTable.$inferSelect): ShiftDto {
  return {
    id:        row.id,
    shopId:    row.shopId,
    name:      row.name,
    nameBn:    row.nameBn,
    startTime: row.startTime,
    endTime:   row.endTime,
    color:     row.color,
    isActive:  row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toDutyDto(
  row: typeof dutySchedulesTable.$inferSelect,
  employee: { name: string; employeeCode: string | null },
  shift: { name: string; nameBn: string; startTime: string; endTime: string; color: string } | null,
): DutyScheduleDto {
  return {
    id:             row.id,
    shopId:         row.shopId,
    employeeId:     row.employeeId,
    employeeName:   employee.name,
    employeeCode:   employee.employeeCode,
    shiftId:        row.shiftId,
    shiftName:      shift?.name ?? null,
    shiftNameBn:    shift?.nameBn ?? null,
    shiftStartTime: shift?.startTime ?? null,
    shiftEndTime:   shift?.endTime ?? null,
    shiftColor:     shift?.color ?? null,
    type:           row.type,
    weekday:        row.weekday,
    date:           row.date,
    note:           row.note,
    createdAt:      row.createdAt.toISOString(),
    updatedAt:      row.updatedAt.toISOString(),
  };
}

// ─── Shift Services ───────────────────────────────────────────────────────────

export async function listShifts(shopId: number): Promise<ShiftDto[]> {
  const rows = await db
    .select()
    .from(shiftsTable)
    .where(eq(shiftsTable.shopId, shopId))
    .orderBy(shiftsTable.startTime);
  return rows.map(toShiftDto);
}

export async function createShift(
  shopId: number,
  data: { name: string; nameBn: string; startTime: string; endTime: string; color?: string },
): Promise<ShiftDto> {
  if (!data.startTime.match(/^\d{2}:\d{2}$/)) throw new ValidationError("Invalid startTime format — use HH:MM");
  if (!data.endTime.match(/^\d{2}:\d{2}$/))   throw new ValidationError("Invalid endTime format — use HH:MM");

  const inserted = await db
    .insert(shiftsTable)
    .values({
      shopId,
      name:      data.name,
      nameBn:    data.nameBn,
      startTime: data.startTime,
      endTime:   data.endTime,
      color:     data.color ?? "#6366f1",
    })
    .returning();

  return toShiftDto(inserted[0]);
}

export async function updateShift(
  shopId: number,
  id:     number,
  data: Partial<{ name: string; nameBn: string; startTime: string; endTime: string; color: string; isActive: boolean }>,
): Promise<ShiftDto> {
  const existing = await db
    .select()
    .from(shiftsTable)
    .where(and(eq(shiftsTable.id, id), eq(shiftsTable.shopId, shopId)))
    .limit(1);

  if (!existing[0]) throw new NotFoundError("Shift not found");

  const updated = await db
    .update(shiftsTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(shiftsTable.id, id))
    .returning();

  return toShiftDto(updated[0]);
}

export async function deleteShift(shopId: number, id: number): Promise<void> {
  const existing = await db
    .select({ id: shiftsTable.id })
    .from(shiftsTable)
    .where(and(eq(shiftsTable.id, id), eq(shiftsTable.shopId, shopId)))
    .limit(1);

  if (!existing[0]) throw new NotFoundError("Shift not found");

  await db.delete(shiftsTable).where(eq(shiftsTable.id, id));
}

// ─── Schedule Services ────────────────────────────────────────────────────────

export async function listSchedules(
  shopId: number,
  filters: { employeeId?: number; type?: ScheduleType; month?: number; year?: number },
): Promise<DutyScheduleDto[]> {
  const conditions = [eq(dutySchedulesTable.shopId, shopId)];

  if (filters.employeeId) conditions.push(eq(dutySchedulesTable.employeeId, filters.employeeId));
  if (filters.type)       conditions.push(eq(dutySchedulesTable.type, filters.type));

  if (filters.year && filters.month) {
    const from = `${filters.year}-${String(filters.month).padStart(2, "0")}-01`;
    const lastDay = new Date(filters.year, filters.month, 0).getDate();
    const to   = `${filters.year}-${String(filters.month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    conditions.push(
      or(
        eq(dutySchedulesTable.type, "weekly"),
        and(gte(dutySchedulesTable.date, from), lte(dutySchedulesTable.date, to)),
      )!,
    );
  }

  const rows = await db
    .select({
      schedule:     dutySchedulesTable,
      employeeName: employeesTable.name,
      employeeCode: employeesTable.employeeCode,
      shift:        shiftsTable,
    })
    .from(dutySchedulesTable)
    .leftJoin(employeesTable, eq(dutySchedulesTable.employeeId, employeesTable.id))
    .leftJoin(shiftsTable, eq(dutySchedulesTable.shiftId, shiftsTable.id))
    .where(and(...conditions))
    .orderBy(dutySchedulesTable.createdAt);

  return rows.map((r) =>
    toDutyDto(
      r.schedule,
      { name: r.employeeName ?? "Unknown", employeeCode: r.employeeCode ?? null },
      r.shift ?? null,
    ),
  );
}

export async function createSchedule(
  shopId: number,
  data: {
    employeeId: number;
    shiftId?:   number;
    type:       ScheduleType;
    weekday?:   number;
    date?:      string;
    note?:      string;
  },
): Promise<DutyScheduleDto> {
  if (data.type === "weekly" && (data.weekday === undefined || data.weekday < 0 || data.weekday > 6)) {
    throw new ValidationError("weekday (0-6) is required for weekly schedules");
  }
  if (data.type !== "weekly" && !data.date) {
    throw new ValidationError("date is required for specific_date and holiday schedules");
  }

  const employee = await db
    .select({ id: employeesTable.id, name: employeesTable.name, employeeCode: employeesTable.employeeCode })
    .from(employeesTable)
    .where(and(eq(employeesTable.id, data.employeeId), eq(employeesTable.shopId, shopId)))
    .limit(1);

  if (!employee[0]) throw new NotFoundError("Employee not found");

  let shift: typeof shiftsTable.$inferSelect | null = null;
  if (data.shiftId) {
    const shiftRows = await db
      .select()
      .from(shiftsTable)
      .where(and(eq(shiftsTable.id, data.shiftId), eq(shiftsTable.shopId, shopId)))
      .limit(1);
    if (!shiftRows[0]) throw new NotFoundError("Shift not found");
    shift = shiftRows[0];
  }

  // Conflict check: same employee + same weekday/date + same type
  if (data.type === "weekly") {
    const conflict = await db
      .select({ id: dutySchedulesTable.id })
      .from(dutySchedulesTable)
      .where(
        and(
          eq(dutySchedulesTable.shopId, shopId),
          eq(dutySchedulesTable.employeeId, data.employeeId),
          eq(dutySchedulesTable.type, "weekly"),
          eq(dutySchedulesTable.weekday, data.weekday!),
        ),
      )
      .limit(1);
    if (conflict[0]) throw new ValidationError("A weekly schedule already exists for this employee on this weekday");
  }

  const inserted = await db
    .insert(dutySchedulesTable)
    .values({
      shopId,
      employeeId: data.employeeId,
      shiftId:    data.shiftId ?? null,
      type:       data.type,
      weekday:    data.weekday ?? null,
      date:       data.date ?? null,
      note:       data.note ?? null,
    })
    .returning();

  return toDutyDto(
    inserted[0],
    { name: employee[0].name, employeeCode: employee[0].employeeCode },
    shift,
  );
}

export async function updateSchedule(
  shopId: number,
  id:     number,
  data: Partial<{ shiftId: number; note: string }>,
): Promise<DutyScheduleDto> {
  const existing = await db
    .select({
      schedule:     dutySchedulesTable,
      employeeName: employeesTable.name,
      employeeCode: employeesTable.employeeCode,
    })
    .from(dutySchedulesTable)
    .leftJoin(employeesTable, eq(dutySchedulesTable.employeeId, employeesTable.id))
    .where(and(eq(dutySchedulesTable.id, id), eq(dutySchedulesTable.shopId, shopId)))
    .limit(1);

  if (!existing[0]) throw new NotFoundError("Schedule entry not found");

  const updated = await db
    .update(dutySchedulesTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(dutySchedulesTable.id, id))
    .returning();

  let shift: typeof shiftsTable.$inferSelect | null = null;
  const newShiftId = updated[0].shiftId;
  if (newShiftId) {
    const shiftRows = await db.select().from(shiftsTable).where(eq(shiftsTable.id, newShiftId)).limit(1);
    shift = shiftRows[0] ?? null;
  }

  return toDutyDto(
    updated[0],
    { name: existing[0].employeeName ?? "Unknown", employeeCode: existing[0].employeeCode ?? null },
    shift,
  );
}

export async function deleteSchedule(shopId: number, id: number): Promise<void> {
  const existing = await db
    .select({ id: dutySchedulesTable.id })
    .from(dutySchedulesTable)
    .where(and(eq(dutySchedulesTable.id, id), eq(dutySchedulesTable.shopId, shopId)))
    .limit(1);

  if (!existing[0]) throw new NotFoundError("Schedule entry not found");
  await db.delete(dutySchedulesTable).where(eq(dutySchedulesTable.id, id));
}

export async function getWeeklySchedule(shopId: number): Promise<WeeklyScheduleResponse> {
  const [shifts, employees, weeklyRows] = await Promise.all([
    db.select().from(shiftsTable).where(and(eq(shiftsTable.shopId, shopId), eq(shiftsTable.isActive, true))).orderBy(shiftsTable.startTime),
    db
      .select({ id: employeesTable.id, name: employeesTable.name, employeeCode: employeesTable.employeeCode })
      .from(employeesTable)
      .where(and(eq(employeesTable.shopId, shopId), eq(employeesTable.status, "active"))),
    db
      .select({ schedule: dutySchedulesTable, shift: shiftsTable })
      .from(dutySchedulesTable)
      .leftJoin(shiftsTable, eq(dutySchedulesTable.shiftId, shiftsTable.id))
      .where(and(eq(dutySchedulesTable.shopId, shopId), eq(dutySchedulesTable.type, "weekly"))),
  ]);

  const scheduleMap = new Map<string, typeof weeklyRows[number]>();
  for (const row of weeklyRows) {
    const key = `${row.schedule.employeeId}-${row.schedule.weekday}`;
    scheduleMap.set(key, row);
  }

  const rows: WeeklyEmployeeRow[] = employees.map((emp) => {
    const days: WeeklyDaySlot[] = [0, 1, 2, 3, 4, 5, 6].map((wd) => {
      const entry = scheduleMap.get(`${emp.id}-${wd}`);
      return {
        weekday:     wd,
        scheduleId:  entry?.schedule.id ?? null,
        shiftId:     entry?.schedule.shiftId ?? null,
        shiftName:   entry?.shift?.name ?? null,
        shiftNameBn: entry?.shift?.nameBn ?? null,
        shiftColor:  entry?.shift?.color ?? null,
        isHoliday:   entry?.schedule.type === "holiday",
      };
    });
    return { employeeId: emp.id, employeeName: emp.name, employeeCode: emp.employeeCode, days };
  });

  return { shifts: shifts.map(toShiftDto), rows };
}

export async function getCalendarSchedule(
  shopId: number,
  year:   number,
  month:  number,
): Promise<CalendarScheduleResponse> {
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to   = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const [employees, weeklyRows, specificRows] = await Promise.all([
    db
      .select({ id: employeesTable.id, name: employeesTable.name, employeeCode: employeesTable.employeeCode })
      .from(employeesTable)
      .where(and(eq(employeesTable.shopId, shopId), eq(employeesTable.status, "active"))),
    db
      .select({ schedule: dutySchedulesTable, shift: shiftsTable })
      .from(dutySchedulesTable)
      .leftJoin(shiftsTable, eq(dutySchedulesTable.shiftId, shiftsTable.id))
      .where(and(eq(dutySchedulesTable.shopId, shopId), eq(dutySchedulesTable.type, "weekly"))),
    db
      .select({ schedule: dutySchedulesTable, shift: shiftsTable })
      .from(dutySchedulesTable)
      .leftJoin(shiftsTable, eq(dutySchedulesTable.shiftId, shiftsTable.id))
      .where(
        and(
          eq(dutySchedulesTable.shopId, shopId),
          inArray(dutySchedulesTable.type, ["specific_date", "holiday"]),
          gte(dutySchedulesTable.date, from),
          lte(dutySchedulesTable.date, to),
        ),
      ),
  ]);

  const employeeMap = new Map(employees.map((e) => [e.id, e]));

  // Build lookup: employeeId → weekday → weekly entry
  const weeklyMap = new Map<string, typeof weeklyRows[number]>();
  for (const r of weeklyRows) {
    if (r.schedule.weekday !== null) {
      weeklyMap.set(`${r.schedule.employeeId}-${r.schedule.weekday}`, r);
    }
  }

  // Build lookup: employeeId → date → specific entry
  const specificMap = new Map<string, typeof specificRows[number]>();
  for (const r of specificRows) {
    if (r.schedule.date) specificMap.set(`${r.schedule.employeeId}-${r.schedule.date}`, r);
  }

  const days: CalendarDay[] = [];
  for (let d = 1; d <= lastDay; d++) {
    const dateStr  = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const weekday  = new Date(dateStr).getDay(); // 0=Sunday … 6=Saturday
    const assignments: CalendarDayAssignment[] = [];

    for (const emp of employees) {
      const specificKey = `${emp.id}-${dateStr}`;
      const weeklyKey   = `${emp.id}-${weekday}`;

      const specific = specificMap.get(specificKey);
      const weekly   = weeklyMap.get(weeklyKey);

      if (specific) {
        // Specific date overrides weekly
        assignments.push({
          employeeId:   emp.id,
          employeeName: emp.name,
          employeeCode: emp.employeeCode,
          scheduleId:   specific.schedule.id,
          shiftId:      specific.schedule.shiftId,
          shiftName:    specific.shift?.name ?? null,
          shiftNameBn:  specific.shift?.nameBn ?? null,
          shiftColor:   specific.shift?.color ?? null,
          isHoliday:    specific.schedule.type === "holiday",
          isOverride:   true,
        });
      } else if (weekly) {
        assignments.push({
          employeeId:   emp.id,
          employeeName: emp.name,
          employeeCode: emp.employeeCode,
          scheduleId:   weekly.schedule.id,
          shiftId:      weekly.schedule.shiftId,
          shiftName:    weekly.shift?.name ?? null,
          shiftNameBn:  weekly.shift?.nameBn ?? null,
          shiftColor:   weekly.shift?.color ?? null,
          isHoliday:    weekly.schedule.type === "holiday",
          isOverride:   false,
        });
      }
    }

    days.push({ date: dateStr, weekday, assignments });
  }

  return { year, month, days };
}
