import { db, productsTable, categoriesTable, inventoryAdjustmentsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { NotFoundError } from "../../common/errors";

function formatInventoryItem(product: typeof productsTable.$inferSelect, categoryName?: string | null) {
  return {
    id: product.id,
    nameBn: product.nameBn,
    nameEn: product.nameEn,
    sku: product.sku,
    stockQuantity: product.stockQuantity,
    minStockLevel: product.minStockLevel,
    unit: product.unit,
    categoryName: categoryName ?? null,
    isLowStock: product.stockQuantity <= product.minStockLevel,
  };
}

export async function listInventory(shopId: number) {
  const rows = await db
    .select({ product: productsTable, categoryName: categoriesTable.nameBn })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.shopId, shopId));
  return rows.map(({ product, categoryName }) => formatInventoryItem(product, categoryName));
}

export async function adjustInventory(
  productId: number,
  quantity: number,
  type: "in" | "out" | "adjustment",
  reason?: string,
) {
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
  if (!product) throw new NotFoundError("পণ্য পাওয়া যায়নি");

  let newQty = product.stockQuantity;
  if (type === "in") newQty += quantity;
  else if (type === "out") newQty = Math.max(0, newQty - quantity);
  else newQty = quantity;

  await db.update(productsTable).set({ stockQuantity: newQty }).where(eq(productsTable.id, productId));
  await db.insert(inventoryAdjustmentsTable).values({
    productId,
    productNameBn: product.nameBn,
    quantity,
    type,
    reason,
  });

  return formatInventoryItem({ ...product, stockQuantity: newQty });
}

export async function listAdjustments() {
  const adjustments = await db
    .select()
    .from(inventoryAdjustmentsTable)
    .orderBy(desc(inventoryAdjustmentsTable.createdAt))
    .limit(100);
  return adjustments.map((a) => ({
    id: a.id,
    productId: a.productId,
    productNameBn: a.productNameBn,
    quantity: a.quantity,
    type: a.type,
    reason: a.reason,
    createdAt: a.createdAt.toISOString(),
  }));
}
