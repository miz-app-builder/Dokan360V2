import { db, salesTable, saleItemsTable, productsTable, customersTable, ledgerEntriesTable } from "@workspace/db";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { NotFoundError } from "../../common/errors";

function padInvoice(id: number): string {
  return `INV-${String(id).padStart(6, "0")}`;
}

function formatSaleRow(
  sale: typeof salesTable.$inferSelect,
  customerName?: string | null,
  itemCount = 0,
) {
  return {
    id: sale.id,
    invoiceNumber: sale.invoiceNumber,
    customerId: sale.customerId,
    customerName: customerName ?? null,
    total: Number(sale.total),
    discount: Number(sale.discount),
    paid: Number(sale.paid),
    due: Number(sale.due),
    paymentMethod: sale.paymentMethod,
    itemCount,
    createdAt: sale.createdAt.toISOString(),
  };
}

export async function listSales(
  shopId: number,
  filters: { from?: string; to?: string; customerId?: number },
) {
  const conditions = [eq(salesTable.shopId, shopId)];
  if (filters.from) conditions.push(gte(salesTable.createdAt, new Date(filters.from)));
  if (filters.to) conditions.push(lte(salesTable.createdAt, new Date(filters.to)));
  if (filters.customerId) conditions.push(eq(salesTable.customerId, filters.customerId));

  const sales = await db
    .select({ sale: salesTable, customerName: customersTable.name })
    .from(salesTable)
    .leftJoin(customersTable, eq(salesTable.customerId, customersTable.id))
    .where(and(...conditions))
    .orderBy(desc(salesTable.createdAt));

  return Promise.all(
    sales.map(async ({ sale, customerName }) => {
      const items = await db.select().from(saleItemsTable).where(eq(saleItemsTable.saleId, sale.id));
      return formatSaleRow(sale, customerName, items.length);
    }),
  );
}

export async function getSale(shopId: number, id: number) {
  const [row] = await db
    .select({ sale: salesTable, customerName: customersTable.name })
    .from(salesTable)
    .leftJoin(customersTable, eq(salesTable.customerId, customersTable.id))
    .where(and(eq(salesTable.id, id), eq(salesTable.shopId, shopId)));

  if (!row) throw new NotFoundError("বিক্রয় পাওয়া যায়নি");

  const items = await db.select().from(saleItemsTable).where(eq(saleItemsTable.saleId, row.sale.id));

  return {
    id: row.sale.id,
    invoiceNumber: row.sale.invoiceNumber,
    customerId: row.sale.customerId,
    customerName: row.customerName ?? null,
    total: Number(row.sale.total),
    discount: Number(row.sale.discount),
    paid: Number(row.sale.paid),
    due: Number(row.sale.due),
    paymentMethod: row.sale.paymentMethod,
    note: row.sale.note,
    items: items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productNameBn: item.productNameBn,
      quantity: Number(item.quantity),
      price: Number(item.price),
      subtotal: Number(item.subtotal),
    })),
    createdAt: row.sale.createdAt.toISOString(),
  };
}

export async function createSale(
  shopId: number,
  userId: number,
  data: {
    customerId?: number | null;
    discount?: number;
    paid: number;
    paymentMethod: string;
    note?: string | null;
    items: Array<{ productId: number; quantity: number; price: number }>;
  },
) {
  const { customerId, discount = 0, paid, paymentMethod, note, items } = data;

  let total = 0;
  for (const item of items) {
    total += item.quantity * item.price;
  }
  const finalTotal = total - discount;
  const due = Math.max(0, finalTotal - paid);

  const [sale] = await db
    .insert(salesTable)
    .values({
      invoiceNumber: "TMP",
      customerId,
      userId,
      shopId,
      total: String(finalTotal),
      discount: String(discount),
      paid: String(paid),
      due: String(due),
      paymentMethod,
      note,
    })
    .returning();

  await db.update(salesTable).set({ invoiceNumber: padInvoice(sale.id) }).where(eq(salesTable.id, sale.id));
  const invoiceNumber = padInvoice(sale.id);

  const saleItemRows = items.map((item) => ({
    saleId: sale.id,
    productId: item.productId,
    productNameBn: "",
    quantity: String(item.quantity),
    price: String(item.price),
    subtotal: String(item.quantity * item.price),
  }));

  for (const saleItem of saleItemRows) {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, saleItem.productId));
    if (product) {
      saleItem.productNameBn = product.nameBn;
      await db
        .update(productsTable)
        .set({ stockQuantity: product.stockQuantity - Number(saleItem.quantity) })
        .where(eq(productsTable.id, saleItem.productId));
    }
  }

  await db.insert(saleItemsTable).values(saleItemRows);

  if (customerId) {
    const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, customerId));
    if (customer) {
      const newBalance = Number(customer.balance) - due;
      const newTotal = Number(customer.totalPurchase) + finalTotal;
      await db.update(customersTable).set({
        balance: String(newBalance),
        totalPurchase: String(newTotal),
      }).where(eq(customersTable.id, customerId));

      await db.insert(ledgerEntriesTable).values({
        customerId,
        saleId: sale.id,
        type: "sale",
        amount: String(finalTotal),
        balance: String(newBalance),
        note: `বিক্রয় #${invoiceNumber}`,
      });
    }
  }

  const saleItems = await db.select().from(saleItemsTable).where(eq(saleItemsTable.saleId, sale.id));
  return formatSaleRow({ ...sale, invoiceNumber }, null, saleItems.length);
}
