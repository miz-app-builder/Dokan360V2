import { db, notificationsTable, productsTable, customersTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";

export async function listNotifications(shopId: number, limit = 30) {
  const rows = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.shopId, shopId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(limit);
  return rows.map(formatNotification);
}

export async function getUnreadCount(shopId: number) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notificationsTable)
    .where(and(eq(notificationsTable.shopId, shopId), eq(notificationsTable.isRead, false)));
  return row?.count ?? 0;
}

export async function markAsRead(shopId: number, id: number) {
  const [row] = await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.shopId, shopId)))
    .returning();
  return row ? formatNotification(row) : null;
}

export async function markAllAsRead(shopId: number) {
  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.shopId, shopId), eq(notificationsTable.isRead, false)));
}

export async function deleteNotification(shopId: number, id: number) {
  await db
    .delete(notificationsTable)
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.shopId, shopId)));
}

export async function createNotification(data: {
  shopId:     number;
  userId?:    number | null;
  type:       string;
  title:      string;
  body?:      string | null;
  entityType?: string | null;
  entityId?:  number | null;
}) {
  const [row] = await db.insert(notificationsTable).values(data).returning();
  return formatNotification(row);
}

export async function generateLowStockNotifications(shopId: number) {
  const lowStockProducts = await db
    .select()
    .from(productsTable)
    .where(
      and(
        eq(productsTable.shopId, shopId),
        eq(productsTable.isActive, true),
        sql`${productsTable.stockQuantity} <= ${productsTable.minStockLevel}`,
      ),
    );

  for (const product of lowStockProducts) {
    const existing = await db
      .select()
      .from(notificationsTable)
      .where(
        and(
          eq(notificationsTable.shopId, shopId),
          eq(notificationsTable.type, "low_stock"),
          eq(notificationsTable.entityId, product.id),
          eq(notificationsTable.isRead, false),
        ),
      )
      .limit(1);

    if (existing.length === 0) {
      const isOut     = product.stockQuantity <= 0;
      const nameEn    = product.nameEn ?? product.nameBn;
      await db.insert(notificationsTable).values({
        shopId,
        type:       "low_stock",
        title:      JSON.stringify({
          bn: isOut ? `${product.nameBn} — স্টক শেষ`  : `${product.nameBn} — কম মজুদ`,
          en: isOut ? `${nameEn} — Out of stock`       : `${nameEn} — Low stock`,
        }),
        body:       JSON.stringify({
          bn: isOut
            ? `পণ্যটির স্টক শেষ হয়ে গেছে। দ্রুত পুনরায় মজুদ করুন।`
            : `মজুদ ${product.stockQuantity} ${product.unit}, সর্বনিম্ন সীমা ${product.minStockLevel} ${product.unit}।`,
          en: isOut
            ? `This product is out of stock. Please restock immediately.`
            : `Stock is ${product.stockQuantity} ${product.unit}, minimum level is ${product.minStockLevel} ${product.unit}.`,
        }),
        entityType: "product",
        entityId:   product.id,
      });
    }
  }
}

export async function generateDueNotifications(shopId: number) {
  const dueCustomers = await db
    .select()
    .from(customersTable)
    .where(
      and(
        eq(customersTable.shopId, shopId),
        sql`${customersTable.balance} < 0`,
      ),
    );

  for (const customer of dueCustomers) {
    const due = Math.abs(Number(customer.balance));
    if (due < 100) continue;

    const existing = await db
      .select()
      .from(notificationsTable)
      .where(
        and(
          eq(notificationsTable.shopId, shopId),
          eq(notificationsTable.type, "due_alert"),
          eq(notificationsTable.entityId, customer.id),
          eq(notificationsTable.isRead, false),
        ),
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(notificationsTable).values({
        shopId,
        type:       "due_alert",
        title:      JSON.stringify({
          bn: `${customer.name} — বাকি আছে`,
          en: `${customer.name} — Payment due`,
        }),
        body:       JSON.stringify({
          bn: `গ্রাহক ${customer.name}-এর কাছে ৳${due.toFixed(2)} বাকি আছে।`,
          en: `Customer ${customer.name} has an outstanding balance of ৳${due.toFixed(2)}.`,
        }),
        entityType: "customer",
        entityId:   customer.id,
      });
    }
  }
}

function formatNotification(n: typeof notificationsTable.$inferSelect) {
  return {
    id:         n.id,
    shopId:     n.shopId,
    userId:     n.userId,
    type:       n.type,
    title:      n.title,
    body:       n.body,
    entityType: n.entityType,
    entityId:   n.entityId,
    isRead:     n.isRead,
    createdAt:  n.createdAt.toISOString(),
  };
}
