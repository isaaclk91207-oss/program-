import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
export declare class DriverController {
    getAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    updateAssessment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getFeedback(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getCertSummary(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getAllAssessments(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getPassengers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
}
export declare const driverController: DriverController;
//# sourceMappingURL=driver.controller.d.ts.map