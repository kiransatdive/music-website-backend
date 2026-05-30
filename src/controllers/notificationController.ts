import { Response } from "express";
import { ArtistRequest } from "../middleware/artistAuthMiddleware.js";
import notificationService, {
  NotificationServiceError,
} from "../services/notificationService.js";

export const getNotifications = async (req: ArtistRequest, res: Response) => {
  try {
    const artistId = req.artist?.id;
    if (!artistId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const limit = parseInt(req.query.limit as string, 10) || 20;
    const offset = parseInt(req.query.offset as string, 10) || 0;

    const { rows, count } = await notificationService.getNotificationsByArtist(
      artistId,
      limit,
      offset,
    );

    res.status(200).json({
      success: true,
      data: rows,
      meta: {
        total: count,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("Get Notifications Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch notifications" });
  }
};

export const markAsRead = async (req: ArtistRequest, res: Response) => {
  try {
    const artistId = req.artist?.id;
    if (!artistId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const notificationId = parseInt(req.params.id, 10);
    if (isNaN(notificationId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid notification ID" });
    }

    const notification = await notificationService.markAsRead(
      notificationId,
      artistId,
    );

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    if (error instanceof NotificationServiceError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }
    console.error("Mark Notification Read Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to mark notification as read" });
  }
};

export const markAllAsRead = async (req: ArtistRequest, res: Response) => {
  try {
    const artistId = req.artist?.id;
    if (!artistId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await notificationService.markAllAsRead(artistId);

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark All Notifications Read Error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to mark notifications as read",
      });
  }
};

export const deleteNotification = async (req: ArtistRequest, res: Response) => {
  try {
    const artistId = req.artist?.id;
    if (!artistId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const notificationId = parseInt(req.params.id, 10);
    if (isNaN(notificationId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid notification ID" });
    }

    await notificationService.deleteNotification(notificationId, artistId);

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    if (error instanceof NotificationServiceError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }
    console.error("Delete Notification Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete notification" });
  }
};

export const bulkDeleteNotifications = async (req: ArtistRequest, res: Response) => {
  try {
    const artistId = req.artist?.id;
    if (!artistId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { notificationIds } = req.body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "An array of notificationIds is required" });
    }

    const validIds = notificationIds
      .map((id) => parseInt(id as string, 10))
      .filter((id) => !isNaN(id));

    if (validIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No valid notification IDs provided" });
    }

    const deletedCount = await notificationService.bulkDeleteNotifications(validIds, artistId);

    res.status(200).json({
      success: true,
      message: `${deletedCount} notification(s) deleted successfully`,
    });
  } catch (error) {
    if (error instanceof NotificationServiceError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }
    console.error("Bulk Delete Notifications Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to bulk delete notifications" });
  }
};
