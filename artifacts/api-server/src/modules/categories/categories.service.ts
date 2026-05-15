import { db, categoriesTable, productsTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { NotFoundError } from "../../common/errors";

export async function listCategories(shopId: number) {
  const categories = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.shopId, shopId));

  return Promise.all(
    categories.map(async (cat) => {
      const [result] = await db
        .select({ count: count() })
        .from(productsTable)
        .where(and(eq(productsTable.categoryId, cat.id), eq(productsTable.shopId, shopId)));
      return {
        id: cat.id,
        nameBn: cat.nameBn,
        nameEn: cat.nameEn,
        productCount: Number(result?.count ?? 0),
        createdAt: cat.createdAt.toISOString(),
      };
    }),
  );
}

export async function createCategory(shopId: number, data: { nameBn: string; nameEn?: string | null }) {
  const [cat] = await db.insert(categoriesTable).values({ ...data, shopId }).returning();
  return { id: cat.id, nameBn: cat.nameBn, nameEn: cat.nameEn, productCount: 0, createdAt: cat.createdAt.toISOString() };
}

export async function updateCategory(
  shopId: number,
  id: number,
  data: { nameBn?: string; nameEn?: string | null },
) {
  const [cat] = await db
    .update(categoriesTable)
    .set(data)
    .where(and(eq(categoriesTable.id, id), eq(categoriesTable.shopId, shopId)))
    .returning();
  if (!cat) throw new NotFoundError("বিভাগ পাওয়া যায়নি");
  const [result] = await db
    .select({ count: count() })
    .from(productsTable)
    .where(eq(productsTable.categoryId, cat.id));
  return { id: cat.id, nameBn: cat.nameBn, nameEn: cat.nameEn, productCount: Number(result?.count ?? 0), createdAt: cat.createdAt.toISOString() };
}

export async function deleteCategory(shopId: number, id: number) {
  await db.delete(categoriesTable).where(and(eq(categoriesTable.id, id), eq(categoriesTable.shopId, shopId)));
}
