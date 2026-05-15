import { db, usersTable, shopsTable, employeesTable } from "@workspace/db";
import { initDefaultPermissions } from "../permissions/permissions.service";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { supabaseAdmin } from "../../lib/supabase";
import { ValidationError, NotFoundError } from "../../common/errors";
import { logAudit } from "./audit.service";

export interface RequestContext {
  ip?:        string | null;
  userAgent?: string | null;
}

type UserRow      = typeof usersTable.$inferSelect;
type EmployeeRow  = typeof employeesTable.$inferSelect;

async function fetchLinkedEmployee(userId: number): Promise<EmployeeRow | null> {
  const [emp] = await db
    .select()
    .from(employeesTable)
    .where(eq(employeesTable.userId, userId))
    .limit(1);
  return emp ?? null;
}

function formatUser(user: UserRow, shopName: string, employee?: EmployeeRow | null) {
  return {
    id:            user.id,
    name:          user.name,
    displayName:   employee?.name ?? user.name,
    email:         user.email,
    role:          user.role,
    isActive:      user.isActive,
    shopId:        user.shopId,
    shopName,
    employeePhoto: employee?.photo ?? null,
    createdAt:     user.createdAt.toISOString(),
  };
}

function formatShopUser(user: UserRow) {
  return {
    id:        user.id,
    name:      user.name,
    email:     user.email,
    role:      user.role,
    isActive:  user.isActive,
    shopId:    user.shopId,
    createdAt: user.createdAt.toISOString(),
  };
}

export const InviteUserSchema = z.object({
  name:     z.string().min(2),
  email:    z.string().email(),
  password: z.string().min(6),
  role:     z.enum(["admin", "seller", "viewer"]),
});

export const UpdateUserSchema = z.object({
  name:     z.string().min(2).optional(),
  role:     z.enum(["admin", "seller", "viewer"]).optional(),
  isActive: z.boolean().optional(),
});

export async function loginUser(
  email: string,
  password: string,
  ctx: RequestContext = {},
) {
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });

  if (error || !data.session || !data.user) {
    await logAudit("login_failed", { ip: ctx.ip, userAgent: ctx.userAgent, meta: { email } });
    throw new ValidationError("ইমেইল বা পাসওয়ার্ড ভুল");
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.supabaseUid, data.user.id), eq(usersTable.isActive, true)));

  if (!user) {
    await logAudit("login_failed", { ip: ctx.ip, userAgent: ctx.userAgent, meta: { email } });
    throw new ValidationError("অ্যাকাউন্ট পাওয়া যায়নি বা নিষ্ক্রিয়");
  }

  const [shop]     = await db.select().from(shopsTable).where(eq(shopsTable.id, user.shopId));
  const employee   = await fetchLinkedEmployee(user.id);

  await logAudit("login_success", { userId: user.id, shopId: user.shopId, ip: ctx.ip, userAgent: ctx.userAgent });

  return {
    accessToken:  data.session.access_token,
    refreshToken: data.session.refresh_token,
    user: formatUser(user, shop?.name ?? "", employee),
  };
}

export async function registerShop(
  data: {
    name: string;
    email: string;
    password: string;
    shopName: string;
    shopPhone?: string | null;
  },
  ctx: RequestContext = {},
) {
  const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
    email:             data.email,
    password:          data.password,
    email_confirm:     false,   /* OTP verification will confirm the email */
  });

  if (error || !authData.user) {
    if (error?.message?.includes("already registered") || error?.message?.includes("already been registered")) {
      throw new ValidationError("এই ইমেইল ইতিমধ্যে নিবন্ধিত");
    }
    throw new ValidationError(error?.message ?? "নিবন্ধন ব্যর্থ হয়েছে");
  }

  const [shop] = await db
    .insert(shopsTable)
    .values({ name: data.shopName, phone: data.shopPhone ?? undefined })
    .returning();

  const [user] = await db
    .insert(usersTable)
    .values({
      supabaseUid: authData.user.id,
      name:        data.name,
      email:       data.email,
      role:        "admin",
      shopId:      shop.id,
    })
    .returning();

  await initDefaultPermissions(shop.id);

  await logAudit("register", {
    userId:    user.id,
    shopId:    shop.id,
    ip:        ctx.ip,
    userAgent: ctx.userAgent,
    meta:      { shopName: data.shopName },
  });

  /* Do not return a session — OTP verification (via Supabase email OTP) will
     confirm the user's email and create the session on the frontend. */
  return { email: data.email };
}

export async function getMe(userId: number) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) throw new NotFoundError("ব্যবহারকারী পাওয়া যায়নি");
  const [shop, employee] = await Promise.all([
    db.select().from(shopsTable).where(eq(shopsTable.id, user.shopId)).then(r => r[0]),
    fetchLinkedEmployee(user.id),
  ]);
  return formatUser(user, shop?.name ?? "", employee);
}

export async function refreshTokens(refreshToken: string, ctx: RequestContext = {}) {
  const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token: refreshToken });

  if (error || !data.session) {
    await logAudit("token_refresh_failed", { ip: ctx.ip, userAgent: ctx.userAgent });
    throw new ValidationError("রিফ্রেশ টোকেন অবৈধ বা মেয়াদোত্তীর্ণ");
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.supabaseUid, data.user!.id), eq(usersTable.isActive, true)));

  if (!user) throw new ValidationError("অ্যাকাউন্ট পাওয়া যায়নি বা নিষ্ক্রিয়");

  await logAudit("token_refresh", { userId: user.id, shopId: user.shopId, ip: ctx.ip, userAgent: ctx.userAgent });

  return {
    accessToken:  data.session.access_token,
    refreshToken: data.session.refresh_token,
  };
}

export async function logoutUser(supabaseUid?: string, ctx: RequestContext = {}): Promise<void> {
  if (supabaseUid) {
    await supabaseAdmin.auth.admin.signOut(supabaseUid).catch(() => null);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.supabaseUid, supabaseUid));
    if (user) {
      await logAudit("logout", { userId: user.id, ip: ctx.ip, userAgent: ctx.userAgent });
    }
  }
}

export async function listShopUsers(shopId: number) {
  const users = await db.select().from(usersTable).where(eq(usersTable.shopId, shopId));
  return users.map(formatShopUser);
}

export async function inviteUser(
  shopId: number,
  data: z.infer<typeof InviteUserSchema>,
  ctx: RequestContext = {},
) {
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, data.email));
  if (existing) throw new ValidationError("এই ইমেইল ইতিমধ্যে ব্যবহৃত হচ্ছে");

  const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
    email:         data.email,
    password:      data.password,
    email_confirm: true,
  });

  if (error || !authData.user) {
    throw new ValidationError(error?.message ?? "ব্যবহারকারী তৈরি ব্যর্থ হয়েছে");
  }

  const [user] = await db
    .insert(usersTable)
    .values({
      supabaseUid: authData.user.id,
      name:        data.name,
      email:       data.email,
      role:        data.role,
      shopId,
    })
    .returning();

  await logAudit("user_invited", {
    shopId,
    ip:        ctx.ip,
    userAgent: ctx.userAgent,
    meta:      { invitedEmail: data.email, role: data.role },
  });

  return formatShopUser(user);
}

export async function updateUser(
  shopId:   number,
  targetId: number,
  selfId:   number,
  data: z.infer<typeof UpdateUserSchema>,
  ctx: RequestContext = {},
) {
  if (targetId === selfId && data.isActive === false) {
    throw new ValidationError("নিজেকে নিষ্ক্রিয় করা যাবে না");
  }

  const [user] = await db
    .update(usersTable)
    .set(data)
    .where(and(eq(usersTable.id, targetId), eq(usersTable.shopId, shopId)))
    .returning();

  if (!user) throw new NotFoundError("ব্যবহারকারী পাওয়া যায়নি");

  if (data.isActive === false && user.supabaseUid) {
    await supabaseAdmin.auth.admin.deleteUser(user.supabaseUid).catch(() => null);
    await logAudit("user_deactivated", { userId: targetId, shopId, ip: ctx.ip, userAgent: ctx.userAgent });
  }

  if (data.role) {
    await logAudit("user_role_changed", { userId: targetId, shopId, ip: ctx.ip, userAgent: ctx.userAgent, meta: { newRole: data.role } });
  }

  return formatShopUser(user);
}

export async function deactivateUser(shopId: number, targetId: number, selfId: number, ctx: RequestContext = {}) {
  if (targetId === selfId) throw new ValidationError("নিজেকে নিষ্ক্রিয় করা যাবে না");

  const [user] = await db
    .update(usersTable)
    .set({ isActive: false })
    .where(and(eq(usersTable.id, targetId), eq(usersTable.shopId, shopId)))
    .returning();

  if (!user) throw new NotFoundError("ব্যবহারকারী পাওয়া যায়নি");

  if (user.supabaseUid) {
    await supabaseAdmin.auth.admin.deleteUser(user.supabaseUid).catch(() => null);
  }
  await logAudit("user_deactivated", { userId: targetId, shopId, ip: ctx.ip, userAgent: ctx.userAgent });
}

export const UpdateShopSchema = z.object({
  name:          z.string().min(1).optional(),
  phone:         z.string().nullable().optional(),
  address:       z.string().nullable().optional(),
  email:         z.string().email().nullable().optional(),
  website:       z.string().nullable().optional(),
  taxNumber:     z.string().nullable().optional(),
  taxRate:       z.number().min(0).max(100).nullable().optional(),
  invoicePrefix: z.string().nullable().optional(),
  invoiceNote:   z.string().nullable().optional(),
  logo:          z.string().nullable().optional(),
});

function formatShop(shop: typeof shopsTable.$inferSelect) {
  return {
    id:            shop.id,
    name:          shop.name,
    address:       shop.address,
    phone:         shop.phone,
    email:         shop.email,
    website:       shop.website,
    currency:      shop.currency,
    taxNumber:     shop.taxNumber,
    taxRate:       Number(shop.taxRate ?? 0),
    invoicePrefix: shop.invoicePrefix,
    invoiceNote:   shop.invoiceNote,
    logo:          shop.logo,
  };
}

export async function getShop(shopId: number) {
  const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.id, shopId));
  if (!shop) throw new NotFoundError("দোকান পাওয়া যায়নি");
  return formatShop(shop);
}

export async function updateShop(shopId: number, data: z.infer<typeof UpdateShopSchema>) {
  const updateData: Record<string, unknown> = {};
  if (data.name          !== undefined) updateData.name          = data.name;
  if (data.phone         !== undefined) updateData.phone         = data.phone;
  if (data.address       !== undefined) updateData.address       = data.address;
  if (data.email         !== undefined) updateData.email         = data.email;
  if (data.website       !== undefined) updateData.website       = data.website;
  if (data.taxNumber     !== undefined) updateData.taxNumber     = data.taxNumber;
  if (data.taxRate       !== undefined) updateData.taxRate       = data.taxRate != null ? String(data.taxRate) : null;
  if (data.invoicePrefix !== undefined) updateData.invoicePrefix = data.invoicePrefix;
  if (data.invoiceNote   !== undefined) updateData.invoiceNote   = data.invoiceNote;
  if (data.logo          !== undefined) updateData.logo          = data.logo;

  const [shop] = await db
    .update(shopsTable)
    .set(updateData)
    .where(eq(shopsTable.id, shopId))
    .returning();

  if (!shop) throw new NotFoundError("দোকান পাওয়া যায়নি");
  return formatShop(shop);
}
