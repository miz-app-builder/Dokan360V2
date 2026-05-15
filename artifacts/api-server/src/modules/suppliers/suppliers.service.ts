import { db, suppliersTable, purchasesTable } from "@workspace/db";
import { eq, and, ilike, desc, sql } from "drizzle-orm";
import { NotFoundError } from "../../common/errors";

function formatSupplier(s: typeof suppliersTable.$inferSelect) {
  return {
    id:            s.id,
    shopId:        s.shopId,
    name:          s.name,
    phone:         s.phone,
    email:         s.email,
    address:       s.address,
    balance:       Number(s.balance),
    totalPurchase: Number(s.totalPurchase),
    createdAt:     s.createdAt.toISOString(),
    updatedAt:     s.updatedAt.toISOString(),
  };
}

export async function listSuppliers(shopId: number, search?: string) {
  const conditions = [eq(suppliersTable.shopId, shopId)];
  if (search) conditions.push(ilike(suppliersTable.name, `%${search}%`));
  const rows = await db
    .select()
    .from(suppliersTable)
    .where(and(...conditions))
    .orderBy(desc(suppliersTable.createdAt));
  return rows.map(formatSupplier);
}

export async function getSupplier(shopId: number, id: number) {
  const [row] = await db
    .select()
    .from(suppliersTable)
    .where(and(eq(suppliersTable.id, id), eq(suppliersTable.shopId, shopId)));
  if (!row) throw new NotFoundError("সাপ্লায়ার পাওয়া যায়নি");
  return formatSupplier(row);
}

export async function createSupplier(
  shopId: number,
  data: { name: string; phone?: string | null; email?: string | null; address?: string | null },
) {
  const [row] = await db.insert(suppliersTable).values({ ...data, shopId }).returning();
  return formatSupplier(row);
}

export async function updateSupplier(
  shopId: number,
  id: number,
  data: { name?: string; phone?: string | null; email?: string | null; address?: string | null },
) {
  const [row] = await db
    .update(suppliersTable)
    .set(data)
    .where(and(eq(suppliersTable.id, id), eq(suppliersTable.shopId, shopId)))
    .returning();
  if (!row) throw new NotFoundError("সাপ্লায়ার পাওয়া যায়নি");
  return formatSupplier(row);
}

export async function deleteSupplier(shopId: number, id: number) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(purchasesTable)
    .where(eq(purchasesTable.supplierId, id));
  if ((row?.count ?? 0) > 0) {
    const deleted = await db
      .update(suppliersTable)
      .set({ name: `[মুছে ফেলা]` })
      .where(and(eq(suppliersTable.id, id), eq(suppliersTable.shopId, shopId)))
      .returning();
    return deleted[0];
  }
  await db
    .delete(suppliersTable)
    .where(and(eq(suppliersTable.id, id), eq(suppliersTable.shopId, shopId)));
  return;
}

export async function getSupplierStats(shopId: number) {
  const [row] = await db
    .select({
      totalSuppliers: sql<number>`count(*)::int`,
      totalDue:       sql<number>`sum(case when balance < 0 then abs(balance) else 0 end)::numeric`,
      totalPurchase:  sql<number>`sum(total_purchase)::numeric`,
    })
    .from(suppliersTable)
    .where(eq(suppliersTable.shopId, shopId));
  return {
    totalSuppliers: row?.totalSuppliers ?? 0,
    totalDue:       Number(row?.totalDue ?? 0),
    totalPurchase:  Number(row?.totalPurchase ?? 0),
  };
}
