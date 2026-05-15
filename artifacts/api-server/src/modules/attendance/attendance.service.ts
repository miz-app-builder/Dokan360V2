import {
  db,
  attendanceTable,
  employeesTable,
  type AttendanceStatus,
} from "@workspace/db";
import {
  eq,
  and,
  gte,
  lte,
  desc,
  count,
  sql,
  inArray,
} from "drizzle-orm";
import { NotFoundError, ValidationError } from "../../common/errors";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AttendanceRecordDto = {
  id:               number;
  shopId:           number;
  employeeId:       number;
  employeeName:     string;
  employeeCode:     string | null;
  date:             string;
  checkIn:          string | null;
  checkOut:         string | null;
  status:           AttendanceStatus;
  lateMinutes:      number;
  overtimeMinutes:  number;
  note:             string | null;
  createdAt:        string;
  updatedAt:        string;
};

export type TodayAttendanceItemDto = {
  employeeId:   number;
  employeeName: string;
  employeeCode: string | null;
  status:       AttendanceStatus | null;
  checkIn:      string | null;
  checkOut:     string | null;
  lateMinutes:  number;
  attendanceId: number | null;
};

export type AttendanceReportEmployeeDto = {
  employeeId:           number;
  employeeName:         string;
  employeeCode:         string | null;
  present:              number;
  absent:               number;
  late:                 number;
  halfDay:              number;
  holiday:              number;
  leave:                number;
  totalDays:            number;
  presentDays:          number;
  lateMinutesTotal:     number;
  overtimeMinutesTotal: number;
  attendancePercent:    number;
};

export type ListAttendanceFilters = {
  employeeId?: number;
  from?:       string;
  to?:         string;
  status?:     AttendanceStatus;
  page?:       number;
  limit?:      number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDto(
  row: typeof attendanceTable.$inferSelect,
  employeeName: string,
  employeeCode: string | null,
): AttendanceRecordDto {
  return {
    id:              row.id,
    shopId:          row.shopId,
    employeeId:      row.employeeId,
    employeeName,
    employeeCode,
    date:            row.date,
    checkIn:         row.checkIn  ? row.checkIn.toISOString()  : null,
    checkOut:        row.checkOut ? row.checkOut.toISOString() : null,
    status:          row.status,
    lateMinutes:     row.lateMinutes,
    overtimeMinutes: row.overtimeMinutes,
    note:            row.note,
    createdAt:       row.createdAt.toISOString(),
    updatedAt:       row.updatedAt.toISOString(),
  };
}

function todayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

function calcLateMinutes(checkIn: Date, shiftStartHour = 9): number {
  const shiftStart = new Date(checkIn);
  shiftStart.setHours(shiftStartHour, 0, 0, 0);
  const diff = checkIn.getTime() - shiftStart.getTime();
  return diff > 0 ? Math.floor(diff / 60000) : 0;
}

function calcOvertimeMinutes(checkOut: Date, shiftEndHour = 18): number {
  const shiftEnd = new Date(checkOut);
  shiftEnd.setHours(shiftEndHour, 0, 0, 0);
  const diff = checkOut.getTime() - shiftEnd.getTime();
  return diff > 0 ? Math.floor(diff / 60000) : 0;
}

function workingDaysInMonth(year: number, month: number): number {
  let count = 0;
  const date = new Date(year, month - 1, 1);
  while (date.getMonth() === month - 1) {
    const day = date.getDay();
    if (day !== 5 && day !== 6) count++; // exclude Friday & Saturday (Bangladesh weekend)
    date.setDate(date.getDate() + 1);
  }
  return count;
}

// ─── Service Functions ────────────────────────────────────────────────────────

export async function listAttendance(
  shopId: number,
  filters: ListAttendanceFilters,
): Promise<{ data: AttendanceRecordDto[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const page  = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, filters.limit ?? 31);
  const offset = (page - 1) * limit;

  const conditions = [eq(attendanceTable.shopId, shopId)];
  if (filters.employeeId) conditions.push(eq(attendanceTable.employeeId, filters.employeeId));
  if (filters.from)       conditions.push(gte(attendanceTable.date, filters.from));
  if (filters.to)         conditions.push(lte(attendanceTable.date, filters.to));
  if (filters.status)     conditions.push(eq(attendanceTable.status, filters.status));

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        attendance: attendanceTable,
        employeeName: employeesTable.name,
        employeeCode: employeesTable.employeeCode,
      })
      .from(attendanceTable)
      .leftJoin(employeesTable, eq(attendanceTable.employeeId, employeesTable.id))
      .where(and(...conditions))
      .orderBy(desc(attendanceTable.date), desc(attendanceTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(attendanceTable).where(and(...conditions)),
  ]);

  const total = Number(totalRows[0]?.total ?? 0);

  return {
    data: rows.map((r) =>
      toDto(r.attendance, r.employeeName ?? "Unknown", r.employeeCode ?? null),
    ),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getTodayAttendance(
  shopId: number,
): Promise<{ date: string; data: TodayAttendanceItemDto[]; summary: { present: number; absent: number; late: number; notMarked: number; total: number } }> {
  const today = todayDateString();

  const [employees, todayRecords] = await Promise.all([
    db
      .select({ id: employeesTable.id, name: employeesTable.name, employeeCode: employeesTable.employeeCode })
      .from(employeesTable)
      .where(and(eq(employeesTable.shopId, shopId), eq(employeesTable.status, "active"))),
    db
      .select()
      .from(attendanceTable)
      .where(and(eq(attendanceTable.shopId, shopId), eq(attendanceTable.date, today))),
  ]);

  const recordMap = new Map<number, typeof attendanceTable.$inferSelect>();
  for (const r of todayRecords) recordMap.set(r.employeeId, r);

  const data: TodayAttendanceItemDto[] = employees.map((emp) => {
    const rec = recordMap.get(emp.id);
    return {
      employeeId:   emp.id,
      employeeName: emp.name,
      employeeCode: emp.employeeCode,
      status:       rec?.status ?? null,
      checkIn:      rec?.checkIn  ? rec.checkIn.toISOString()  : null,
      checkOut:     rec?.checkOut ? rec.checkOut.toISOString() : null,
      lateMinutes:  rec?.lateMinutes ?? 0,
      attendanceId: rec?.id ?? null,
    };
  });

  const summary = {
    present:   data.filter((d) => d.status === "present" || d.status === "late").length,
    absent:    data.filter((d) => d.status === "absent").length,
    late:      data.filter((d) => d.status === "late").length,
    notMarked: data.filter((d) => d.status === null).length,
    total:     data.length,
  };

  return { date: today, data, summary };
}

export async function checkIn(
  shopId: number,
  employeeId: number,
  checkInTime?: string,
  note?: string,
): Promise<AttendanceRecordDto> {
  const today = todayDateString();

  const employee = await db
    .select({ id: employeesTable.id, name: employeesTable.name, employeeCode: employeesTable.employeeCode })
    .from(employeesTable)
    .where(and(eq(employeesTable.id, employeeId), eq(employeesTable.shopId, shopId)))
    .limit(1);

  if (!employee[0]) throw new NotFoundError("Employee not found");

  const existing = await db
    .select()
    .from(attendanceTable)
    .where(and(eq(attendanceTable.employeeId, employeeId), eq(attendanceTable.date, today)))
    .limit(1);

  if (existing[0]?.checkIn) throw new ValidationError("Employee already checked in today");

  const now        = checkInTime ? new Date(checkInTime) : new Date();
  const lateMinutes = calcLateMinutes(now);
  const status: AttendanceStatus = lateMinutes > 0 ? "late" : "present";

  let record: typeof attendanceTable.$inferSelect;

  if (existing[0]) {
    const updated = await db
      .update(attendanceTable)
      .set({ checkIn: now, status, lateMinutes, note: note ?? null, updatedAt: new Date() })
      .where(eq(attendanceTable.id, existing[0].id))
      .returning();
    record = updated[0];
  } else {
    const inserted = await db
      .insert(attendanceTable)
      .values({ shopId, employeeId, date: today, checkIn: now, status, lateMinutes, note: note ?? null })
      .returning();
    record = inserted[0];
  }

  return toDto(record, employee[0].name, employee[0].employeeCode);
}

export async function checkOut(
  shopId: number,
  employeeId: number,
  checkOutTime?: string,
  note?: string,
): Promise<AttendanceRecordDto> {
  const today = todayDateString();

  const employee = await db
    .select({ id: employeesTable.id, name: employeesTable.name, employeeCode: employeesTable.employeeCode })
    .from(employeesTable)
    .where(and(eq(employeesTable.id, employeeId), eq(employeesTable.shopId, shopId)))
    .limit(1);

  if (!employee[0]) throw new NotFoundError("Employee not found");

  const existing = await db
    .select()
    .from(attendanceTable)
    .where(and(eq(attendanceTable.employeeId, employeeId), eq(attendanceTable.date, today)))
    .limit(1);

  if (!existing[0]) throw new ValidationError("No check-in found for today");
  if (!existing[0].checkIn) throw new ValidationError("Employee has not checked in yet");
  if (existing[0].checkOut) throw new ValidationError("Employee already checked out today");

  const now             = checkOutTime ? new Date(checkOutTime) : new Date();
  const overtimeMinutes = calcOvertimeMinutes(now);

  const updated = await db
    .update(attendanceTable)
    .set({ checkOut: now, overtimeMinutes, note: note ?? existing[0].note, updatedAt: new Date() })
    .where(eq(attendanceTable.id, existing[0].id))
    .returning();

  return toDto(updated[0], employee[0].name, employee[0].employeeCode);
}

export async function createAttendance(
  shopId: number,
  data: {
    employeeId:      number;
    date:            string;
    checkIn?:        string;
    checkOut?:       string;
    status:          AttendanceStatus;
    lateMinutes?:    number;
    overtimeMinutes?: number;
    note?:           string;
  },
): Promise<AttendanceRecordDto> {
  const employee = await db
    .select({ id: employeesTable.id, name: employeesTable.name, employeeCode: employeesTable.employeeCode })
    .from(employeesTable)
    .where(and(eq(employeesTable.id, data.employeeId), eq(employeesTable.shopId, shopId)))
    .limit(1);

  if (!employee[0]) throw new NotFoundError("Employee not found");

  const existing = await db
    .select({ id: attendanceTable.id })
    .from(attendanceTable)
    .where(and(eq(attendanceTable.employeeId, data.employeeId), eq(attendanceTable.date, data.date)))
    .limit(1);

  if (existing[0]) throw new ValidationError("Attendance already exists for this employee on this date");

  const inserted = await db
    .insert(attendanceTable)
    .values({
      shopId,
      employeeId:      data.employeeId,
      date:            data.date,
      checkIn:         data.checkIn  ? new Date(data.checkIn)  : null,
      checkOut:        data.checkOut ? new Date(data.checkOut) : null,
      status:          data.status,
      lateMinutes:     data.lateMinutes     ?? 0,
      overtimeMinutes: data.overtimeMinutes ?? 0,
      note:            data.note ?? null,
    })
    .returning();

  return toDto(inserted[0], employee[0].name, employee[0].employeeCode);
}

export async function updateAttendance(
  shopId: number,
  id:     number,
  data: {
    checkIn?:        string;
    checkOut?:       string;
    status?:         AttendanceStatus;
    lateMinutes?:    number;
    overtimeMinutes?: number;
    note?:           string;
  },
): Promise<AttendanceRecordDto> {
  const existing = await db
    .select({
      att:          attendanceTable,
      employeeName: employeesTable.name,
      employeeCode: employeesTable.employeeCode,
    })
    .from(attendanceTable)
    .leftJoin(employeesTable, eq(attendanceTable.employeeId, employeesTable.id))
    .where(and(eq(attendanceTable.id, id), eq(attendanceTable.shopId, shopId)))
    .limit(1);

  if (!existing[0]) throw new NotFoundError("Attendance record not found");

  const updated = await db
    .update(attendanceTable)
    .set({
      ...(data.checkIn  !== undefined && { checkIn:  new Date(data.checkIn)  }),
      ...(data.checkOut !== undefined && { checkOut: new Date(data.checkOut) }),
      ...(data.status         !== undefined && { status:          data.status         }),
      ...(data.lateMinutes    !== undefined && { lateMinutes:     data.lateMinutes    }),
      ...(data.overtimeMinutes !== undefined && { overtimeMinutes: data.overtimeMinutes }),
      ...(data.note           !== undefined && { note:            data.note           }),
      updatedAt: new Date(),
    })
    .where(eq(attendanceTable.id, id))
    .returning();

  return toDto(
    updated[0],
    existing[0].employeeName ?? "Unknown",
    existing[0].employeeCode ?? null,
  );
}

export async function deleteAttendance(shopId: number, id: number): Promise<void> {
  const existing = await db
    .select({ id: attendanceTable.id })
    .from(attendanceTable)
    .where(and(eq(attendanceTable.id, id), eq(attendanceTable.shopId, shopId)))
    .limit(1);

  if (!existing[0]) throw new NotFoundError("Attendance record not found");

  await db.delete(attendanceTable).where(eq(attendanceTable.id, id));
}

export async function getAttendanceReport(
  shopId:     number,
  year:       number,
  month:      number,
  employeeId?: number,
): Promise<{ year: number; month: number; workingDays: number; data: AttendanceReportEmployeeDto[] }> {
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to   = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const empConditions = [eq(employeesTable.shopId, shopId), eq(employeesTable.status, "active")];
  if (employeeId) empConditions.push(eq(employeesTable.id, employeeId));

  const [employees, records] = await Promise.all([
    db
      .select({ id: employeesTable.id, name: employeesTable.name, employeeCode: employeesTable.employeeCode })
      .from(employeesTable)
      .where(and(...empConditions)),
    db
      .select()
      .from(attendanceTable)
      .where(
        and(
          eq(attendanceTable.shopId, shopId),
          gte(attendanceTable.date, from),
          lte(attendanceTable.date, to),
          ...(employeeId ? [eq(attendanceTable.employeeId, employeeId)] : []),
        ),
      ),
  ]);

  const recordsByEmployee = new Map<number, (typeof attendanceTable.$inferSelect)[]>();
  for (const r of records) {
    const list = recordsByEmployee.get(r.employeeId) ?? [];
    list.push(r);
    recordsByEmployee.set(r.employeeId, list);
  }

  const wDays = workingDaysInMonth(year, month);

  const data: AttendanceReportEmployeeDto[] = employees.map((emp) => {
    const empRecords = recordsByEmployee.get(emp.id) ?? [];
    const present   = empRecords.filter((r) => r.status === "present").length;
    const absent    = empRecords.filter((r) => r.status === "absent").length;
    const late      = empRecords.filter((r) => r.status === "late").length;
    const halfDay   = empRecords.filter((r) => r.status === "half_day").length;
    const holiday   = empRecords.filter((r) => r.status === "holiday").length;
    const leave     = empRecords.filter((r) => r.status === "leave").length;
    const presentDays = present + late + halfDay;
    const lateMinutesTotal     = empRecords.reduce((s, r) => s + r.lateMinutes, 0);
    const overtimeMinutesTotal = empRecords.reduce((s, r) => s + r.overtimeMinutes, 0);
    const attendancePercent    = wDays > 0 ? Math.round((presentDays / wDays) * 100) : 0;

    return {
      employeeId:           emp.id,
      employeeName:         emp.name,
      employeeCode:         emp.employeeCode,
      present,
      absent,
      late,
      halfDay,
      holiday,
      leave,
      totalDays:            wDays,
      presentDays,
      lateMinutesTotal,
      overtimeMinutesTotal,
      attendancePercent,
    };
  });

  return { year, month, workingDays: wDays, data };
}
