import { Router, type IRouter } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import * as permissionsService from "./permissions.service";

const router: IRouter = Router();

router.get("/role-permissions", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const matrix = await permissionsService.getRolePermissions(req.authUser!.shopId);
    res.json({
      matrix,
      roles:       permissionsService.ROLE_CATEGORIES,
      permissions: permissionsService.PERMISSION_KEYS,
      defaults:    permissionsService.DEFAULT_PERMISSIONS,
    });
  } catch (err) {
    next(err);
  }
});

router.put(
  "/role-permissions/:role",
  requireAuth,
  requireRole("admin"),
  async (req, res, next): Promise<void> => {
    try {
      const role = String(req.params["role"]);
      const permissions = req.body as Record<string, boolean>;
      if (typeof permissions !== "object" || permissions === null) {
        res.status(400).json({ error: "permissions must be an object" });
        return;
      }
      await permissionsService.updateRolePermissions(req.authUser!.shopId, role, permissions);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  "/role-permissions/:role/reset",
  requireAuth,
  requireRole("admin"),
  async (req, res, next): Promise<void> => {
    try {
      const role = String(req.params["role"]);
      await permissionsService.resetRolePermissions(req.authUser!.shopId, role);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
);

/* ─── User Roles (public read — used for designation dropdown) ─ */

router.get("/user-roles", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const roles = await permissionsService.listCustomRoles(req.authUser!.shopId);
    res.json(roles);
  } catch (err) {
    next(err);
  }
});

/* ─── Custom Roles ───────────────────────────────────────────── */

router.get("/custom-roles", requireAuth, requireRole("admin"), async (req, res, next): Promise<void> => {
  try {
    const roles = await permissionsService.listCustomRoles(req.authUser!.shopId);
    res.json(roles);
  } catch (err) {
    next(err);
  }
});

router.post("/custom-roles", requireAuth, requireRole("admin"), async (req, res, next): Promise<void> => {
  try {
    const { id, label, baseRole, dotIdx, initPerms } = req.body as {
      id: string;
      label: string;
      baseRole: string;
      dotIdx: number;
      initPerms: Record<string, boolean>;
    };
    if (!id || !label) {
      res.status(400).json({ error: "id and label are required" });
      return;
    }
    const role = await permissionsService.createCustomRole(
      req.authUser!.shopId,
      id,
      label,
      baseRole ?? "",
      dotIdx ?? 0,
      initPerms ?? {},
    );
    res.status(201).json(role);
  } catch (err) {
    next(err);
  }
});

router.delete("/custom-roles/:id", requireAuth, requireRole("admin"), async (req, res, next): Promise<void> => {
  try {
    const id = String(req.params["id"]);
    const deleted = await permissionsService.deleteCustomRole(req.authUser!.shopId, id);
    if (!deleted) {
      res.status(404).json({ error: "Custom role not found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
