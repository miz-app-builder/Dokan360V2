import { db, salesTable, productsTable, customersTable, saleItemsTable } from "@workspace/db";
import { eq, and, gte, lte, desc, sum, count, sql, inArray } from "drizzle-orm";

export type AnalyticsPeriod = "week" | "month";

export async function getSummary(shopId: number) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    [todaySalesResult],
    [monthSalesResult],
    [productStats],
    [lowStockRow],
    [customerStats],
    [dueResult],
  ] = await Promise.all([
    db
      .select({ total: sum(salesTable.total), transactions: count() })
      .from(salesTable)
      .where(and(eq(salesTable.shopId, shopId), gte(salesTable.createdAt, todayStart))),
    db
      .select({ total: sum(salesTable.total), transactions: count() })
      .from(salesTable)
      .where(and(eq(salesTable.shopId, shopId), gte(salesTable.createdAt, monthStart))),
    db
      .select({ total: count() })
      .from(productsTable)
      .where(eq(productsTable.shopId, shopId)),
    db
      .select({ count: count() })
      .from(productsTable)
      .where(and(eq(productsTable.shopId, shopId), lte(productsTable.stockQuantity, productsTable.minStockLevel))),
    db
      .select({ total: count() })
      .from(customersTable)
      .where(eq(customersTable.shopId, shopId)),
    db
      .select({ totalDue: sum(salesTable.due) })
      .from(salesTable)
      .where(eq(salesTable.shopId, shopId)),
  ]);

  return {
    todaySales: Number(todaySalesResult?.total ?? 0),
    todayTransactions: Number(todaySalesResult?.transactions ?? 0),
    totalProducts: Number(productStats?.total ?? 0),
    lowStockCount: Number(lowStockRow?.count ?? 0),
    totalCustomers: Number(customerStats?.total ?? 0),
    totalDue: Number(dueResult?.totalDue ?? 0),
    monthSales: Number(monthSalesResult?.total ?? 0),
    monthTransactions: Number(monthSalesResult?.transactions ?? 0),
  };
}

export async function getRecentSales(shopId: number) {
  const sales = await db
    .select({ sale: salesTable, customerName: customersTable.name })
    .from(salesTable)
    .leftJoin(customersTable, eq(salesTable.customerId, customersTable.id))
    .where(eq(salesTable.shopId, shopId))
    .orderBy(desc(salesTable.createdAt))
    .limit(10);

  if (sales.length === 0) return [];

  const saleIds = sales.map(({ sale }) => sale.id);
  const allItems = await db
    .select()
    .from(saleItemsTable)
    .where(inArray(saleItemsTable.saleId, saleIds));

  const itemCountBySale = new Map<number, number>();
  for (const item of allItems) {
    itemCountBySale.set(item.saleId, (itemCountBySale.get(item.saleId) ?? 0) + 1);
  }

  return sales.map(({ sale, customerName }) => ({
    id: sale.id,
    invoiceNumber: sale.invoiceNumber,
    customerId: sale.customerId,
    customerName: customerName ?? null,
    total: Number(sale.total),
    discount: Number(sale.discount),
    paid: Number(sale.paid),
    due: Number(sale.due),
    paymentMethod: sale.paymentMethod,
    itemCount: itemCountBySale.get(sale.id) ?? 0,
    createdAt: sale.createdAt.toISOString(),
  }));
}

export async function getTopProducts(shopId: number) {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const results = await db
    .select({
      productId: saleItemsTable.productId,
      productNameBn: saleItemsTable.productNameBn,
      totalQuantity: sum(saleItemsTable.quantity),
      totalRevenue: sum(saleItemsTable.subtotal),
    })
    .from(saleItemsTable)
    .innerJoin(salesTable, eq(saleItemsTable.saleId, salesTable.id))
    .where(and(eq(salesTable.shopId, shopId), gte(salesTable.createdAt, monthStart)))
    .groupBy(saleItemsTable.productId, saleItemsTable.productNameBn)
    .orderBy(desc(sum(saleItemsTable.subtotal)))
    .limit(10);

  return results.map((r) => ({
    productId: r.productId,
    productNameBn: r.productNameBn,
    totalQuantity: Number(r.totalQuantity ?? 0),
    totalRevenue: Number(r.totalRevenue ?? 0),
  }));
}

export async function getSalesChart(shopId: number) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const results = await db
    .select({
      date: sql<string>`DATE(${salesTable.createdAt})`.as("date"),
      total: sum(salesTable.total),
      transactions: count(),
    })
    .from(salesTable)
    .where(and(eq(salesTable.shopId, shopId), gte(salesTable.createdAt, thirtyDaysAgo)))
    .groupBy(sql`DATE(${salesTable.createdAt})`)
    .orderBy(sql`DATE(${salesTable.createdAt})`);

  return results.map((r) => ({
    date: r.date,
    total: Number(r.total ?? 0),
    transactions: Number(r.transactions ?? 0),
  }));
}

export async function getAnalytics(shopId: number, period: AnalyticsPeriod) {
  if (period === "week") {
    const twelveWeeksAgo = new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000);
    const results = await db
      .select({
        label: sql<string>`TO_CHAR(DATE_TRUNC('week', ${salesTable.createdAt}), 'IYYY-"W"IW')`.as("label"),
        total: sum(salesTable.total),
        transactions: count(),
      })
      .from(salesTable)
      .where(and(eq(salesTable.shopId, shopId), gte(salesTable.createdAt, twelveWeeksAgo)))
      .groupBy(sql`DATE_TRUNC('week', ${salesTable.createdAt})`)
      .orderBy(sql`DATE_TRUNC('week', ${salesTable.createdAt})`);
    return results.map((r) => ({ label: r.label, total: Number(r.total ?? 0), transactions: Number(r.transactions ?? 0) }));
  } else {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    const results = await db
      .select({
        label: sql<string>`TO_CHAR(DATE_TRUNC('month', ${salesTable.createdAt}), 'YYYY-MM')`.as("label"),
        total: sum(salesTable.total),
        transactions: count(),
      })
      .from(salesTable)
      .where(and(eq(salesTable.shopId, shopId), gte(salesTable.createdAt, twelveMonthsAgo)))
      .groupBy(sql`DATE_TRUNC('month', ${salesTable.createdAt})`)
      .orderBy(sql`DATE_TRUNC('month', ${salesTable.createdAt})`);
    return results.map((r) => ({ label: r.label, total: Number(r.total ?? 0), transactions: Number(r.transactions ?? 0) }));
  }
}

export async function getHeatmap(shopId: number) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const results = await db
    .select({
      dayOfWeek: sql<number>`EXTRACT(DOW FROM ${salesTable.createdAt})::int`.as("dayOfWeek"),
      count: count(),
      total: sum(salesTable.total),
    })
    .from(salesTable)
    .where(and(eq(salesTable.shopId, shopId), gte(salesTable.createdAt, thirtyDaysAgo)))
    .groupBy(sql`EXTRACT(DOW FROM ${salesTable.createdAt})`);

  return results.map((r) => ({
    dayOfWeek: Number(r.dayOfWeek),
    count: Number(r.count),
    total: Number(r.total ?? 0),
  }));
}
