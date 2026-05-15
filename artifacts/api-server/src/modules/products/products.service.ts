import { db, productsTable, categoriesTable } from "@workspace/db";
import { eq, and, ilike, lte } from "drizzle-orm";
import { NotFoundError } from "../../common/errors";

function formatProduct(p: typeof productsTable.$inferSelect, categoryName?: string | null) {
  return {
    id: p.id,
    nameBn: p.nameBn,
    nameEn: p.nameEn,
    sku: p.sku,
    barcode: p.barcode,
    price: Number(p.price),
    costPrice: p.costPrice != null ? Number(p.costPrice) : null,
    stockQuantity: p.stockQuantity,
    minStockLevel: p.minStockLevel,
    unit: p.unit,
    categoryId: p.categoryId,
    categoryName: categoryName ?? null,
    isActive: p.isActive,
    createdAt: p.createdAt.toISOString(),
  };
}

export async function listProducts(
  shopId: number,
  filters: { search?: string; categoryId?: number; lowStock?: boolean },
) {
  const conditions = [eq(productsTable.shopId, shopId), eq(productsTable.isActive, true)];
  if (filters.search) conditions.push(ilike(productsTable.nameBn, `%${filters.search}%`));
  if (filters.categoryId) conditions.push(eq(productsTable.categoryId, filters.categoryId));
  if (filters.lowStock) conditions.push(lte(productsTable.stockQuantity, productsTable.minStockLevel));

  const rows = await db
    .select({ product: productsTable, categoryName: categoriesTable.nameBn })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(and(...conditions));

  return rows.map(({ product, categoryName }) => formatProduct(product, categoryName));
}

export async function getProduct(shopId: number, id: number) {
  const [row] = await db
    .select({ product: productsTable, categoryName: categoriesTable.nameBn })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(and(eq(productsTable.id, id), eq(productsTable.shopId, shopId)));
  if (!row) throw new NotFoundError("পণ্য পাওয়া যায়নি");
  return formatProduct(row.product, row.categoryName);
}

export async function createProduct(
  shopId: number,
  data: {
    nameBn: string;
    nameEn?: string | null;
    sku?: string | null;
    barcode?: string | null;
    price: number;
    costPrice?: number | null;
    stockQuantity?: number;
    minStockLevel?: number;
    unit?: string | null;
    categoryId?: number | null;
  },
) {
  const [product] = await db
    .insert(productsTable)
    .values({
      shopId,
      nameBn: data.nameBn,
      nameEn: data.nameEn ?? undefined,
      sku: data.sku ?? undefined,
      barcode: data.barcode ?? undefined,
      price: String(data.price),
      costPrice: data.costPrice != null ? String(data.costPrice) : undefined,
      stockQuantity: data.stockQuantity,
      minStockLevel: data.minStockLevel,
      unit: data.unit ?? undefined,
      categoryId: data.categoryId ?? undefined,
    })
    .returning();
  return formatProduct(product);
}

export async function updateProduct(shopId: number, id: number, data: Record<string, unknown>) {
  const updateData = { ...data };
  if (data.price != null) updateData.price = String(data.price);
  if (data.costPrice != null) updateData.costPrice = String(data.costPrice);

  const [product] = await db
    .update(productsTable)
    .set(updateData)
    .where(and(eq(productsTable.id, id), eq(productsTable.shopId, shopId)))
    .returning();
  if (!product) throw new NotFoundError("পণ্য পাওয়া যায়নি");
  return formatProduct(product);
}

export async function deleteProduct(shopId: number, id: number) {
  await db
    .update(productsTable)
    .set({ isActive: false })
    .where(and(eq(productsTable.id, id), eq(productsTable.shopId, shopId)));
}
