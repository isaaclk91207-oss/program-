import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
export declare class TransportController {
    getAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    assignDriver(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getStats(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
}
export declare const transportController: TransportController;
//# sourceMappingURL=transport.controller.d.ts.map