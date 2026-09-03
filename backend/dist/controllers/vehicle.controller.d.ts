import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
export declare class VehicleController {
    getAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getByQr(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
}
export declare const vehicleController: VehicleController;
//# sourceMappingURL=vehicle.controller.d.ts.map