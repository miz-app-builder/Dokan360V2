import { db, employeesTable, usersTable, userRolesTable } from "@workspace/db";
import { eq, and, notInArray } from "drizzle-orm";
import { NotFoundError, ValidationError } from "../../common/errors";
import { supabaseAdmin } from "../../lib/supabase";
import { logAudit } from "../auth/audit.service";

type EmployeeRow = typeof employeesTable.$inferSelect;
type UserRow    = typeof usersTable.$inferSelect;

export type EmployeeDto = {
  id:               number;
  shopId:           number;
  employeeCode:     string | null;
  name:             string;
  fatherName:       string | null;
  motherName:       string | null;
  phone:            string | null;
  emergencyContact: string | null;
  email:            string | null;
  address:          string | null;
  nidNumber:        string | null;
  dateOfBirth:      string | null;
  gender:           string | null;
  joiningDate:      string | null;
  bloodGroup:       string | null;
  salary:           number | null;
  salaryGradeId:    number | null;
  status:           string;
  department:       string | null;
  designation:      string | null;
  photo:            string | null;
  nidDocPath:       string | null;
  cvPath:           string | null;
  contractPath:     string | null;
  notes:            string | null;
  userId:           number | null;
  hasSystemAccess:  boolean;
  systemRole:       string | null;
  systemRoleLabel:  string | null;
  isSystemOnly:     false;
  createdAt:        string;
  updatedAt:        string;
};

export type SystemUserDto = {
  id:               number; // -(user.id) — negative sentinel
  shopId:           number;
  employeeCode:     null;
  name:             string;
  fatherName:       null;
  motherName:       null;
  phone:            null;
  emergencyContact: null;
  email:            string;
  address:          null;
  nidNumber:        null;
  dateOfBirth:      null;
  gender:           null;
  joiningDate:      null;
  bloodGroup:       null;
  salary:           null;
  status:           "active";
  department:       null;
  designation:      null;
  photo:            null;
  notes:            null;
  userId:           number;
  hasSystemAccess:  true;
  systemRole:       string;
  systemRoleLabel:  string | null;
  isSystemOnly:     true;
  createdAt:        string;
  updatedAt:        string;
};

export type EmployeeListItem = EmployeeDto | SystemUserDto;

/* ─── users.role enum → user_roles.id mapping ───────────────── */

export const USER_ROLE_TO_ROLE_ID: Record<string, string> = {
  admin:  "shop_admin",
  seller: "seller",
  viewer: "viewer",
};

async function buildRoleLabelMap(shopId: number): Promise<Map<string, string>> {
  const rows = await db
    .select({ id: userRolesTable.id, label: userRolesTable.label })
    .from(userRolesTable)
    .where(eq(userRolesTable.shopId, shopId));
  const map = new Map<string, string>();
  for (const row of rows) map.set(row.id, row.label);
  return map;
}

/**
 * Resolves the human-readable role label from user_roles table.
 * Prefers `userRoleId` (direct FK) over enum-based mapping.
 */
function resolveRoleLabel(
  userRole: string | null | undefined,
  roleLabelMap: Map<string, string>,
  userRoleId?: string | null,
): string | null {
  if (userRoleId) return roleLabelMap.get(userRoleId) ?? null;
  if (!userRole) return null;
  const roleId = USER_ROLE_TO_ROLE_ID[userRole] ?? userRole;
  return roleLabelMap.get(roleId) ?? roleLabelMap.get(userRole) ?? null;
}

function fmtEmployee(
  e: EmployeeRow,
  user: UserRow | null,
  roleLabelMap: Map<string, string> = new Map(),
): EmployeeDto {
  const systemRole    = user?.role ?? null;
  const systemRoleId  = user?.userRoleId ?? null;
  return {
    id:               e.id,
    shopId:           e.shopId,
    employeeCode:     e.employeeCode,
    name:             e.name,
    fatherName:       e.fatherName,
    motherName:       e.motherName,
    phone:            e.phone,
    emergencyContact: e.emergencyContact,
    email:            e.email,
    address:          e.address,
    nidNumber:        e.nidNumber,
    dateOfBirth:      e.dateOfBirth,
    gender:           e.gender,
    joiningDate:      e.joiningDate,
    bloodGroup:       e.bloodGroup,
    salary:           e.salary !== null ? Number(e.salary) : null,
    salaryGradeId:    e.salaryGradeId ?? null,
    status:           e.status,
    department:       e.department,
    designation:      e.designation,
    photo:            e.photo,
    nidDocPath:       e.nidDocPath,
    cvPath:           e.cvPath,
    contractPath:     e.contractPath,
    notes:            e.notes,
    userId:           e.userId,
    hasSystemAccess:  user !== null && user.isActive,
    systemRole,
    systemRoleLabel:  resolveRoleLabel(systemRole, roleLabelMap, systemRoleId),
    isSystemOnly:     false,
    createdAt:        e.createdAt.toISOString(),
    updatedAt:        e.updatedAt.toISOString(),
  };
}

function fmtSystemUser(u: UserRow, roleLabelMap: Map<string, string> = new Map()): SystemUserDto {
  return {
    id:               -(u.id),
    shopId:           u.shopId,
    employeeCode:     null,
    name:             u.name,
    fatherName:       null,
    motherName:       null,
    phone:            null,
    emergencyContact: null,
    email:            u.email,
    address:          null,
    nidNumber:        null,
    dateOfBirth:      null,
    gender:           null,
    joiningDate:      null,
    bloodGroup:       null,
    salary:           null,
    status:           "active",
    department:       null,
    designation:      null,
    photo:            null,
    notes:            null,
    userId:           u.id,
    hasSystemAccess:  true,
    systemRole:       u.role,
    systemRoleLabel:  resolveRoleLabel(u.role, roleLabelMap, u.userRoleId),
    isSystemOnly:     true,
    createdAt:        u.createdAt.toISOString(),
    updatedAt:        u.updatedAt.toISOString(),
  };
}

/* ─── List employees + unlinked system users ─────────────────── */

export async function listEmployees(
  shopId:      number,
  search?:     string,
  status?:     string,
  department?: string,
  designation?: string,
): Promise<EmployeeListItem[]> {
  const conditions: ReturnType<typeof eq>[] = [eq(employeesTable.shopId, shopId)];
  if (status)      conditions.push(eq(employeesTable.status, status as EmployeeRow["status"]));
  if (department)  conditions.push(eq(employeesTable.department, department));
  if (designation) conditions.push(eq(employeesTable.designation, designation));

  const empRows = await db
    .select()
    .from(employeesTable)
    .where(and(...conditions))
    .orderBy(employeesTable.name);

  const linkedUserIds = empRows
    .filter((e) => e.userId !== null)
    .map((e) => e.userId as number);

  const userMap = new Map<number, UserRow>();
  if (linkedUserIds.length > 0) {
    const linkedUsers = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.shopId, shopId)));
    for (const u of linkedUsers) userMap.set(u.id, u);
  }

  const roleLabelMap = await buildRoleLabelMap(shopId);

  let employees: EmployeeDto[] = empRows.map((e) =>
    fmtEmployee(e, e.userId ? (userMap.get(e.userId) ?? null) : null, roleLabelMap),
  );

  if (search) {
    const q = search.toLowerCase();
    employees = employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.phone && e.phone.toLowerCase().includes(q)) ||
        (e.employeeCode && e.employeeCode.toLowerCase().includes(q)) ||
        (e.email && e.email.toLowerCase().includes(q)),
    );
  }

  if (status || department || designation) {
    return employees;
  }

  const allShopUsers = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.shopId, shopId));

  const unlinkedUsers = allShopUsers.filter(
    (u) => !linkedUserIds.includes(u.id),
  );

  let systemOnly: SystemUserDto[] = unlinkedUsers.map((u) => fmtSystemUser(u, roleLabelMap));

  if (search) {
    const q = search.toLowerCase();
    systemOnly = systemOnly.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    );
  }

  return [...employees, ...systemOnly];
}

/* ─── Get single employee ────────────────────────────────────── */

export async function getEmployee(shopId: number, id: number): Promise<EmployeeDto> {
  const [e] = await db
    .select()
    .from(employeesTable)
    .where(and(eq(employeesTable.id, id), eq(employeesTable.shopId, shopId)));
  if (!e) throw new NotFoundError("কর্মী পাওয়া যায়নি");

  let user: UserRow | null = null;
  if (e.userId) {
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, e.userId));
    user = u ?? null;
  }
  const roleLabelMap = await buildRoleLabelMap(shopId);
  return fmtEmployee(e, user, roleLabelMap);
}

/* ─── POS access types ───────────────────────────────────────── */

type PosAccessInput = {
  email:    string;
  password: string;
  role:     "admin" | "seller" | "viewer";
};

/* ─── Create employee ────────────────────────────────────────── */

export async function createEmployee(
  shopId:      number,
  data: Omit<typeof employeesTable.$inferInsert, "id" | "shopId" | "userId" | "createdAt" | "updatedAt">,
  posAccess?:  PosAccessInput,
  linkUserId?: number,
): Promise<EmployeeDto> {
  let userId: number | null = linkUserId ?? null;

  if (posAccess && !linkUserId) {
    const [existing] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, posAccess.email));
    if (existing) throw new ValidationError("এই ইমেইল ইতিমধ্যে ব্যবহৃত হচ্ছে");

    const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
      email:         posAccess.email,
      password:      posAccess.password,
      email_confirm: true,
    });
    if (error || !authData.user) {
      throw new ValidationError(error?.message ?? "POS ব্যবহারকারী তৈরি ব্যর্থ হয়েছে");
    }

    const [user] = await db
      .insert(usersTable)
      .values({
        supabaseUid: authData.user.id,
        name:        data.name,
        email:       posAccess.email,
        role:        posAccess.role,
        userRoleId:  USER_ROLE_TO_ROLE_ID[posAccess.role] ?? null,
        shopId,
      })
      .returning();
    userId = user.id;
  }

  const [e] = await db
    .insert(employeesTable)
    .values({ ...data, shopId, userId })
    .returning();

  let linkedUser: UserRow | null = null;
  if (userId) {
    /* When linking to an existing user (system-only → employee), sync users.name */
    if (linkUserId && data.name) {
      await db
        .update(usersTable)
        .set({ name: data.name })
        .where(and(eq(usersTable.id, linkUserId), eq(usersTable.shopId, shopId)));
    }
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    linkedUser = u ?? null;
  }

  const roleLabelMap = await buildRoleLabelMap(shopId);
  return fmtEmployee(e, linkedUser, roleLabelMap);
}

/* ─── Update employee ────────────────────────────────────────── */

export async function updateEmployee(
  shopId: number,
  id:     number,
  data: Partial<Omit<typeof employeesTable.$inferInsert, "id" | "shopId" | "createdAt" | "updatedAt">>,
): Promise<EmployeeDto> {
  const [e] = await db
    .update(employeesTable)
    .set(data)
    .where(and(eq(employeesTable.id, id), eq(employeesTable.shopId, shopId)))
    .returning();
  if (!e) throw new NotFoundError("কর্মী পাওয়া যায়নি");

  let user: UserRow | null = null;
  if (e.userId) {
    /* Sync users.name when employee name changes */
    if (data.name) {
      await db
        .update(usersTable)
        .set({ name: data.name })
        .where(and(eq(usersTable.id, e.userId), eq(usersTable.shopId, shopId)));
    }
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, e.userId));
    user = u ?? null;
  }
  const roleLabelMap = await buildRoleLabelMap(shopId);
  return fmtEmployee(e, user, roleLabelMap);
}

/* ─── Delete employee ────────────────────────────────────────── */

export async function deleteEmployee(shopId: number, id: number): Promise<void> {
  const [e] = await db
    .select()
    .from(employeesTable)
    .where(and(eq(employeesTable.id, id), eq(employeesTable.shopId, shopId)));
  if (!e) throw new NotFoundError("কর্মী পাওয়া যায়নি");
  await db
    .delete(employeesTable)
    .where(and(eq(employeesTable.id, id), eq(employeesTable.shopId, shopId)));
}

/* ─── Grant POS access to existing employee ─────────────────── */

export async function grantEmployeeAccess(
  shopId:     number,
  id:         number,
  posAccess:  PosAccessInput,
  ctx: { ip?: string | null; userAgent?: string | null } = {},
): Promise<EmployeeDto> {
  const [e] = await db
    .select()
    .from(employeesTable)
    .where(and(eq(employeesTable.id, id), eq(employeesTable.shopId, shopId)));
  if (!e) throw new NotFoundError("কর্মী পাওয়া যায়নি");
  if (e.userId) throw new ValidationError("এই কর্মীর ইতিমধ্যে POS অ্যাক্সেস আছে");

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, posAccess.email));
  if (existing) throw new ValidationError("এই ইমেইল ইতিমধ্যে ব্যবহৃত হচ্ছে");

  const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
    email:         posAccess.email,
    password:      posAccess.password,
    email_confirm: true,
  });
  if (error || !authData.user) {
    throw new ValidationError(error?.message ?? "POS ব্যবহারকারী তৈরি ব্যর্থ হয়েছে");
  }

  const [user] = await db
    .insert(usersTable)
    .values({
      supabaseUid: authData.user.id,
      name:        e.name,
      email:       posAccess.email,
      role:        posAccess.role,
      userRoleId:  USER_ROLE_TO_ROLE_ID[posAccess.role] ?? null,
      shopId,
    })
    .returning();

  const [updated] = await db
    .update(employeesTable)
    .set({ userId: user.id })
    .where(eq(employeesTable.id, id))
    .returning();

  await logAudit("user_invited", {
    shopId,
    ip:        ctx.ip,
    userAgent: ctx.userAgent,
    meta:      { invitedEmail: posAccess.email, role: posAccess.role, linkedEmployeeId: id },
  });

  const roleLabelMap = await buildRoleLabelMap(shopId);
  return fmtEmployee(updated, user, roleLabelMap);
}

/* ─── Revoke POS access from employee ───────────────────────── */

export async function revokeEmployeeAccess(
  shopId: number,
  id:     number,
  ctx: { ip?: string | null; userAgent?: string | null } = {},
): Promise<EmployeeDto> {
  const [e] = await db
    .select()
    .from(employeesTable)
    .where(and(eq(employeesTable.id, id), eq(employeesTable.shopId, shopId)));
  if (!e) throw new NotFoundError("কর্মী পাওয়া যায়নি");
  if (!e.userId) throw new ValidationError("এই কর্মীর কোনো POS অ্যাক্সেস নেই");

  const [user] = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.id, e.userId), eq(usersTable.shopId, shopId)));
  if (!user) throw new NotFoundError("ব্যবহারকারী পাওয়া যায়নি");

  if (user.supabaseUid) {
    await supabaseAdmin.auth.admin.deleteUser(user.supabaseUid).catch(() => null);
  }
  await db.delete(usersTable).where(eq(usersTable.id, user.id));

  const [updated] = await db
    .update(employeesTable)
    .set({ userId: null })
    .where(eq(employeesTable.id, id))
    .returning();

  await logAudit("user_deactivated", {
    shopId,
    ip:        ctx.ip,
    userAgent: ctx.userAgent,
    meta:      { revokedUserId: user.id, linkedEmployeeId: id },
  });

  const roleLabelMap = await buildRoleLabelMap(shopId);
  return fmtEmployee(updated, null, roleLabelMap);
}

/* ─── Next serial Employee Code ──────────────────────────────── */

export async function getNextEmployeeCode(shopId: number): Promise<string> {
  const rows = await db
    .select({ code: employeesTable.employeeCode })
    .from(employeesTable)
    .where(eq(employeesTable.shopId, shopId));

  let maxSerial = 0;
  const pattern = /^EMP-(\d+)$/i;

  for (const row of rows) {
    if (!row.code) continue;
    const m = pattern.exec(row.code);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > maxSerial) maxSerial = n;
    }
  }

  const next = maxSerial + 1;
  const padded = String(next).padStart(3, "0");
  return `EMP-${padded}`;
}

/* ─── Stats ──────────────────────────────────────────────────── */

export async function getEmployeeStats(shopId: number) {
  const all = await db
    .select()
    .from(employeesTable)
    .where(eq(employeesTable.shopId, shopId));

  const total       = all.length;
  const active      = all.filter((e) => e.status === "active").length;
  const inactive    = all.filter((e) => e.status === "inactive").length;
  const suspended   = all.filter((e) => e.status === "suspended").length;
  const resigned    = all.filter((e) => e.status === "resigned").length;
  const totalSalary = all
    .filter((e) => e.status === "active" && e.salary !== null)
    .reduce((sum, e) => sum + Number(e.salary), 0);

  const departments  = [...new Set(all.map((e) => e.department).filter(Boolean))];
  const designations = [...new Set(all.map((e) => e.designation).filter(Boolean))];

  return { total, active, inactive, suspended, resigned, totalSalary, departments, designations };
}
