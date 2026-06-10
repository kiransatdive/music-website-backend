import express from "express";
import {
  getAdminNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteAdminNotification,
  bulkDeleteAdminNotifications,
} from "../controllers/adminNotificationController.js";
import { authenticateAdmin } from "../middleware/adminAuthMiddleware.ts";

const router = express.Router();

router.get("/admin/notifications", authenticateAdmin, getAdminNotifications);
router.put("/admin/notifications/read-all", authenticateAdmin, markAllNotificationsAsRead);
router.put("/admin/notifications/:id/read", authenticateAdmin, markNotificationAsRead);
router.delete("/admin/notifications/bulk-delete", authenticateAdmin, bulkDeleteAdminNotifications);
router.delete("/admin/notifications/:id", authenticateAdmin, deleteAdminNotification);

export default router;
