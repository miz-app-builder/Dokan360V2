import { Router, type IRouter } from "express";
import { LoginBody, RegisterBody } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { authRateLimit, registerRateLimit, refreshRateLimit } from "../../middleware/rate-limit.middleware";
import * as authService from "./auth.service";
import { InviteUserSchema, UpdateUserSchema, UpdateShopSchema } from "./auth.service";
import type { Request } from "express";

const router: IRouter = Router();

function getCtx(req: Request) {
  return {
    ip:        req.ip ?? req.socket.remoteAddress ?? null,
    userAgent: req.headers["user-agent"] ?? null,
  };
}

router.post("/auth/login", authRateLimit, async (req, res, next): Promise<void> => {
  try {
    const parsed = LoginBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "অনুগ্রহ করে সঠিক তথ্য দিন" });
      return;
    }
    const result = await authService.loginUser(parsed.data.email, parsed.data.password, getCtx(req));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/auth/register", registerRateLimit, async (req, res, next): Promise<void> => {
  try {
    const parsed = RegisterBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "অনুগ্রহ করে সকল তথ্য সঠিকভাবে দিন" });
      return;
    }
    const result = await authService.registerShop(parsed.data, getCtx(req));
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/auth/me", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const result = await authService.getMe(req.authUser!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/auth/refresh", refreshRateLimit, async (req, res, next): Promise<void> => {
  try {
    const { refreshToken } = req.body ?? {};
    if (!refreshToken || typeof refreshToken !== "string") {
      res.status(400).json({ error: "রিফ্রেশ টোকেন প্রদান করুন" });
      return;
    }
    const result = await authService.refreshTokens(refreshToken, getCtx(req));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/auth/logout", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const supabaseUid = (req as any).supabaseUid as string | undefined;
    await authService.logoutUser(supabaseUid, getCtx(req));
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

router.get("/auth/users", requireAuth, requireRole("admin"), async (req, res, next): Promise<void> => {
  try {
    res.json(await authService.listShopUsers(req.authUser!.shopId));
  } catch (err) {
    next(err);
  }
});

router.post("/auth/users", requireAuth, requireRole("admin"), async (req, res, next): Promise<void> => {
  try {
    const parsed = InviteUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "তথ্য সঠিক নয়" });
      return;
    }
    const result = await authService.inviteUser(req.authUser!.shopId, parsed.data, getCtx(req));
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.patch("/auth/users/:id", requireAuth, requireRole("admin"), async (req, res, next): Promise<void> => {
  try {
    const targetId = parseInt(String(req.params.id), 10);
    if (isNaN(targetId)) {
      res.status(400).json({ error: "অবৈধ ব্যবহারকারী আইডি" });
      return;
    }
    const parsed = UpdateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "তথ্য সঠিক নয়" });
      return;
    }
    const result = await authService.updateUser(
      req.authUser!.shopId,
      targetId,
      req.authUser!.id,
      parsed.data,
      getCtx(req),
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.delete("/auth/users/:id", requireAuth, requireRole("admin"), async (req, res, next): Promise<void> => {
  try {
    const targetId = parseInt(String(req.params.id), 10);
    if (isNaN(targetId)) {
      res.status(400).json({ error: "অবৈধ ব্যবহারকারী আইডি" });
      return;
    }
    await authService.deactivateUser(req.authUser!.shopId, targetId, req.authUser!.id, getCtx(req));
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

router.get("/shop", requireAuth, async (req, res, next): Promise<void> => {
  try {
    res.json(await authService.getShop(req.authUser!.shopId));
  } catch (err) {
    next(err);
  }
});

router.patch("/shop", requireAuth, requireRole("admin"), async (req, res, next): Promise<void> => {
  try {
    const parsed = UpdateShopSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "তথ্য সঠিক নয়" });
      return;
    }
    const result = await authService.updateShop(req.authUser!.shopId, parsed.data);
    const { logAudit } = await import("./audit.service");
    void logAudit("settings_updated", {
      userId: req.authUser!.id,
      shopId: req.authUser!.shopId,
      ...getCtx(req),
      meta: { fields: Object.keys(parsed.data) },
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
