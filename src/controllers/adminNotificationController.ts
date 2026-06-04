import { Request, Response } from "express";
import AdminNotification from "../models/AdminNotification.js";

export const getAdminNotifications = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await AdminNotification.findAndCountAll({
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    const unreadCount = await AdminNotification.count({
      where: { isRead: false },
    });

    return res.status(200).json({
      success: true,
      data: rows,
      unreadCount,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error: any) {
    console.error("Error fetching admin notifications:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin notifications",
      error: error.message,
    });
  }
};

export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const notification = await AdminNotification.findByPk(id);

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error: any) {
    console.error("Error marking notification as read:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
};

export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
  try {
    await AdminNotification.update({ isRead: true }, { where: { isRead: false } });

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error: any) {
    console.error("Error marking all notifications as read:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
      error: error.message,
    });
  }
};

export const deleteAdminNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const notification = await AdminNotification.findByPk(id);

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    await notification.destroy();

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting notification:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete notification",
      error: error.message,
    });
  }
};
