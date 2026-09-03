import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
export declare class AdminController {
    getDashboard(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getSettings(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    updateSettings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    exportData(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getNetprosStatus(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    triggerNetprosSync(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
}
export declare const adminController: AdminController;
//# sourceMappingURL=admin.controller.d.ts.map