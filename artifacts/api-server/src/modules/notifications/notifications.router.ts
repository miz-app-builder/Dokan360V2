import { Router, type IRouter } from "express";
import { requireAuth, getShopId } from "../../middleware/auth.middleware";
import * as notificationsService from "./notifications.service";

const router: IRouter = Router();

router.get("/notifications", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const shopId = getShopId(req);
    await notificationsService.generateLowStockNotifications(shopId);
    await notificationsService.generateDueNotifications(shopId);
    const notifications = await notificationsService.listNotifications(shopId);
    res.json(notifications);
  } catch (err) { next(err); }
});

router.get("/notifications/count", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const shopId = getShopId(req);
    await notificationsService.generateLowStockNotifications(shopId);
    await notificationsService.generateDueNotifications(shopId);
    const count = await notificationsService.getUnreadCount(shopId);
    res.json({ count });
  } catch (err) { next(err); }
});

router.patch("/notifications/:id/read", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: "অবৈধ ID" }); return; }
    const notification = await notificationsService.markAsRead(getShopId(req), id);
    if (!notification) { res.status(404).json({ error: "বিজ্ঞপ্তি পাওয়া যায়নি" }); return; }
    res.json(notification);
  } catch (err) { next(err); }
});

router.post("/notifications/read-all", requireAuth, async (req, res, next): Promise<void> => {
  try {
    await notificationsService.markAllAsRead(getShopId(req));
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.delete("/notifications/:id", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: "অবৈধ ID" }); return; }
    await notificationsService.deleteNotification(getShopId(req), id);
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
