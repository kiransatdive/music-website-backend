import express from "express";
import {
  getAdminNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteAdminNotification,
} from "../controllers/adminNotificationController.js";
import { authenticateAdmin } from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.get("/admin/notifications", authenticateAdmin, getAdminNotifications);
router.put("/admin/notifications/read-all", authenticateAdmin, markAllNotificationsAsRead);
router.put("/admin/notifications/:id/read", authenticateAdmin, markNotificationAsRead);
router.delete("/admin/notifications/:id", authenticateAdmin, deleteAdminNotification);

export default router;
