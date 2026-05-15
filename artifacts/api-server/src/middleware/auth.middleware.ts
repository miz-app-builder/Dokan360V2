import { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import type { UserRole } from "@workspace/db";
import { supabaseAdmin } from "../lib/supabase";
import type { AuthenticatedUser } from "../common/types";
import { logger as rootLogger } from "../common/logger";

export type { AuthenticatedUser };

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "অনুমতি নেই — টোকেন প্রদান করুন" });
    return;
  }

  const token = authHeader.slice(7);

  const { data: { user: supaUser }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !supaUser) {
    res.status(401).json({ error: "টোকেন অবৈধ বা মেয়াদোত্তীর্ণ" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.supabaseUid, supaUser.id), eq(usersTable.isActive, true)));

  if (!user) {
    res.status(401).json({ error: "অ্যাকাউন্ট নিষ্ক্রিয় বা পাওয়া যায়নি" });
    return;
  }

  req.authUser = {
    id:       user.id,
    name:     user.name,
    email:    user.email,
    role:     user.role,
    shopId:   user.shopId,
    isActive: user.isActive,
  };

  (req as any).supabaseUid = supaUser.id;

  const reqWithLog = req as Request & { log?: typeof rootLogger };
  if (reqWithLog.log) {
    reqWithLog.log = reqWithLog.log.child({
      userId: user.id,
      shopId: user.shopId,
      role:   user.role,
    });
  }

  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.authUser;
    if (!user) {
      res.status(401).json({ error: "অনুমতি নেই" });
      return;
    }
    if (!roles.includes(user.role)) {
      res.status(403).json({
        error: `এই কাজের জন্য ${roles.join(" বা ")} ভূমিকা প্রয়োজন`,
      });
      return;
    }
    next();
  };
}

export function getShopId(req: Request): number {
  if (!req.authUser) throw new Error("requireAuth middleware not applied");
  return req.authUser.shopId;
}

export function getAuthUser(req: Request): AuthenticatedUser {
  if (!req.authUser) throw new Error("requireAuth middleware not applied");
  return req.authUser;
}

export function getUserId(req: Request): number {
  if (!req.authUser) throw new Error("requireAuth middleware not applied");
  return req.authUser.id;
}
