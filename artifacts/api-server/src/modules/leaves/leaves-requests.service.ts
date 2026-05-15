import {
  db,
  leaveTypesTable,
  leaveRequestsTable,
  employeesTable,
  usersTable,
  type LeaveStatus,
} from "@workspace/db";
import { eq, and, gte, lte, desc, count, sql } from "drizzle-orm";
import { NotFoundError, ValidationError } from "../../common/errors";
import { createNotification } from "../notifications/notifications.service";
import type { LeaveRequestDto, ListRequestsOpts, PaginatedLeaveRequests } from "./leaves.types";

// ─── Mapper ───────────────────────────────────────────────────────────────────

async function buildRequestDto(row: typeof leaveRequestsTable.$inferSelect): Promise<LeaveRequestDto> {
  const [emp] = await db
    .select({ name: employeesTable.name, code: employeesTable.employeeCode })
    .from(employeesTable)
    .where(eq(employeesTable.id, row.employeeId));

  const [lt] = await db
    .select({ name: leaveTypesTable.name, nameBn: leaveTypesTable.nameBn, color: leaveTypesTable.color })
    .from(leaveTypesTable)
    .where(eq(leaveTypesTable.id, row.leaveTypeId));

  let approvedByName: string | null = null;
  if (row.approvedById) {
    const [approver] = await db
      .select({ name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, row.approvedById));
    approvedByName = approver?.name ?? null;
  }

  return {
    id: row.id, shopId: row.shopId, employeeId: row.employeeId,
    employeeName: emp?.name ?? "", employeeCode: emp?.code ?? null,
    leaveTypeId: row.leaveTypeId, leaveTypeName: lt?.name ?? "",
    leaveTypeNameBn: lt?.nameBn ?? "", leaveTypeColor: lt?.color ?? "#10b981",
    fromDate: row.fromDate, toDate: row.toDate, days: row.days,
    reason: row.reason, status: row.status, approvedByName,
    approvedAt: row.approvedAt?.toISOString() ?? null,
    rejectedReason: row.rejectedReason,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function calcDays(from: string, to: string): number {
  return Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1);
}

// ─── Public service functions ──────────────────────────────────────────────────

export async function listLeaveRequests(
  shopId: number,
  opts: ListRequestsOpts,
): Promise<PaginatedLeaveRequests> {
  const conditions = [eq(leaveRequestsTable.shopId, shopId)];
  if (opts.employeeId) conditions.push(eq(leaveRequestsTable.employeeId, opts.employeeId));
  if (opts.status)     conditions.push(eq(leaveRequestsTable.status, opts.status));
  if (opts.from)       conditions.push(gte(leaveRequestsTable.fromDate, opts.from));
  if (opts.to)         conditions.push(lte(leaveRequestsTable.toDate, opts.to));
  if (opts.year) {
    conditions.push(gte(leaveRequestsTable.fromDate, `${opts.year}-01-01`));
    conditions.push(lte(leaveRequestsTable.toDate,   `${opts.year}-12-31`));
  }

  const where  = and(...conditions);
  const offset = (opts.page - 1) * opts.limit;

  const [totalRow] = await db.select({ c: count() }).from(leaveRequestsTable).where(where);
  const total = Number(totalRow?.c ?? 0);

  const rows = await db
    .select().from(leaveRequestsTable)
    .where(where).orderBy(desc(leaveRequestsTable.createdAt))
    .limit(opts.limit).offset(offset);

  const data = await Promise.all(rows.map(buildRequestDto));
  return { data, total, page: opts.page, limit: opts.limit };
}

export async function createLeaveRequest(
  shopId: number,
  data: { employeeId: number; leaveTypeId: number; fromDate: string; toDate: string; reason?: string },
): Promise<LeaveRequestDto> {
  const days = calcDays(data.fromDate, data.toDate);
  const overlapping = await db
    .select({ id: leaveRequestsTable.id }).from(leaveRequestsTable)
    .where(
      and(
        eq(leaveRequestsTable.shopId, shopId),
        eq(leaveRequestsTable.employeeId, data.employeeId),
        sql`status != 'cancelled'`,
        lte(leaveRequestsTable.fromDate, data.toDate),
        gte(leaveRequestsTable.toDate, data.fromDate),
      ),
    ).limit(1);

  if (overlapping.length > 0) throw new ValidationError("Employee already has a leave request in this date range");

  const [row] = await db.insert(leaveRequestsTable).values({ shopId, ...data, days }).returning();
  if (!row) throw new Error("Insert failed");
  return buildRequestDto(row);
}

export async function updateLeaveRequest(
  shopId: number,
  id: number,
  data: Partial<{ fromDate: string; toDate: string; reason: string }>,
): Promise<LeaveRequestDto> {
  const [existing] = await db.select().from(leaveRequestsTable)
    .where(and(eq(leaveRequestsTable.id, id), eq(leaveRequestsTable.shopId, shopId)));
  if (!existing) throw new NotFoundError("Leave request not found");
  if (existing.status !== "pending") throw new ValidationError("Only pending requests can be updated");

  const fromDate = data.fromDate ?? existing.fromDate;
  const toDate   = data.toDate   ?? existing.toDate;
  const days     = calcDays(fromDate, toDate);

  const [row] = await db
    .update(leaveRequestsTable).set({ ...data, days, updatedAt: new Date() })
    .where(and(eq(leaveRequestsTable.id, id), eq(leaveRequestsTable.shopId, shopId)))
    .returning();
  if (!row) throw new NotFoundError("Leave request not found");
  return buildRequestDto(row);
}

async function getEmployeeUserId(employeeId: number): Promise<number | null> {
  const [emp] = await db
    .select({ userId: employeesTable.userId })
    .from(employeesTable)
    .where(eq(employeesTable.id, employeeId));
  return emp?.userId ?? null;
}

async function getLeaveTypeNameBn(leaveTypeId: number): Promise<string> {
  const [lt] = await db
    .select({ nameBn: leaveTypesTable.nameBn })
    .from(leaveTypesTable)
    .where(eq(leaveTypesTable.id, leaveTypeId));
  return lt?.nameBn ?? "ছুটি";
}

export async function approveLeaveRequest(
  shopId: number, id: number, approverId: number, note?: string,
): Promise<LeaveRequestDto> {
  const [existing] = await db.select().from(leaveRequestsTable)
    .where(and(eq(leaveRequestsTable.id, id), eq(leaveRequestsTable.shopId, shopId)));
  if (!existing) throw new NotFoundError("Leave request not found");
  if (existing.status !== "pending") throw new ValidationError("Only pending requests can be approved");

  const [row] = await db
    .update(leaveRequestsTable)
    .set({ status: "approved", approvedById: approverId, approvedAt: new Date(), rejectedReason: note ?? null, updatedAt: new Date() })
    .where(and(eq(leaveRequestsTable.id, id), eq(leaveRequestsTable.shopId, shopId)))
    .returning();
  if (!row) throw new NotFoundError("Leave request not found");

  const [userId, leaveTypeName] = await Promise.all([
    getEmployeeUserId(existing.employeeId),
    getLeaveTypeNameBn(existing.leaveTypeId),
  ]);

  await createNotification({
    shopId,
    userId,
    type:       "leave_approved",
    title:      JSON.stringify({ bn: "ছুটির আবেদন অনুমোদিত হয়েছে", en: "Leave request approved" }),
    body:       JSON.stringify({
      bn: `আপনার ${leaveTypeName} আবেদন (${existing.fromDate} থেকে ${existing.toDate}) অনুমোদন করা হয়েছে।`,
      en: `Your leave request (${existing.fromDate} to ${existing.toDate}) has been approved.`,
    }),
    entityType: "leave_request",
    entityId:   id,
  });

  return buildRequestDto(row);
}

export async function rejectLeaveRequest(
  shopId: number, id: number, approverId: number, reason: string,
): Promise<LeaveRequestDto> {
  const [existing] = await db.select().from(leaveRequestsTable)
    .where(and(eq(leaveRequestsTable.id, id), eq(leaveRequestsTable.shopId, shopId)));
  if (!existing) throw new NotFoundError("Leave request not found");
  if (existing.status !== "pending") throw new ValidationError("Only pending requests can be rejected");

  const [row] = await db
    .update(leaveRequestsTable)
    .set({ status: "rejected", approvedById: approverId, approvedAt: new Date(), rejectedReason: reason, updatedAt: new Date() })
    .where(and(eq(leaveRequestsTable.id, id), eq(leaveRequestsTable.shopId, shopId)))
    .returning();
  if (!row) throw new NotFoundError("Leave request not found");

  const [userId, leaveTypeName] = await Promise.all([
    getEmployeeUserId(existing.employeeId),
    getLeaveTypeNameBn(existing.leaveTypeId),
  ]);

  await createNotification({
    shopId,
    userId,
    type:       "leave_rejected",
    title:      JSON.stringify({ bn: "ছুটির আবেদন নামঞ্জুর হয়েছে", en: "Leave request rejected" }),
    body:       JSON.stringify({
      bn: `আপনার ${leaveTypeName} আবেদন (${existing.fromDate} থেকে ${existing.toDate}) নামঞ্জুর করা হয়েছে। কারণ: ${reason}`,
      en: `Your leave request (${existing.fromDate} to ${existing.toDate}) was rejected. Reason: ${reason}`,
    }),
    entityType: "leave_request",
    entityId:   id,
  });

  return buildRequestDto(row);
}

export async function deleteLeaveRequest(shopId: number, id: number): Promise<void> {
  const result = await db
    .delete(leaveRequestsTable)
    .where(and(eq(leaveRequestsTable.id, id), eq(leaveRequestsTable.shopId, shopId)))
    .returning({ id: leaveRequestsTable.id });
  if (result.length === 0) throw new NotFoundError("Leave request not found");
}
