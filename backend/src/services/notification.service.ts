import { PrismaClient } from "@prisma/client";
import { createAppError } from "../middlewares/error.middleware";
import { NotificationResponse } from "../types";

const prisma = new PrismaClient();

export class NotificationService {
  async create(data: {
    recipientId: string;
    recipientRole: string;
    title: string;
    message: string;
    relatedRequestId?: string;
  }): Promise<NotificationResponse> {
    const notification = await prisma.notification.create({
      data: {
        recipientId: data.recipientId,
        recipientRole: data.recipientRole,
        title: data.title,
        message: data.message,
        relatedRequestId: data.relatedRequestId,
      },
    });

    return this.formatResponse(notification);
  }

  async getByRecipient(
    recipientId: string,
    recipientRole: string,
    unreadOnly = false
  ): Promise<NotificationResponse[]> {
    const where: Record<string, unknown> = {
      recipientId,
      recipientRole: recipientRole.toUpperCase(),
    };

    if (unreadOnly) {
      where.read = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return notifications.map(this.formatResponse);
  }

  async markAsRead(id: string, recipientId: string): Promise<void> {
    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification) {
      throw createAppError(404, "NOT_FOUND", "Notification not found");
    }

    if (notification.recipientId !== recipientId) {
      throw createAppError(403, "FORBIDDEN", "Cannot mark another user's notification as read");
    }

    await prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllAsRead(recipientId: string, recipientRole: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        recipientId,
        recipientRole: recipientRole.toUpperCase(),
        read: false,
      },
      data: { read: true },
    });
  }

  async getUnreadCount(recipientId: string, recipientRole: string): Promise<number> {
    return prisma.notification.count({
      where: {
        recipientId,
        recipientRole: recipientRole.toUpperCase(),
        read: false,
      },
    });
  }

  private formatResponse(n: {
    id: string;
    recipientId: string;
    recipientRole: string;
    title: string;
    message: string;
    read: boolean;
    relatedRequestId: string | null;
    createdAt: Date;
  }): NotificationResponse {
    return {
      id: n.id,
      recipientId: n.recipientId,
      recipientRole: n.recipientRole,
      title: n.title,
      message: n.message,
      read: n.read,
      relatedRequestId: n.relatedRequestId,
      createdAt: n.createdAt.toISOString(),
    };
  }
}

export const notificationService = new NotificationService();
