import { db, rolePermissionsTable, userRolesTable } from "@workspace/db";
import {
  ROLE_CATEGORIES,
  PERMISSION_KEYS,
  DEFAULT_PERMISSIONS,
  BUILTIN_ROLE_LABELS,
  type RoleCategory,
  type PermissionKey,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";

export type PermissionMatrix = Record<string, Record<string, boolean>>;

function buildDefaultPerms(role: string): Record<string, boolean> {
  const defaults = DEFAULT_PERMISSIONS[role as RoleCategory] ?? [];
  const perms: Record<string, boolean> = {};
  for (const perm of PERMISSION_KEYS) {
    perms[perm] = defaults.includes(perm as PermissionKey);
  }
  return perms;
}

function parsePerms(json: string): Record<string, boolean> {
  try {
    return JSON.parse(json) as Record<string, boolean>;
  } catch {
    return {};
  }
}

export async function getRolePermissions(shopId: number): Promise<PermissionMatrix> {
  const rows = await db
    .select()
    .from(rolePermissionsTable)
    .where(eq(rolePermissionsTable.shopId, shopId));

  const matrix: PermissionMatrix = {};

  for (const role of ROLE_CATEGORIES) {
    const row = rows.find((r) => r.roleCategory === role);
    if (row) {
      const stored = parsePerms(row.permissions);
      matrix[role] = {};
      for (const perm of PERMISSION_KEYS) {
        matrix[role][perm] = stored[perm] ?? buildDefaultPerms(role)[perm] ?? false;
      }
    } else {
      matrix[role] = buildDefaultPerms(role);
    }
  }

  const builtInSet = new Set<string>(ROLE_CATEGORIES);
  const customRows = rows.filter((r) => !builtInSet.has(r.roleCategory));
  for (const row of customRows) {
    const stored = parsePerms(row.permissions);
    matrix[row.roleCategory] = {};
    for (const perm of PERMISSION_KEYS) {
      matrix[row.roleCategory][perm] = stored[perm] ?? false;
    }
  }

  return matrix;
}

export async function updateRolePermissions(
  shopId: number,
  role: string,
  permissions: Record<string, boolean>,
): Promise<void> {
  await db
    .insert(rolePermissionsTable)
    .values({ shopId, roleCategory: role, permissions: JSON.stringify(permissions) })
    .onConflictDoUpdate({
      target: [rolePermissionsTable.shopId, rolePermissionsTable.roleCategory],
      set: { permissions: JSON.stringify(permissions), updatedAt: new Date() },
    });
}

export async function resetRolePermissions(shopId: number, role: string): Promise<void> {
  await db
    .delete(rolePermissionsTable)
    .where(
      and(
        eq(rolePermissionsTable.shopId, shopId),
        eq(rolePermissionsTable.roleCategory, role),
      ),
    );
}

export async function initDefaultPermissions(shopId: number): Promise<void> {
  for (const role of ROLE_CATEGORIES) {
    const permissions = buildDefaultPerms(role);
    await db
      .insert(rolePermissionsTable)
      .values({ shopId, roleCategory: role, permissions: JSON.stringify(permissions) })
      .onConflictDoNothing();
  }
}

/* ─── Seed built-in roles into user_roles table ─────────────── */

async function ensureBuiltinRolesSeeded(shopId: number): Promise<void> {
  const existing = await db
    .select({ id: userRolesTable.id })
    .from(userRolesTable)
    .where(and(eq(userRolesTable.shopId, shopId), eq(userRolesTable.isBuiltin, true)));

  const existingIds = new Set(existing.map((r) => r.id));

  const toInsert = ROLE_CATEGORIES
    .filter((role) => !existingIds.has(role))
    .map((role, idx) => ({
      id:        role,
      shopId,
      label:     BUILTIN_ROLE_LABELS[role] ?? role,
      baseRole:  role,
      dotIdx:    idx,
      isBuiltin: true,
    }));

  if (toInsert.length > 0) {
    await db.insert(userRolesTable).values(toInsert).onConflictDoNothing();
  }
}

/* ─── User Roles (formerly Custom Roles) ────────────────────── */

export async function listCustomRoles(shopId: number) {
  await ensureBuiltinRolesSeeded(shopId);
  return db
    .select()
    .from(userRolesTable)
    .where(eq(userRolesTable.shopId, shopId))
    .orderBy(userRolesTable.isBuiltin, userRolesTable.createdAt);
}

export async function createCustomRole(
  shopId: number,
  id: string,
  label: string,
  baseRole: string,
  dotIdx: number,
  initPerms: Record<string, boolean>,
) {
  const [row] = await db
    .insert(userRolesTable)
    .values({ id, shopId, label, baseRole, dotIdx, isBuiltin: false })
    .returning();

  await updateRolePermissions(shopId, id, initPerms);

  return row;
}

export async function deleteCustomRole(shopId: number, id: string) {
  await resetRolePermissions(shopId, id);
  const [deleted] = await db
    .delete(userRolesTable)
    .where(and(eq(userRolesTable.id, id), eq(userRolesTable.shopId, shopId), eq(userRolesTable.isBuiltin, false)))
    .returning();
  return deleted ?? null;
}

export { ROLE_CATEGORIES, PERMISSION_KEYS, DEFAULT_PERMISSIONS };
