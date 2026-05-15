import { db, leaveRequestsTable, employeesTable } from "@workspace/db";
import { eq, and, gte, lte, inArray } from "drizzle-orm";
import { listLeaveTypes } from "./leaves-types.service";
import type { LeaveBalanceDto } from "./leaves.types";

export async function listLeaveBalances(
  shopId: number,
  opts: { year?: number; employeeId?: number },
): Promise<LeaveBalanceDto[]> {
  const year = opts.year ?? new Date().getFullYear();

  const empWhere = opts.employeeId
    ? and(eq(employeesTable.shopId, shopId), eq(employeesTable.id, opts.employeeId), eq(employeesTable.status, "active"))
    : and(eq(employeesTable.shopId, shopId), eq(employeesTable.status, "active"));

  const employees = await db
    .select({ id: employeesTable.id, name: employeesTable.name, code: employeesTable.employeeCode })
    .from(employeesTable)
    .where(empWhere)
    .orderBy(employeesTable.name);

  const leaveTypes = await listLeaveTypes(shopId);
  const activeTypes = leaveTypes.filter((lt) => lt.isActive);

  if (employees.length === 0 || activeTypes.length === 0) return [];

  const empIds = employees.map((e) => e.id);

  const approved = await db
    .select({
      employeeId:  leaveRequestsTable.employeeId,
      leaveTypeId: leaveRequestsTable.leaveTypeId,
      days:        leaveRequestsTable.days,
    })
    .from(leaveRequestsTable)
    .where(
      and(
        eq(leaveRequestsTable.shopId, shopId),
        eq(leaveRequestsTable.status, "approved"),
        inArray(leaveRequestsTable.employeeId, empIds),
        gte(leaveRequestsTable.fromDate, `${year}-01-01`),
        lte(leaveRequestsTable.toDate,   `${year}-12-31`),
      ),
    );

  const usageMap = new Map<string, number>();
  for (const r of approved) {
    const key = `${r.employeeId}:${r.leaveTypeId}`;
    usageMap.set(key, (usageMap.get(key) ?? 0) + r.days);
  }

  const result: LeaveBalanceDto[] = [];
  for (const emp of employees) {
    for (const lt of activeTypes) {
      const used      = usageMap.get(`${emp.id}:${lt.id}`) ?? 0;
      const total     = lt.defaultDays;
      const remaining = Math.max(0, total - used);
      result.push({
        employeeId:      emp.id,
        employeeName:    emp.name,
        employeeCode:    emp.code,
        leaveTypeId:     lt.id,
        leaveTypeName:   lt.name,
        leaveTypeNameBn: lt.nameBn,
        leaveTypeColor:  lt.color,
        year,
        totalDays:       total,
        usedDays:        used,
        remainingDays:   remaining,
      });
    }
  }

  return result;
}
