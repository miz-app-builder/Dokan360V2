import { db, userModuleAccessTable, usersTable, MODULE_KEYS } from "@workspace/db";
import { eq, and } from "drizzle-orm";

export interface UserAccessListItem {
  userId:          number;
  name:            string;
  email:           string;
  role:            string;
  isActive:        boolean;
  allowedModules:  string[];
  dataRestriction: string;
  hasOverride:     boolean;
}

export interface UserAccessDetail {
  allowedModules:  string[];
  dataRestriction: string;
  hasOverride:     boolean;
}

export async function getUserAccessList(shopId: number): Promise<UserAccessListItem[]> {
  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.shopId, shopId));

  const accessRows = await db
    .select()
    .from(userModuleAccessTable)
    .where(eq(userModuleAccessTable.shopId, shopId));

  return users.map((u) => {
    const row        = accessRows.find((r) => r.userId === u.id);
    const hasOverride = !!row;
    let allowedModules: string[];

    try {
      allowedModules = hasOverride ? (JSON.parse(row!.allowedModules) as string[]) : MODULE_KEYS.slice();
    } catch {
      allowedModules = MODULE_KEYS.slice();
    }

    return {
      userId:          u.id,
      name:            u.name,
      email:           u.email,
      role:            u.role,
      isActive:        u.isActive,
      allowedModules,
      dataRestriction: row?.dataRestriction ?? "none",
      hasOverride,
    };
  });
}

export async function getUserAccess(shopId: number, userId: number): Promise<UserAccessDetail> {
  const [row] = await db
    .select()
    .from(userModuleAccessTable)
    .where(
      and(
        eq(userModuleAccessTable.shopId, shopId),
        eq(userModuleAccessTable.userId, userId),
      ),
    );

  let allowedModules: string[];
  try {
    allowedModules = row ? (JSON.parse(row.allowedModules) as string[]) : MODULE_KEYS.slice();
  } catch {
    allowedModules = MODULE_KEYS.slice();
  }

  return {
    allowedModules,
    dataRestriction: row?.dataRestriction ?? "none",
    hasOverride:     !!row,
  };
}

export async function updateUserAccess(
  shopId:          number,
  userId:          number,
  allowedModules:  string[],
  dataRestriction: string,
): Promise<void> {
  await db
    .insert(userModuleAccessTable)
    .values({
      shopId,
      userId,
      allowedModules:  JSON.stringify(allowedModules),
      dataRestriction,
    })
    .onConflictDoUpdate({
      target: [userModuleAccessTable.shopId, userModuleAccessTable.userId],
      set: {
        allowedModules:  JSON.stringify(allowedModules),
        dataRestriction,
        updatedAt:       new Date(),
      },
    });
}

export async function resetUserAccess(shopId: number, userId: number): Promise<void> {
  await db
    .delete(userModuleAccessTable)
    .where(
      and(
        eq(userModuleAccessTable.shopId, shopId),
        eq(userModuleAccessTable.userId, userId),
      ),
    );
}

export { MODULE_KEYS };
