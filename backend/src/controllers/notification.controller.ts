import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { notificationService } from "../services/notification.service";

export class NotificationController {
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
      }
      const { unreadOnly } = req.query;
      const notifications = await notificationService.getByRecipient(
        req.user.id,
        req.user.role,
        unreadOnly === "true"
      );
      res.json(notifications);
    } catch (err) {
      next(err);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { recipientId, recipientRole, title, message, relatedRequestId } = req.body;
      if (!recipientId || !recipientRole || !title || !message) {
        return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Missing required fields: recipientId, recipientRole, title, message" } });
      }
      const notification = await notificationService.create({
        recipientId,
        recipientRole,
        title,
        message,
        relatedRequestId,
      });
      res.status(201).json(notification);
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
      }
      await notificationService.markAsRead(req.params.id, req.user.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
      }
      await notificationService.markAllAsRead(req.user.id, req.user.role);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  async getUnreadCount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
      }
      const count = await notificationService.getUnreadCount(req.user.id, req.user.role);
      res.json({ count });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationController = new NotificationController();
