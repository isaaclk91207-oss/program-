"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const client_1 = require("@prisma/client");
const error_middleware_1 = require("../middlewares/error.middleware");
const prisma = new client_1.PrismaClient();
class NotificationService {
    async create(data) {
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
    async getByRecipient(recipientId, recipientRole, unreadOnly = false) {
        const where = {
            recipientId,
            recipientRole,
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
    async markAsRead(id, recipientId) {
        const notification = await prisma.notification.findUnique({ where: { id } });
        if (!notification) {
            throw (0, error_middleware_1.createAppError)(404, "NOT_FOUND", "Notification not found");
        }
        if (notification.recipientId !== recipientId) {
            throw (0, error_middleware_1.createAppError)(403, "FORBIDDEN", "Cannot mark another user's notification as read");
        }
        await prisma.notification.update({
            where: { id },
            data: { read: true },
        });
    }
    async markAllAsRead(recipientId, recipientRole) {
        await prisma.notification.updateMany({
            where: {
                recipientId,
                recipientRole,
                read: false,
            },
            data: { read: true },
        });
    }
    async getUnreadCount(recipientId, recipientRole) {
        return prisma.notification.count({
            where: {
                recipientId,
                recipientRole,
                read: false,
            },
        });
    }
    formatResponse(n) {
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
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
//# sourceMappingURL=notification.service.js.map