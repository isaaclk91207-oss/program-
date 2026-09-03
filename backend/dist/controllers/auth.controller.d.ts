import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
export declare class AuthController {
    login(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    register(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
export declare const authController: AuthController;
//# sourceMappingURL=auth.controller.d.ts.map