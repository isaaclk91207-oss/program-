"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = exports.NotificationController = void 0;
const notification_service_1 = require("../services/notification.service");
class NotificationController {
    async getAll(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
            }
            const { unreadOnly } = req.query;
            const notifications = await notification_service_1.notificationService.getByRecipient(req.user.id, req.user.role, unreadOnly === "true");
            res.json(notifications);
        }
        catch (err) {
            next(err);
        }
    }
    async create(req, res, next) {
        try {
            const { recipientId, recipientRole, title, message, relatedRequestId } = req.body;
            if (!recipientId || !recipientRole || !title || !message) {
                return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Missing required fields: recipientId, recipientRole, title, message" } });
            }
            const notification = await notification_service_1.notificationService.create({
                recipientId,
                recipientRole,
                title,
                message,
                relatedRequestId,
            });
            res.status(201).json(notification);
        }
        catch (err) {
            next(err);
        }
    }
    async markAsRead(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
            }
            await notification_service_1.notificationService.markAsRead(req.params.id, req.user.id);
            res.json({ success: true });
        }
        catch (err) {
            next(err);
        }
    }
    async markAllAsRead(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
            }
            await notification_service_1.notificationService.markAllAsRead(req.user.id, req.user.role);
            res.json({ success: true });
        }
        catch (err) {
            next(err);
        }
    }
    async getUnreadCount(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
            }
            const count = await notification_service_1.notificationService.getUnreadCount(req.user.id, req.user.role);
            res.json({ count });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.NotificationController = NotificationController;
exports.notificationController = new NotificationController();
//# sourceMappingURL=notification.controller.js.map