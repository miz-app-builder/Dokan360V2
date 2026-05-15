import { db, auditLogsTable, usersTable } from "@workspace/db";
import { eq, and, desc, ilike, gte, lte, sql } from "drizzle-orm";

export interface ListAuditLogsParams {
  page?:      number;
  limit?:     number;
  search?:    string;
  action?:    string;
  from?:      string;
  to?:        string;
}

export async function listAuditLogs(shopId: number, params: ListAuditLogsParams) {
  const page   = Math.max(1, params.page  ?? 1);
  const limit  = Math.min(100, Math.max(1, params.limit ?? 50));
  const offset = (page - 1) * limit;

  const conditions = [eq(auditLogsTable.shopId, shopId)];

  if (params.action && params.action !== "all") {
    conditions.push(eq(auditLogsTable.action, params.action));
  }
  if (params.from) {
    conditions.push(gte(auditLogsTable.createdAt, new Date(params.from)));
  }
  if (params.to) {
    const toDate = new Date(params.to);
    toDate.setHours(23, 59, 59, 999);
    conditions.push(lte(auditLogsTable.createdAt, toDate));
  }

  const where = and(...conditions);

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id:        auditLogsTable.id,
        action:    auditLogsTable.action,
        ip:        auditLogsTable.ip,
        userAgent: auditLogsTable.userAgent,
        meta:      auditLogsTable.meta,
        createdAt: auditLogsTable.createdAt,
        userId:    auditLogsTable.userId,
        userName:  usersTable.name,
        userEmail: usersTable.email,
        userRole:  usersTable.role,
      })
      .from(auditLogsTable)
      .leftJoin(usersTable, eq(auditLogsTable.userId, usersTable.id))
      .where(
        params.search
          ? and(
              where,
              ilike(usersTable.name, `%${params.search}%`),
            )
          : where,
      )
      .orderBy(desc(auditLogsTable.createdAt))
      .limit(limit)
      .offset(offset),

    db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogsTable)
      .leftJoin(usersTable, eq(auditLogsTable.userId, usersTable.id))
      .where(
        params.search
          ? and(
              where,
              ilike(usersTable.name, `%${params.search}%`),
            )
          : where,
      ),
  ]);

  const total = Number(countRows[0]?.count ?? 0);

  return {
    data: rows.map((r) => ({
      id:        r.id,
      action:    r.action,
      ip:        r.ip,
      userAgent: r.userAgent,
      meta:      r.meta,
      createdAt: r.createdAt.toISOString(),
      user: r.userId
        ? { id: r.userId, name: r.userName, email: r.userEmail, role: r.userRole }
        : null,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
