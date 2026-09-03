import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
export declare class FeedbackController {
    submit(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getByDriver(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getDriverStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
}
export declare const feedbackController: FeedbackController;
//# sourceMappingURL=feedback.controller.d.ts.map