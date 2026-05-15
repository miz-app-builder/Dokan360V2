import {
  db, salesTable, productsTable, categoriesTable, saleItemsTable, customersTable, usersTable,
} from "@workspace/db";
import { eq, and, lt, sum, count, sql } from "drizzle-orm";
import { buildDateRange } from "../../utils/query.utils.js";

function buildDateConditions(from?: string, to?: string) {
  return buildDateRange(salesTable.createdAt, from, to);
}

export async function getSalesReport(shopId: number, from?: string, to?: string) {
  const conditions = [eq(salesTable.shopId, shopId), ...buildDateConditions(from, to)];

  const [summary] = await db
    .select({
      totalSales:        sum(salesTable.total),
      totalTransactions: count(),
      totalDiscount:     sum(salesTable.discount),
      totalDue:          sum(salesTable.due),
      totalPaid:         sum(salesTable.paid),
      avgOrderValue:     sql<string>`AVG(${salesTable.total})`,
    })
    .from(salesTable)
    .where(and(...conditions));

  const dailyBreakdown = await db
    .select({
      date:         sql<string>`DATE(${salesTable.createdAt})`.as("date"),
      total:        sum(salesTable.total),
      transactions: count(),
    })
    .from(salesTable)
    .where(and(...conditions))
    .groupBy(sql`DATE(${salesTable.createdAt})`)
    .orderBy(sql`DATE(${salesTable.createdAt})`);

  return {
    totalSales:        Number(summary?.totalSales ?? 0),
    totalTransactions: Number(summary?.totalTransactions ?? 0),
    totalDiscount:     Number(summary?.totalDiscount ?? 0),
    totalDue:          Number(summary?.totalDue ?? 0),
    totalPaid:         Number(summary?.totalPaid ?? 0),
    avgOrderValue:     Number(summary?.avgOrderValue ?? 0),
    dailyBreakdown: dailyBreakdown.map((d) => ({
      date:         d.date,
      total:        Number(d.total ?? 0),
      transactions: Number(d.transactions ?? 0),
    })),
  };
}

export async function getInventoryReport(shopId: number) {
  const rows = await db
    .select({ product: productsTable, categoryName: categoriesTable.nameBn })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.shopId, shopId));

  const items = rows.map(({ product, categoryName }) => ({
    id:            product.id,
    nameBn:        product.nameBn,
    nameEn:        product.nameEn,
    sku:           product.sku,
    stockQuantity: product.stockQuantity,
    minStockLevel: product.minStockLevel,
    unit:          product.unit,
    categoryName:  categoryName ?? null,
    isLowStock:    product.stockQuantity <= product.minStockLevel,
  }));

  const totalStockValue = rows.reduce(
    (acc, { product }) => acc + product.stockQuantity * Number(product.price), 0,
  );

  return {
    totalProducts:      items.length,
    totalStockValue,
    lowStockProducts:   items.filter((i) => i.isLowStock && i.stockQuantity > 0).length,
    outOfStockProducts: items.filter((i) => i.stockQuantity === 0).length,
    items,
  };
}

export async function getProfitReport(shopId: number, from?: string, to?: string) {
  const dateConds = buildDateConditions(from, to);

  const dailyRows = await db
    .select({
      date:    sql<string>`DATE(${salesTable.createdAt})`.as("date"),
      revenue: sql<string>`SUM(${saleItemsTable.subtotal})`,
      cost:    sql<string>`SUM(${saleItemsTable.quantity}::numeric * COALESCE(${productsTable.costPrice}, 0))`,
    })
    .from(salesTable)
    .innerJoin(saleItemsTable, eq(saleItemsTable.saleId, salesTable.id))
    .leftJoin(productsTable, eq(productsTable.id, saleItemsTable.productId))
    .where(and(eq(salesTable.shopId, shopId), ...dateConds))
    .groupBy(sql`DATE(${salesTable.createdAt})`)
    .orderBy(sql`DATE(${salesTable.createdAt})`);

  const dailyBreakdown = dailyRows.map((r) => {
    const revenue = Number(r.revenue ?? 0);
    const cost    = Number(r.cost    ?? 0);
    return { date: r.date, revenue, cost, profit: revenue - cost };
  });

  const totalRevenue = dailyBreakdown.reduce((s, r) => s + r.revenue, 0);
  const totalCost    = dailyBreakdown.reduce((s, r) => s + r.cost,    0);
  const totalProfit  = totalRevenue - totalCost;
  const margin       = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const [txRow] = await db
    .select({ transactions: count() })
    .from(salesTable)
    .where(and(eq(salesTable.shopId, shopId), ...dateConds));

  return {
    totalRevenue,
    totalCost,
    totalProfit,
    margin: Number(margin.toFixed(2)),
    totalTransactions: Number(txRow?.transactions ?? 0),
    dailyBreakdown,
  };
}

export async function getProductsReport(shopId: number, from?: string, to?: string) {
  const dateConds = buildDateConditions(from, to);

  const rows = await db
    .select({
      productId:     saleItemsTable.productId,
      productNameBn: saleItemsTable.productNameBn,
      totalQty:      sql<string>`SUM(${saleItemsTable.quantity}::numeric)`,
      revenue:       sql<string>`SUM(${saleItemsTable.subtotal})`,
      cost:          sql<string>`SUM(${saleItemsTable.quantity}::numeric * COALESCE(${productsTable.costPrice}, 0))`,
      transactions:  count(),
    })
    .from(salesTable)
    .innerJoin(saleItemsTable, eq(saleItemsTable.saleId, salesTable.id))
    .leftJoin(productsTable, eq(productsTable.id, saleItemsTable.productId))
    .where(and(eq(salesTable.shopId, shopId), ...dateConds))
    .groupBy(saleItemsTable.productId, saleItemsTable.productNameBn)
    .orderBy(sql`SUM(${saleItemsTable.subtotal}) DESC`);

  const items = rows.map((r) => {
    const revenue = Number(r.revenue ?? 0);
    const cost    = Number(r.cost    ?? 0);
    return {
      productId:     r.productId,
      productNameBn: r.productNameBn,
      totalQty:      Number(r.totalQty    ?? 0),
      revenue,
      cost,
      profit:        revenue - cost,
      transactions:  Number(r.transactions ?? 0),
    };
  });

  return {
    totalRevenue:  items.reduce((s, i) => s + i.revenue, 0),
    totalQty:      items.reduce((s, i) => s + i.totalQty, 0),
    totalProducts: items.length,
    items,
  };
}

export async function getDueReport(shopId: number) {
  const customers = await db
    .select()
    .from(customersTable)
    .where(and(eq(customersTable.shopId, shopId), lt(customersTable.balance, "0")))
    .orderBy(customersTable.balance);

  const items = customers.map((c) => ({
    id:            c.id,
    name:          c.name,
    phone:         c.phone,
    due:           Math.abs(Number(c.balance)),
    balance:       Number(c.balance),
    totalPurchase: Number(c.totalPurchase),
  }));

  return {
    totalDue:      items.reduce((s, c) => s + c.due, 0),
    customerCount: items.length,
    items,
  };
}

export async function getStaffReport(shopId: number, from?: string, to?: string) {
  const dateConds = buildDateConditions(from, to);

  const rows = await db
    .select({
      userId:       salesTable.userId,
      userName:     usersTable.name,
      totalSales:   sum(salesTable.total),
      totalDue:     sum(salesTable.due),
      totalPaid:    sum(salesTable.paid),
      transactions: count(),
    })
    .from(salesTable)
    .leftJoin(usersTable, eq(usersTable.id, salesTable.userId))
    .where(and(eq(salesTable.shopId, shopId), ...dateConds))
    .groupBy(salesTable.userId, usersTable.name)
    .orderBy(sql`SUM(${salesTable.total}) DESC`);

  const items = rows.map((r) => ({
    userId:       r.userId,
    userName:     r.userName ?? "অজানা",
    totalSales:   Number(r.totalSales   ?? 0),
    totalDue:     Number(r.totalDue     ?? 0),
    totalPaid:    Number(r.totalPaid    ?? 0),
    transactions: Number(r.transactions ?? 0),
  }));

  return {
    totalSales:        items.reduce((s, r) => s + r.totalSales,   0),
    totalTransactions: items.reduce((s, r) => s + r.transactions, 0),
    staffCount:        items.length,
    items,
  };
}
