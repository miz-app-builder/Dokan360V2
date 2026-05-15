import {
  db,
  leaveTypesTable,
  leaveTypeOverridesTable,
} from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";
import { NotFoundError } from "../../common/errors";
import type { LeaveTypeDto } from "./leaves.types";

// ─── Internal types ────────────────────────────────────────────────────────────

type RawLeaveType = typeof leaveTypesTable.$inferSelect;
type RawOverride  = typeof leaveTypeOverridesTable.$inferSelect;

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mergeWithOverride(base: RawLeaveType, override: RawOverride | undefined): LeaveTypeDto {
  return {
    id:           base.id,
    shopId:       base.shopId,
    name:         override?.name ?? base.name,
    nameBn:       override?.nameBn ?? base.nameBn,
    defaultDays:  override?.defaultDays ?? base.defaultDays,
    isPaid:       override?.isPaid ?? base.isPaid,
    color:        override?.color ?? base.color,
    isActive:     override?.isActive ?? base.isActive,
    isDefault:    true,
    isOverridden: !!override,
    createdAt:    base.createdAt.toISOString(),
    updatedAt:    override?.updatedAt.toISOString() ?? base.updatedAt.toISOString(),
  };
}

function mapShopLeaveType(row: RawLeaveType): LeaveTypeDto {
  return {
    id:           row.id,
    shopId:       row.shopId,
    name:         row.name,
    nameBn:       row.nameBn,
    defaultDays:  row.defaultDays,
    isPaid:       row.isPaid,
    color:        row.color,
    isActive:     row.isActive,
    isDefault:    false,
    isOverridden: false,
    createdAt:    row.createdAt.toISOString(),
    updatedAt:    row.updatedAt.toISOString(),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchOverride(shopId: number, leaveTypeId: number): Promise<RawOverride | undefined> {
  const [row] = await db
    .select()
    .from(leaveTypeOverridesTable)
    .where(
      and(
        eq(leaveTypeOverridesTable.shopId, shopId),
        eq(leaveTypeOverridesTable.leaveTypeId, leaveTypeId),
      ),
    );
  return row;
}

async function upsertOverride(
  shopId: number,
  leaveTypeId: number,
  data: Partial<{
    isHidden: boolean; name: string; nameBn: string;
    defaultDays: number; isPaid: boolean; color: string; isActive: boolean;
  }>,
): Promise<void> {
  const existing = await fetchOverride(shopId, leaveTypeId);
  if (existing) {
    await db
      .update(leaveTypeOverridesTable)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(leaveTypeOverridesTable.shopId, shopId),
          eq(leaveTypeOverridesTable.leaveTypeId, leaveTypeId),
        ),
      );
  } else {
    await db
      .insert(leaveTypeOverridesTable)
      .values({ shopId, leaveTypeId, ...data });
  }
}

// ─── Public service functions ──────────────────────────────────────────────────

export async function listLeaveTypes(shopId: number): Promise<LeaveTypeDto[]> {
  const [defaults, shopTypes, overrides] = await Promise.all([
    db.select().from(leaveTypesTable).where(isNull(leaveTypesTable.shopId)).orderBy(leaveTypesTable.name),
    db.select().from(leaveTypesTable).where(eq(leaveTypesTable.shopId, shopId)).orderBy(leaveTypesTable.name),
    db.select().from(leaveTypeOverridesTable).where(eq(leaveTypeOverridesTable.shopId, shopId)),
  ]);

  const overrideMap = new Map<number, RawOverride>(overrides.map((o) => [o.leaveTypeId, o]));
  const result: LeaveTypeDto[] = [];

  for (const def of defaults) {
    const ov = overrideMap.get(def.id);
    if (ov?.isHidden) continue;
    result.push(mergeWithOverride(def, ov));
  }
  for (const st of shopTypes) {
    result.push(mapShopLeaveType(st));
  }
  return result;
}

export async function createLeaveType(
  shopId: number,
  data: { name: string; nameBn: string; defaultDays: number; isPaid: boolean; color: string },
): Promise<LeaveTypeDto> {
  const [row] = await db.insert(leaveTypesTable).values({ shopId, ...data }).returning();
  if (!row) throw new Error("Insert failed");
  return mapShopLeaveType(row);
}

export async function updateLeaveType(
  shopId: number,
  id: number,
  data: Partial<{ name: string; nameBn: string; defaultDays: number; isPaid: boolean; color: string; isActive: boolean }>,
): Promise<LeaveTypeDto> {
  const [leaveType] = await db.select().from(leaveTypesTable).where(eq(leaveTypesTable.id, id));
  if (!leaveType) throw new NotFoundError("Leave type not found");

  if (leaveType.shopId === null) {
    await upsertOverride(shopId, id, { ...data, isHidden: false });
    const ov = await fetchOverride(shopId, id);
    return mergeWithOverride(leaveType, ov);
  }

  if (leaveType.shopId !== shopId) throw new NotFoundError("Leave type not found");
  const [row] = await db
    .update(leaveTypesTable)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(leaveTypesTable.id, id), eq(leaveTypesTable.shopId, shopId)))
    .returning();
  if (!row) throw new NotFoundError("Leave type not found");
  return mapShopLeaveType(row);
}

export async function deleteLeaveType(shopId: number, id: number): Promise<void> {
  const [leaveType] = await db.select().from(leaveTypesTable).where(eq(leaveTypesTable.id, id));
  if (!leaveType) throw new NotFoundError("Leave type not found");

  if (leaveType.shopId === null) {
    await upsertOverride(shopId, id, { isHidden: true });
    return;
  }

  if (leaveType.shopId !== shopId) throw new NotFoundError("Leave type not found");
  const result = await db
    .delete(leaveTypesTable)
    .where(and(eq(leaveTypesTable.id, id), eq(leaveTypesTable.shopId, shopId)))
    .returning({ id: leaveTypesTable.id });
  if (result.length === 0) throw new NotFoundError("Leave type not found");
}
