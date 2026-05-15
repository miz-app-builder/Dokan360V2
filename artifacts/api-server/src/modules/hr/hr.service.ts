import {
  db,
  attendanceTable,
  employeesTable,
  payrollRecordsTable,
  leaveRequestsTable,
  leaveTypesTable,
} from "@workspace/db";
import { eq, and, gte, lte, inArray } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

type AttendanceTrendItem = {
  month:          number;
  year:           number;
  presentDays:    number;
  absentDays:     number;
  attendanceRate: number;
};

type EmployeeRowDto = {
  employeeId:        number;
  name:              string;
  attendancePercent: number;
  presentDays:       number;
  workingDays:       number;
  lateMinutes:       number;
};

export type HrAnalyticsDto = {
  month:                number;
  year:                 number;
  totalActiveEmployees: number;
  attendance: {
    totalPresent:       number;
    totalAbsent:        number;
    totalLate:          number;
    totalHalfDay:       number;
    attendanceRate:     number;
    avgLateMinutes:     number;
    avgOvertimeMinutes: number;
    monthlyTrend:       AttendanceTrendItem[];
  };
  payroll: {
    totalGross:       number;
    totalNet:         number;
    avgNet:           number;
    paidCount:        number;
    unpaidCount:      number;
    totalOvertimePay: number;
  };
  leave: {
    totalRequests: number;
    pending:       number;
    approved:      number;
    rejected:      number;
    byType:        { leaveTypeName: string; count: number }[];
  };
  topPerformers: EmployeeRowDto[];
  lateLeaders:   EmployeeRowDto[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function workingDaysInMonth(year: number, month: number): number {
  const lastDay = new Date(year, month, 0).getDate();
  let cnt = 0;
  for (let d = 1; d <= lastDay; d++) {
    const dow = new Date(year, month - 1, d).getDay();
    if (dow !== 0 && dow !== 6) cnt++;
  }
  return cnt;
}

/**
 * If month/year is the current (incomplete) month, returns working days elapsed
 * up to and including today. For past/future months returns full month working days.
 */
function effectiveWorkingDays(year: number, month: number): number {
  const now   = new Date();
  const nowY  = now.getFullYear();
  const nowM  = now.getMonth() + 1;

  if (year === nowY && month === nowM) {
    const today = now.getDate();
    let cnt = 0;
    for (let d = 1; d <= today; d++) {
      const dow = new Date(year, month - 1, d).getDay();
      if (dow !== 0 && dow !== 6) cnt++;
    }
    return Math.max(cnt, 1);
  }
  return workingDaysInMonth(year, month);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function monthDateRange(year: number, month: number): { start: string; end: string } {
  const lastDay = new Date(year, month, 0).getDate();
  return {
    start: `${year}-${pad2(month)}-01`,
    end:   `${year}-${pad2(month)}-${pad2(lastDay)}`,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export async function getHrAnalytics(
  shopId: number,
  month:  number,
  year:   number,
): Promise<HrAnalyticsDto> {
  const wDays     = effectiveWorkingDays(year, month);
  const dateRange = monthDateRange(year, month);

  // Active employees for this shop
  const employees = await db
    .select({ id: employeesTable.id, name: employeesTable.name })
    .from(employeesTable)
    .where(and(eq(employeesTable.shopId, shopId), eq(employeesTable.status, "active")));

  const empCount = employees.length;
  const empIds   = employees.map((e) => e.id);

  // ── Attendance this month ─────────────────────────────────────────────────
  const attRows =
    empIds.length > 0
      ? await db
          .select()
          .from(attendanceTable)
          .where(
            and(
              eq(attendanceTable.shopId, shopId),
              gte(attendanceTable.date, dateRange.start),
              lte(attendanceTable.date, dateRange.end),
            ),
          )
      : [];

  // Aggregate totals + per-employee stats
  let totalPresent = 0, totalAbsent = 0, totalLate = 0, totalHalfDay = 0;
  let totalLateMin = 0, totalOtMin = 0;

  type EmpStat = { present: number; absent: number; late: number; halfDay: number; lateMin: number; otMin: number };
  const empStats = new Map<number, EmpStat>();

  for (const row of attRows) {
    if (!empStats.has(row.employeeId)) {
      empStats.set(row.employeeId, { present: 0, absent: 0, late: 0, halfDay: 0, lateMin: 0, otMin: 0 });
    }
    const s = empStats.get(row.employeeId)!;

    switch (row.status) {
      case "present":  s.present++;  totalPresent++;  break;
      case "absent":   s.absent++;   totalAbsent++;   break;
      case "late":     s.late++;     totalLate++;     break;
      case "half_day": s.halfDay++;  totalHalfDay++;  break;
      default: break;
    }
    s.lateMin += row.lateMinutes;
    s.otMin   += row.overtimeMinutes;
    totalLateMin += row.lateMinutes;
    totalOtMin   += row.overtimeMinutes;
  }

  const trackedSlots  = Math.max(empCount, 1) * Math.max(wDays, 1);
  const earnedDays    = totalPresent + totalLate + Math.round(totalHalfDay / 2);
  const attendanceRate     = Math.round((earnedDays / trackedSlots) * 100 * 10) / 10;
  const avgLateMinutes     = empCount > 0 ? Math.round(totalLateMin / empCount) : 0;
  const avgOvertimeMinutes = empCount > 0 ? Math.round(totalOtMin   / empCount) : 0;

  // ── 6-month attendance trend ──────────────────────────────────────────────
  const monthlyTrend: AttendanceTrendItem[] = [];
  for (let i = 5; i >= 0; i--) {
    const d  = new Date(year, month - 1 - i, 1);
    const m  = d.getMonth() + 1;
    const y  = d.getFullYear();
    const dr = monthDateRange(y, m);
    const mw = workingDaysInMonth(y, m);

    const mRows = await db
      .select({ status: attendanceTable.status })
      .from(attendanceTable)
      .where(
        and(
          eq(attendanceTable.shopId, shopId),
          gte(attendanceTable.date, dr.start),
          lte(attendanceTable.date, dr.end),
        ),
      );

    const mPresent = mRows.filter((r) => r.status === "present" || r.status === "late").length;
    const mAbsent  = mRows.filter((r) => r.status === "absent").length;
    const effMw    = effectiveWorkingDays(y, m);
    const mSlots   = Math.max(empCount, 1) * Math.max(effMw, 1);
    const mRate    = Math.round((mPresent / mSlots) * 100 * 10) / 10;

    monthlyTrend.push({ month: m, year: y, presentDays: mPresent, absentDays: mAbsent, attendanceRate: mRate });
  }

  // ── Payroll stats ─────────────────────────────────────────────────────────
  const payrollRows = await db
    .select({
      grossSalary:   payrollRecordsTable.grossSalary,
      netSalary:     payrollRecordsTable.netSalary,
      overtimePay:   payrollRecordsTable.overtimePay,
      paymentStatus: payrollRecordsTable.paymentStatus,
    })
    .from(payrollRecordsTable)
    .where(
      and(
        eq(payrollRecordsTable.shopId, shopId),
        eq(payrollRecordsTable.month, month),
        eq(payrollRecordsTable.year,  year),
      ),
    );

  let totalGross = 0, totalNet = 0, totalOvertimePay = 0, paidCount = 0, unpaidCount = 0;
  for (const pr of payrollRows) {
    totalGross      += Number(pr.grossSalary);
    totalNet        += Number(pr.netSalary);
    totalOvertimePay += Number(pr.overtimePay);
    if (pr.paymentStatus === "paid") paidCount++;
    else unpaidCount++;
  }
  const avgNet = payrollRows.length > 0 ? Math.round(totalNet / payrollRows.length) : 0;

  // ── Leave stats ───────────────────────────────────────────────────────────
  const leaveRows = await db
    .select({ status: leaveRequestsTable.status, leaveTypeId: leaveRequestsTable.leaveTypeId })
    .from(leaveRequestsTable)
    .where(
      and(
        eq(leaveRequestsTable.shopId, shopId),
        gte(leaveRequestsTable.fromDate, dateRange.start),
        lte(leaveRequestsTable.fromDate, dateRange.end),
      ),
    );

  let pending = 0, approved = 0, rejected = 0;
  const ltCountMap = new Map<number, number>();
  for (const lr of leaveRows) {
    if      (lr.status === "pending")  pending++;
    else if (lr.status === "approved") approved++;
    else if (lr.status === "rejected") rejected++;
    ltCountMap.set(lr.leaveTypeId, (ltCountMap.get(lr.leaveTypeId) ?? 0) + 1);
  }

  const ltIds = [...ltCountMap.keys()];
  const ltRows = ltIds.length > 0
    ? await db.select({ id: leaveTypesTable.id, name: leaveTypesTable.name })
        .from(leaveTypesTable)
        .where(inArray(leaveTypesTable.id, ltIds))
    : [];
  const ltMap = new Map(ltRows.map((lt) => [lt.id, lt.name]));
  const byType = ltIds.map((id) => ({
    leaveTypeName: ltMap.get(id) ?? "Unknown",
    count:         ltCountMap.get(id) ?? 0,
  }));

  // ── Per-employee performance rows ─────────────────────────────────────────
  const perfRows: EmployeeRowDto[] = employees.map((emp) => {
    const s      = empStats.get(emp.id) ?? { present: 0, absent: 0, late: 0, halfDay: 0, lateMin: 0, otMin: 0 };
    const earned = s.present + s.late + Math.round(s.halfDay / 2);
    const pct    = wDays > 0 ? Math.round((earned / wDays) * 100) : 0;
    return {
      employeeId:        emp.id,
      name:              emp.name,
      attendancePercent: pct,
      presentDays:       s.present + s.late + s.halfDay,
      workingDays:       wDays,
      lateMinutes:       s.lateMin,
    };
  });

  const topPerformers = [...perfRows].sort((a, b) => b.attendancePercent - a.attendancePercent).slice(0, 5);
  const lateLeaders   = [...perfRows].filter((r) => r.lateMinutes > 0).sort((a, b) => b.lateMinutes - a.lateMinutes).slice(0, 5);

  return {
    month,
    year,
    totalActiveEmployees: empCount,
    attendance: {
      totalPresent,
      totalAbsent,
      totalLate,
      totalHalfDay,
      attendanceRate,
      avgLateMinutes,
      avgOvertimeMinutes,
      monthlyTrend,
    },
    payroll: {
      totalGross:       Math.round(totalGross),
      totalNet:         Math.round(totalNet),
      avgNet:           Math.round(avgNet),
      paidCount,
      unpaidCount,
      totalOvertimePay: Math.round(totalOvertimePay),
    },
    leave: {
      totalRequests: leaveRows.length,
      pending,
      approved,
      rejected,
      byType,
    },
    topPerformers,
    lateLeaders,
  };
}
