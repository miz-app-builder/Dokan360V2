import { db, customersTable, ledgerEntriesTable } from "@workspace/db";
import { eq, and, ilike, desc, count } from "drizzle-orm";
import { NotFoundError, ValidationError } from "../../common/errors";

function formatCustomer(c: typeof customersTable.$inferSelect) {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    address: c.address,
    balance: Number(c.balance),
    totalPurchase: Number(c.totalPurchase),
    createdAt: c.createdAt.toISOString(),
  };
}

export async function listCustomers(shopId: number, search?: string) {
  const conditions = [eq(customersTable.shopId, shopId)];
  if (search) conditions.push(ilike(customersTable.name, `%${search}%`));
  const customers = await db
    .select()
    .from(customersTable)
    .where(and(...conditions))
    .orderBy(desc(customersTable.createdAt));
  return customers.map(formatCustomer);
}

export async function getCustomer(shopId: number, id: number) {
  const [customer] = await db
    .select()
    .from(customersTable)
    .where(and(eq(customersTable.id, id), eq(customersTable.shopId, shopId)));
  if (!customer) throw new NotFoundError("গ্রাহক পাওয়া যায়নি");
  return formatCustomer(customer);
}

export async function createCustomer(
  shopId: number,
  data: { name: string; phone?: string | null; email?: string | null; address?: string | null },
) {
  const [customer] = await db.insert(customersTable).values({ ...data, shopId }).returning();
  return formatCustomer(customer);
}

export async function updateCustomer(
  shopId: number,
  id: number,
  data: { name?: string; phone?: string | null; email?: string | null; address?: string | null },
) {
  const [customer] = await db
    .update(customersTable)
    .set(data)
    .where(and(eq(customersTable.id, id), eq(customersTable.shopId, shopId)))
    .returning();
  if (!customer) throw new NotFoundError("গ্রাহক পাওয়া যায়নি");
  return formatCustomer(customer);
}

export async function deleteCustomer(shopId: number, id: number) {
  const [customer] = await db
    .select()
    .from(customersTable)
    .where(and(eq(customersTable.id, id), eq(customersTable.shopId, shopId)));
  if (!customer) throw new NotFoundError("গ্রাহক পাওয়া যায়নি");

  const [ledgerCount] = await db
    .select({ total: count() })
    .from(ledgerEntriesTable)
    .where(eq(ledgerEntriesTable.customerId, id));

  if (ledgerCount.total > 0) {
    throw new ValidationError("লেনদেনের ইতিহাস আছে এমন গ্রাহক মুছে ফেলা যাবে না");
  }

  await db.delete(customersTable).where(and(eq(customersTable.id, id), eq(customersTable.shopId, shopId)));
}

export async function collectPayment(shopId: number, id: number, amount: number, note?: string) {
  if (amount <= 0) throw new ValidationError("পরিশোধের পরিমাণ শূন্যের বেশি হতে হবে");

  const [customer] = await db
    .select()
    .from(customersTable)
    .where(and(eq(customersTable.id, id), eq(customersTable.shopId, shopId)));
  if (!customer) throw new NotFoundError("গ্রাহক পাওয়া যায়নি");

  const newBalance = Number(customer.balance) + amount;
  const [updated] = await db
    .update(customersTable)
    .set({ balance: String(newBalance) })
    .where(eq(customersTable.id, id))
    .returning();

  await db.insert(ledgerEntriesTable).values({
    customerId: id,
    saleId: null,
    type: "payment",
    amount: String(amount),
    balance: String(newBalance),
    note: note ?? "নগদ পরিশোধ",
  });

  return formatCustomer(updated);
}

export async function getCustomerLedger(id: number) {
  const entries = await db
    .select()
    .from(ledgerEntriesTable)
    .where(eq(ledgerEntriesTable.customerId, id))
    .orderBy(desc(ledgerEntriesTable.createdAt));
  return entries.map((e) => ({
    id: e.id,
    type: e.type,
    amount: Number(e.amount),
    balance: Number(e.balance),
    note: e.note,
    saleId: e.saleId,
    createdAt: e.createdAt.toISOString(),
  }));
}
