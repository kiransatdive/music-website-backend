import Notification from "../models/Notification.js";
import Artist from "../models/Artist.js";
import { sendNotificationEmail } from "./emailService.js";
import { Op } from "sequelize";

export class NotificationServiceError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "NotificationServiceError";
    this.statusCode = statusCode;
  }
}

export class NotificationService {
  async createNotification(
    artistId: number,
    title: string,
    message: string,
    type: string = "general",
    sendEmail: boolean = true,
  ): Promise<Notification> {
    try {
      const notification = await Notification.create({
        artistId,
        title,
        message,
        type,
      });

      // Fetch artist to get their email address if we need to send an email
      if (sendEmail) {
        const artist = await Artist.findByPk(artistId, {
          attributes: ["email"],
        });

        if (artist && artist.email) {
          // Send email in the background so it doesn't block the API response
          sendNotificationEmail(artist.email, title, message).catch((err) => {
            console.error("Error sending notification email:", err);
          });
        }
      }

      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw new NotificationServiceError("Failed to create notification", 500);
    }
  }

  async getNotificationsByArtist(
    artistId: number,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ rows: Notification[]; count: number }> {
    const { rows, count } = await Notification.findAndCountAll({
      where: { artistId },
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });
    return { rows, count };
  }

  async markAsRead(
    notificationId: number,
    artistId: number,
  ): Promise<Notification> {
    const notification = await Notification.findOne({
      where: { id: notificationId, artistId },
    });

    if (!notification) {
      throw new NotificationServiceError("Notification not found", 404);
    }

    await notification.update({ isRead: true });
    return notification;
  }

  async markAllAsRead(artistId: number): Promise<void> {
    await Notification.update(
      { isRead: true },
      { where: { artistId, isRead: false } },
    );
  }

  async deleteNotification(
    notificationId: number,
    artistId: number,
  ): Promise<void> {
    const notification = await Notification.findOne({
      where: { id: notificationId, artistId },
    });

    if (!notification) {
      throw new NotificationServiceError("Notification not found", 404);
    }

    await notification.destroy();
  }

  async bulkDeleteNotifications(
    notificationIds: number[],
    artistId: number,
  ): Promise<number> {
    if (!notificationIds || notificationIds.length === 0) {
      throw new NotificationServiceError("No notification IDs provided", 400);
    }

    const deletedCount = await Notification.destroy({
      where: {
        id: {
          [Op.in]: notificationIds,
        },
        artistId,
      },
    });

    return deletedCount;
  }
}

export default new NotificationService();
