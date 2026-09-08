import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
export declare class NotificationController {
    getAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    markAllAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getUnreadCount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
export declare const notificationController: NotificationController;
//# sourceMappingURL=notification.controller.d.ts.map