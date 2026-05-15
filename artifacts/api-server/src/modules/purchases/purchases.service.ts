import { db, purchasesTable, purchaseItemsTable, suppliersTable, productsTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { NotFoundError } from "../../common/errors";

function formatPurchase(
  p: typeof purchasesTable.$inferSelect,
  supplierName?: string | null,
  itemCount = 0,
) {
  return {
    id:            p.id,
    invoiceNumber: p.invoiceNumber,
    supplierId:    p.supplierId,
    supplierName:  supplierName ?? null,
    total:         Number(p.total),
    paid:          Number(p.paid),
    due:           Number(p.due),
    note:          p.note,
    status:        p.status,
    itemCount,
    purchasedAt:   p.purchasedAt.toISOString(),
    createdAt:     p.createdAt.toISOString(),
  };
}

function formatPurchaseItem(item: typeof purchaseItemsTable.$inferSelect) {
  return {
    id:            item.id,
    purchaseId:    item.purchaseId,
    productId:     item.productId,
    productNameBn: item.productNameBn,
    quantity:      Number(item.quantity),
    costPrice:     Number(item.costPrice),
    subtotal:      Number(item.subtotal),
  };
}

export async function listPurchases(shopId: number) {
  const rows = await db
    .select({ purchase: purchasesTable, supplierName: suppliersTable.name })
    .from(purchasesTable)
    .leftJoin(suppliersTable, eq(purchasesTable.supplierId, suppliersTable.id))
    .where(eq(purchasesTable.shopId, shopId))
    .orderBy(desc(purchasesTable.createdAt));

  const result = [];
  for (const { purchase, supplierName } of rows) {
    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(purchaseItemsTable)
      .where(eq(purchaseItemsTable.purchaseId, purchase.id));
    result.push(formatPurchase(purchase, supplierName, countRow?.count ?? 0));
  }
  return result;
}

export async function getPurchase(shopId: number, id: number) {
  const [row] = await db
    .select({ purchase: purchasesTable, supplierName: suppliersTable.name })
    .from(purchasesTable)
    .leftJoin(suppliersTable, eq(purchasesTable.supplierId, suppliersTable.id))
    .where(and(eq(purchasesTable.id, id), eq(purchasesTable.shopId, shopId)));

  if (!row) throw new NotFoundError("ক্রয় পাওয়া যায়নি");

  const items = await db
    .select()
    .from(purchaseItemsTable)
    .where(eq(purchaseItemsTable.purchaseId, id));

  return {
    ...formatPurchase(row.purchase, row.supplierName, items.length),
    items: items.map(formatPurchaseItem),
  };
}

export async function createPurchase(
  shopId: number,
  userId: number,
  data: {
    supplierId?:    number | null;
    total:          number;
    paid:           number;
    note?:          string | null;
    status?:        string;
    purchasedAt?:   string;
    items: Array<{
      productId?:     number | null;
      productNameBn:  string;
      quantity:       number;
      costPrice:      number;
    }>;
  },
) {
  const due           = data.total - data.paid;
  const invoiceNumber = `PUR-${Date.now()}`;

  const [purchase] = await db.insert(purchasesTable).values({
    shopId,
    userId,
    supplierId:    data.supplierId ?? null,
    invoiceNumber,
    total:         String(data.total),
    paid:          String(data.paid),
    due:           String(due),
    note:          data.note ?? null,
    status:        data.status ?? "received",
    purchasedAt:   data.purchasedAt ? new Date(data.purchasedAt) : new Date(),
  }).returning();

  const itemRows = data.items.map((item) => ({
    purchaseId:    purchase.id,
    productId:     item.productId ?? null,
    productNameBn: item.productNameBn,
    quantity:      String(item.quantity),
    costPrice:     String(item.costPrice),
    subtotal:      String(item.quantity * item.costPrice),
  }));

  await db.insert(purchaseItemsTable).values(itemRows);

  if (data.status !== "pending") {
    for (const item of data.items) {
      if (item.productId) {
        const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
        if (product) {
          await db.update(productsTable)
            .set({ stockQuantity: product.stockQuantity + item.quantity })
            .where(eq(productsTable.id, item.productId));
        }
      }
    }
  }

  if (data.supplierId) {
    const [supplier] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, data.supplierId));
    if (supplier) {
      const newBalance      = Number(supplier.balance) - due;
      const newTotalPurchase = Number(supplier.totalPurchase) + data.total;
      await db.update(suppliersTable).set({
        balance:       String(newBalance),
        totalPurchase: String(newTotalPurchase),
      }).where(eq(suppliersTable.id, data.supplierId));
    }
  }

  return getPurchase(shopId, purchase.id);
}

export async function paySupplierDue(shopId: number, purchaseId: number, amount: number) {
  const [purchase] = await db
    .select()
    .from(purchasesTable)
    .where(and(eq(purchasesTable.id, purchaseId), eq(purchasesTable.shopId, shopId)));
  if (!purchase) throw new NotFoundError("ক্রয় পাওয়া যায়নি");

  const newPaid = Number(purchase.paid) + amount;
  const newDue  = Math.max(0, Number(purchase.due) - amount);

  await db.update(purchasesTable).set({
    paid:   String(newPaid),
    due:    String(newDue),
    status: newDue === 0 ? "received" : purchase.status,
  }).where(eq(purchasesTable.id, purchaseId));

  if (purchase.supplierId) {
    const [supplier] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, purchase.supplierId));
    if (supplier) {
      const newBalance = Number(supplier.balance) + amount;
      await db.update(suppliersTable).set({ balance: String(newBalance) }).where(eq(suppliersTable.id, purchase.supplierId));
    }
  }

  return getPurchase(shopId, purchaseId);
}

export async function deletePurchase(shopId: number, id: number) {
  await db.delete(purchaseItemsTable).where(eq(purchaseItemsTable.purchaseId, id));
  await db.delete(purchasesTable).where(and(eq(purchasesTable.id, id), eq(purchasesTable.shopId, shopId)));
}

export async function getPurchaseStats(shopId: number) {
  const [row] = await db
    .select({
      totalPurchases:    sql<number>`count(*)::int`,
      totalAmount:       sql<number>`sum(total)::numeric`,
      totalPaid:         sql<number>`sum(paid)::numeric`,
      totalDue:          sql<number>`sum(due)::numeric`,
    })
    .from(purchasesTable)
    .where(eq(purchasesTable.shopId, shopId));
  return {
    totalPurchases: row?.totalPurchases ?? 0,
    totalAmount:    Number(row?.totalAmount ?? 0),
    totalPaid:      Number(row?.totalPaid ?? 0),
    totalDue:       Number(row?.totalDue ?? 0),
  };
}
