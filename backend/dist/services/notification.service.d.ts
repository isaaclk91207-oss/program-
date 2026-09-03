import { NotificationResponse } from "../types";
export declare class NotificationService {
    create(data: {
        recipientId: string;
        recipientRole: string;
        title: string;
        message: string;
        relatedRequestId?: string;
    }): Promise<NotificationResponse>;
    getByRecipient(recipientId: string, recipientRole: string, unreadOnly?: boolean): Promise<NotificationResponse[]>;
    markAsRead(id: string, recipientId: string): Promise<void>;
    markAllAsRead(recipientId: string, recipientRole: string): Promise<void>;
    getUnreadCount(recipientId: string, recipientRole: string): Promise<number>;
    private formatResponse;
}
export declare const notificationService: NotificationService;
//# sourceMappingURL=notification.service.d.ts.map